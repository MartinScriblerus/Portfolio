#!/usr/bin/env node

/**
 * Scrape ChucK documentation AND examples from chuck.stanford.edu
 * Does DFS traversal to find all .ck files in subdirectories
 * 
 * Usage:
 *   node scripts/scrape-chuck-docs-v2.js [--url https://chuck.stanford.edu/doc/reference/] [--validate]
 *   
 *   --validate: Optionally validate .ck files by attempting to run them (requires chuckRef/WebChucK)
 */

const puppeteer = require('puppeteer');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Import helper functions from examples scraper
const { transformFileToContentString, extractUGens, extractExampleUsage } = require('./scrape-chuck-examples.js');

/**
 * Normalize example_usage to always be an array (never null)
 * Exported for use by other scripts
 */
function normalizeExampleUsage(usage) {
  if (!usage || usage === null) return [];
  if (Array.isArray(usage)) return usage;
  if (typeof usage === 'string') return usage.trim().length > 0 ? [usage] : [];
  return [];
}

/**
 * Normalize example_usage to always be an array (never null)
 * Exported for use by other scripts
 */
function normalizeExampleUsage(usage) {
  if (!usage || usage === null) return [];
  if (Array.isArray(usage)) return usage;
  if (typeof usage === 'string') return usage.trim().length > 0 ? [usage] : [];
  return [];
}

/**
 * Extract instantiated objects/UGens from ChucK code
 * Returns array of { type, name } objects
 */
function extractObjectInstances(code) {
  const instances = [];
  const lines = code.split('\n');
  
  // Patterns to match:
  // SinOsc osc;
  // SinOsc osc => dac;
  // SinOsc osc => blackhole;
  // int a[10];
  // Machine.help(); (static class calls)
  
  // More flexible pattern that handles => connections
  const declarationPattern = /^\s*([A-Z][a-zA-Z0-9_]*)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*[;=&>]/;
  const staticClassPattern = /^\s*([A-Z][a-zA-Z0-9_]*)\.help\s*\(/; // Static class help calls
  
  const seenNames = new Set();
  const seenTypes = new Set(); // For static classes
  
  for (const line of lines) {
    // Skip comments
    if (line.trim().startsWith('//')) continue;
    
    // Match class/type declarations
    let match = line.match(declarationPattern);
    if (match) {
      const type = match[1];
      const name = match[2];
      // Filter out common non-UGen types that don't have useful help()
      if (!['int', 'float', 'string', 'dur', 'time', 'void', 'Event'].includes(type)) {
        if (!seenNames.has(name)) {
          instances.push({ type, name });
          seenNames.add(name);
        }
      }
      continue;
    }
    
    // Match static class help calls (like Machine.help())
    match = line.match(staticClassPattern);
    if (match) {
      const type = match[1];
      if (!seenTypes.has(type) && type !== 'Event') {
        instances.push({ type, name: null }); // name is null for static classes
        seenTypes.add(type);
      }
    }
  }
  
  // Deduplicate by type if name is null (static classes)
  const result = [];
  const seenStaticTypes = new Set();
  
  for (const inst of instances) {
    if (inst.name === null) {
      if (!seenStaticTypes.has(inst.type)) {
        result.push(inst);
        seenStaticTypes.add(inst.type);
      }
    } else {
      result.push(inst);
    }
  }
  
  return result;
}

/**
 * Generate a minimal script that just instantiates objects and calls .help()
 * This is safer than trying to run full original code which may have loops
 */
function generateHelpOnlyScript(instances) {
  if (instances.length === 0) return null;
  
  const lines = [
    '// Auto-generated help extraction script',
    '// Instantiate objects and call .help() on them',
    ''
  ];
  
  // Build object declarations and help calls
  for (const { type, name } of instances) {
    if (type.includes('[]')) {
      // Skip arrays - help() on arrays is not well-defined
      lines.push(`// ${type} ${name || 'array'}; // Array - skipping help()`);
    } else if (name === null) {
      // Static class - call help directly
      lines.push(`// Static class: ${type}`);
      lines.push(`${type}.help();`);
      lines.push('');
    } else {
      // Instance object - instantiate and call help()
      lines.push(`// ${type} ${name};`);
      
      // Audio UGens that need connection (to avoid compilation errors)
      const audioUGens = ['SinOsc', 'SawOsc', 'SqrOsc', 'TriOsc', 'PulseOsc', 'Noise', 'Impulse', 
                          'BlitSaw', 'BlitSquare', 'SndBuf', 'WvIn', 'WvOut'];
      
      if (audioUGens.includes(type)) {
        // Audio UGens - connect to blackhole to avoid audio output during help extraction
        lines.push(`${type} ${name};`);
        lines.push(`${name} => blackhole;`);
        lines.push(`${name}.help();`);
      } else if (['Machine', 'Shred', 'Math', 'Std'].includes(type)) {
        // These are static classes even if instantiated - call on type
        lines.push(`${type}.help();`);
      } else {
        // Regular instantiation - try with default constructor
        lines.push(`${type} ${name};`);
        lines.push(`if (${name} != null) ${name}.help();`);
      }
      lines.push('');
    }
  }
  
  // Add a delay to ensure help output completes
  // help() can output a lot of text (inheritance chains, functions, etc.)
  lines.push('500::ms => now;'); // Increased delay for help() to complete output
  
  return lines.join('\n');
}

/**
 * Helper: Wait for a specified number of milliseconds
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch text content directly via HTTP/HTTPS (more reliable for .ck files)
 */
function fetchText(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, { timeout: 10000 }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      
      let data = '';
      res.setEncoding('utf8');
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve(data);
      });
      
      res.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Parse ChucK docs URL to extract path structure
 */
function parseDocsUrl(url) {
  // https://chuck.stanford.edu/doc/examples/midi/
  const match = url.match(/chuck\.stanford\.edu\/doc\/(.*)/);
  if (match) {
    return match[1]; // e.g., "examples/midi/"
  }
  return '';
}

/**
 * Scrape a single .ck file from ChucK docs site
 * Uses direct HTTP fetch (more reliable than Puppeteer for plain text files)
 * 
 * @param {string} fileUrl - URL of the .ck file
 * @param {number} retries - Number of retry attempts
 * @param {Object} page - Optional Puppeteer page for help() extraction
 * @param {boolean} extractHelp - Whether to extract help() output
 */
async function scrapeChuckFile(fileUrl, retries = 2, page = null, extractHelp = false) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Fetch .ck file directly via HTTPS (they're plain text)
      const content = await fetchText(fileUrl);
      
      if (!content || content.trim().length === 0) {
        return null; // Empty file
      }
      
      // Process the content
      const fileLines = content.split('\n').map(line => line.trim());
      const formattedContent = transformFileToContentString(fileLines);
      
      // Extract metadata
      const ugens = extractUGens(formattedContent);
      const exampleUsage = extractExampleUsage(formattedContent);
      
      // Get file path for ID/title
      const urlParts = fileUrl.split('/');
      const fileName = urlParts[urlParts.length - 1].replace('.ck', '');
      const category = urlParts[urlParts.length - 2] || 'examples';
      
      // Build example_usage as array - enhance with help() output if requested
      let exampleUsageArray = [];
      if (exampleUsage && exampleUsage.trim().length > 0) {
        exampleUsageArray.push(exampleUsage);
      }
      
      // Try to extract help() output if page is provided and extractHelp is enabled
      if (extractHelp && page) {
        try {
          const helpResult = await getHelpOutput(page, formattedContent);
          if (helpResult && helpResult.helpText) {
            const helpSection = `--- Help Output ---\n${helpResult.helpText}`;
            exampleUsageArray.push(helpSection);
          }
        } catch (error) {
          // Silently fail - help extraction is optional
        }
      }
      
      const entry = {
        id: `chuck-examples_${category}-${fileName}`,
        title: `${fileName} (${category})`,
        type: 'code',
        language: 'chuck',
        tool: 'webchuck',
        content: formattedContent,
        perceptual_tags: [],
        technical_tags: [],
        params: {
          ugens: ugens
        },
        example_usage: normalizeExampleUsage(exampleUsageArray),
        license: 'cc-by',
        source_url: fileUrl
      };
      
      return entry;
      
    } catch (error) {
      if (attempt < retries) {
        // Retry with exponential backoff
        await delay(500 * (attempt + 1));
        continue;
      }
      // All retries exhausted
      throw error;
    }
  }
  
  return null; // Should not reach here
}

/**
 * DFS traversal: Find all .ck files in a directory
 */
async function dfsFindChuckFiles(page, baseUrl, currentPath = '', entries = [], depth = 0, visited = new Set()) {
  // Safety: limit recursion depth
  if (depth > 10) {
    console.log(`  ⚠️  Max depth reached, stopping at ${currentPath}`);
    return entries;
  }
  
  const currentUrl = baseUrl.endsWith('/') 
    ? `${baseUrl}${currentPath}` 
    : `${baseUrl}/${currentPath}`;
  
  // Skip if already visited (avoid duplicates from query params, etc.)
  if (visited.has(currentUrl)) {
    return entries;
  }
  visited.add(currentUrl);
  
  console.log(`📁 Scanning: ${currentPath || '(root)'}`);
  
  try {
    // Check if page is still valid, create new one if detached
    let pageToUse = page;
    let isPageValid = false;
    
    try {
      // Quick test - if this fails, page is detached
      await page.evaluate(() => document.title);
      isPageValid = true;
    } catch (e) {
      // Page is detached
      isPageValid = false;
    }
    
    if (!isPageValid) {
      console.log(`  🔄 Page detached, creating new page...`);
      try {
        const browser = page.browser();
        if (browser) {
          pageToUse = await browser.newPage();
        }
      } catch (browserError) {
        // Browser might be closed, will throw in navigation
        pageToUse = page;
      }
    }
    
    try {
      await pageToUse.goto(currentUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await delay(1500); // Let page render
    } catch (navError) {
      // If navigation fails due to detached page, try with fresh page
      if (navError.message.includes('detached') || navError.message.includes('Target closed') || navError.message.includes('Target page')) {
        console.log(`  🔄 Navigation failed (${navError.message}), retrying with fresh page...`);
        try {
          const browser = page.browser();
          if (browser) {
            pageToUse = await browser.newPage();
            await pageToUse.goto(currentUrl, { waitUntil: 'networkidle2', timeout: 30000 });
            await delay(1500);
          } else {
            throw new Error('Browser closed');
          }
        } catch (retryError) {
          console.error(`  ❌ Could not recover from navigation error: ${retryError.message}`);
          return entries; // Return what we have so far
        }
      } else {
        // Some other error
        throw navError;
      }
    }
    
    // Extract directory listing - ChucK docs site structure
    const items = await pageToUse.evaluate(() => {
      const found = [];
      const seen = new Set();
      
      // Look for links - ChucK docs usually list files/dirs as links
      const links = Array.from(document.querySelectorAll('a[href]'));
      
      for (const link of links) {
        const href = link.getAttribute('href');
        const text = link.textContent.trim();
        
        if (!href || !text) continue;
        
        // Skip navigation links, query params, and sorting links
        if (href.includes('#') || 
            href.startsWith('javascript:') || 
            href === '/' ||
            href.includes('?C=') || // Sorting links like ?C=N;O=D
            href.includes('?D=') ||
            text === 'Name' || text === 'Last modified' || text === 'Size' || 
            text === 'Description' || text === 'Parent Directory' ||
            text.includes('directory:') ||
            text.includes('download page') ||
            text === 'folder' ||
            text === 'data files') continue;
        
        // Resolve relative URLs
        let fullUrl;
        try {
          fullUrl = new URL(href, window.location.href).href;
          // Remove query params and fragments
          fullUrl = fullUrl.split('?')[0].split('#')[0];
        } catch (e) {
          continue;
        }
        
        // Only process same-domain links
        if (!fullUrl.includes('chuck.stanford.edu/doc/examples/')) continue;
        
        // Skip if already seen
        if (seen.has(fullUrl)) continue;
        seen.add(fullUrl);
        
        // Check if it's a .ck file
        if (text.endsWith('.ck') || href.endsWith('.ck') || fullUrl.endsWith('.ck')) {
          found.push({
            name: text.replace('.ck', '') || href.split('/').pop().replace('.ck', ''),
            url: fullUrl,
            type: 'file'
          });
        }
        // Check if it's a directory (ends with /, no extension, or is a known directory pattern)
        else if (href.endsWith('/') || (!text.includes('.') && !fullUrl.match(/\.[a-z]+$/i))) {
          // Skip parent directory links and known non-directory items
          if (text === '..' || text === '../' || href === '../') continue;
          
          // Extract clean directory name
          const dirName = text || href.split('/').filter(Boolean).pop();
          if (!dirName || dirName.length === 0) continue;
          
          found.push({
            name: dirName,
            url: fullUrl.endsWith('/') ? fullUrl : `${fullUrl}/`,
            type: 'dir'
          });
        }
      }
      
      return found;
    });
    
    console.log(`    Found ${items.length} items`);
    
    // Process files first (pre-order, but we'll collect them)
    const files = items.filter(item => item.type === 'file');
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // Note: extractHelp disabled during DFS for speed
        // Can be enabled via options if needed
        const entry = await scrapeChuckFile(file.url, 2, pageToUse, false);
        if (entry) {
          entries.push(entry);
          console.log(`      ✅ [${i + 1}/${files.length}] ${file.name}`);
        } else {
          console.log(`      ⚠️  [${i + 1}/${files.length}] ${file.name} - skipped (empty/invalid)`);
        }
        await delay(150); // Rate limiting (faster since we're using direct HTTP)
      } catch (error) {
        console.error(`      ❌ [${i + 1}/${files.length}] ${file.name}: ${error.message}`);
        // Continue with next file
      }
    }
    
    // Then recurse into directories
    const dirs = items.filter(item => item.type === 'dir');
    for (const dir of dirs) {
      // Skip if URL already visited
      if (visited.has(dir.url)) continue;
      
      const nextPath = currentPath ? `${currentPath}/${dir.name}` : dir.name;
      // Use the potentially new page for recursion, pass visited set
      await dfsFindChuckFiles(pageToUse, baseUrl, nextPath, entries, depth + 1, visited);
    }
    
  } catch (error) {
    console.error(`  ❌ Error scanning ${currentPath}:`, error.message);
  }
  
  return entries;
}

/**
 * Find all documentation pages (HTML docs, not .ck files)
 */
async function findDocPages(browser, baseUrl) {
  console.log(`🔍 Finding documentation pages...`);
  
  // Use a fresh page for documentation scraping
  let page;
  try {
    page = await browser.newPage();
    await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(3000);
  } catch (error) {
    if (error.message.includes('detached') || error.message.includes('Target closed')) {
      page = await browser.newPage();
      await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await delay(3000);
    } else {
      throw error;
    }
  }
  
  const docLinks = await page.evaluate((base) => {
    const links = new Set();
    const allLinks = Array.from(document.querySelectorAll('a[href]'));
    
    for (const link of allLinks) {
      const href = link.getAttribute('href');
      if (!href) continue;
      
      try {
        const fullUrl = new URL(href, base).href;
        
        // Include documentation pages (HTML, not .ck files)
        if (fullUrl.includes('chuck.stanford.edu/doc/') &&
            (fullUrl.endsWith('.html') || fullUrl.includes('/reference/') || fullUrl.includes('/ugen') || fullUrl.includes('/stk')) &&
            !fullUrl.endsWith('.ck') &&
            !fullUrl.match(/\.(pdf|zip|jpg|png|gif)$/i)) {
          links.add(fullUrl.split('#')[0]);
        }
      } catch (e) {
        continue;
      }
    }
    
    return Array.from(links);
  }, baseUrl);
  
  console.log(`  Found ${docLinks.length} documentation pages\n`);
  
  await page.close();
  return docLinks;
}

/**
 * Scrape a documentation HTML page
 */
async function scrapeDocPage(page, url) {
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(2000);
    
    const docData = await page.evaluate(() => {
      const main = document.querySelector('main, article, .content, #content, body');
      if (!main) return null;
      
      // Remove navigation
      const toRemove = main.querySelectorAll('nav, header, footer, .nav, .sidebar');
      toRemove.forEach(el => el.remove());
      
      const title = document.querySelector('h1, .title')?.textContent.trim() || 
                    document.title.split(' - ')[0].trim() || '';
      
      const paragraphs = Array.from(main.querySelectorAll('p, li, dt, dd'))
        .map(el => el.textContent.trim())
        .filter(text => text.length > 20);
      
      const codeBlocks = Array.from(main.querySelectorAll('pre code, pre, code'))
        .map(el => el.textContent.trim())
        .filter(text => text.length > 10);
      
      return {
        title,
        paragraphs,
        codeBlocks,
        fullText: main.textContent
      };
    });
    
    if (!docData || !docData.title) return null;
    
    const content = [
      `# ${docData.title}`,
      ...docData.paragraphs,
      ...(docData.codeBlocks.length > 0 ? ['\n## Code Examples:', ...docData.codeBlocks] : [])
    ].join('\n\n');
    
    const ugens = extractUGens(content);
    const techTags = [];
    const lowerContent = content.toLowerCase();
    ['filter', 'oscillator', 'envelope', 'delay', 'reverb', 'synthesis'].forEach(term => {
      if (lowerContent.includes(term)) techTags.push(term);
    });
    
    const urlParts = url.split('/');
    const category = urlParts[urlParts.length - 2] || 'reference';
    
    return {
      id: `chuck-doc_${category}-${docData.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      title: docData.title,
      type: 'doc',
      language: 'chuck',
      tool: 'webchuck',
      content: content,
      perceptual_tags: [],
      technical_tags: techTags,
      params: { ugens: ugens },
      example_usage: normalizeExampleUsage(docData.codeBlocks && docData.codeBlocks.length > 0 ? [docData.codeBlocks[0]] : []),
      license: 'cc-by',
      source_url: url
    };
    
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    return null;
  }
}

/**
 * Extract technical keywords from help() output
 * Returns array of meaningful technical terms to add to technical_tags
 */
function extractTechnicalTagsFromHelp(helpText) {
  if (!helpText || helpText.trim().length === 0) return [];
  
  const tags = new Set();
  const lines = helpText.split('\n').map(l => l.trim()).filter(Boolean);
  
  for (const line of lines) {
    // Extract class names (usually at start of help output)
    const classMatch = line.match(/^\s*class\s+(\w+)/i);
    if (classMatch) {
      const className = classMatch[1];
      tags.add(className.toLowerCase());
    }
    
    // Extract parent/inherited classes (look for "extends" or "inherits")
    const extendsMatch = line.match(/(?:extends|inherits?|parent:)\s+(\w+)/i);
    if (extendsMatch) {
      tags.add(extendsMatch[1].toLowerCase());
    }
    
    // Extract function/method names (look for function signatures)
    // Pattern: function_name(... or function_name(...args...
    const funcMatches = line.match(/\b([a-z][a-zA-Z0-9_]+)\s*\(/g);
    if (funcMatches) {
      funcMatches.forEach(match => {
        const funcName = match.replace(/\s*\(/, '');
        // Skip common/generic function names
        if (!['if', 'for', 'while', 'fun', 'void', 'int', 'float', 'string'].includes(funcName)) {
          tags.add(funcName.toLowerCase());
        }
      });
    }
    
    // Extract domain terms (look for common DSP terms)
    const dspTerms = ['oscillator', 'filter', 'envelope', 'delay', 'reverb', 'synthesis', 
                      'generator', 'effect', 'modulator', 'analyzer', 'processor'];
    dspTerms.forEach(term => {
      if (line.toLowerCase().includes(term)) {
        tags.add(term);
      }
    });
  }
  
  // Convert to array and filter out very short tags
  return Array.from(tags).filter(tag => tag.length >= 3 && tag.length <= 30);
}

/**
 * Get help() output for objects in ChucK code using WebChucK in browser
 * Returns { helpText, technicalTags } where technicalTags are extracted keywords
 */
async function getHelpOutput(page, code, timeoutMs = 10000) {
  try {
    // Extract object instances from code
    const instances = extractObjectInstances(code);
    if (instances.length === 0) {
      console.log(`      (No objects found for help extraction)`);
      return null; // No objects to get help for
    }
    
    console.log(`      (Found ${instances.length} objects: ${instances.map(i => i.type).join(', ')})`);
    
    // Generate help-only script (safer than running full code which may have loops)
    const helpScript = generateHelpOnlyScript(instances);
    if (!helpScript) return null;
    
    // Execute in page context with WebChucK
    const helpOutput = await page.evaluate(async (script, timeout, instancesInfo) => {
      // Ensure WebChucK is available (should already be loaded)
      if (typeof window.Chuck === 'undefined') {
        return { error: 'WebChucK not available', output: '' };
      }
      
      // Storage for captured output - use array to preserve order
      const allOutput = [];
      let captureActive = false;
      
      // Override chuckPrint to capture ChucK's print output (help() uses this)
      // Store original function reference
      let originalChuckPrint = null;
      
      const captureChuckPrint = (message) => {
        if (!captureActive) return; // Only capture during our script execution
        
        const msg = String(message);
        allOutput.push(msg);
        // Also call original to see in console for debugging
        if (originalChuckPrint) {
          originalChuckPrint.call(this, '[CAPTURED] ' + msg);
        }
      };
      
      try {
        // Initialize WebChucK if needed (use a fresh instance to avoid conflicts)
        let chuck = window.validationChuck;
        if (!chuck) {
          chuck = await window.Chuck.init([]);
          window.validationChuck = chuck;
          
          // Resume audio context if suspended (required for some browsers)
          if (chuck.context.state === 'suspended') {
            await chuck.context.resume();
          }
        }
        
        // Save original chuckPrint and override it BEFORE running code
        originalChuckPrint = chuck.chuckPrint;
        
        // Clear any previous output
        allOutput.length = 0;
        captureActive = true;
        
        // Set up capture BEFORE running code
        chuck.chuckPrint = captureChuckPrint;
        
        console.log(`[Help Extraction] Running help script for ${instancesInfo.length} objects...`);
        
        // Run the help script
        const runPromise = chuck.runCode(script);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Script execution timeout')), timeout)
        );
        
        await Promise.race([runPromise, timeoutPromise]);
        
        // Wait longer for help() output to fully flush - help() can output many lines
        // and may take time to format all the inheritance/function info
        console.log(`[Help Extraction] Waiting for help() output to flush...`);
        await new Promise(resolve => setTimeout(resolve, 3000)); // Increased wait time
        
        // Disable capture
        captureActive = false;
        
        console.log(`[Help Extraction] Captured ${allOutput.length} lines from chuckPrint`);
        
        // Debug: log first few lines to see what we got
        if (allOutput.length > 0) {
          console.log(`[Help Extraction] First 5 lines:`, allOutput.slice(0, 5));
        }
        
        // Extract help() output - help() outputs detailed structured text including:
        // - Class name and inheritance chain
        // - All functions (including inherited)
        // - Documentation strings
        
        // Don't filter too aggressively - keep all captured output since help() format is valuable
        const helpLines = allOutput
          .map(line => line.trim())
          .filter(line => {
            if (!line || line.length === 0) return false;
            
            const lower = line.toLowerCase();
            // Only filter obvious error messages, but keep everything else
            // (including lines that might look like errors but are part of help output)
            if (lower.startsWith('error:') && !lower.includes('class') && !lower.includes('type')) {
              // Filter out standalone error messages that aren't part of help output
              return false;
            }
            
            // Keep all other lines - help() output is valuable
            return true;
          });
        
        const helpText = helpLines.join('\n');
        console.log(`[Help Extraction] Returning ${helpLines.length} help lines (${helpText.length} chars)`);
        
        if (helpText.length === 0) {
          console.log(`[Help Extraction] No output captured`);
          console.log(`[Help Extraction] This might mean:`);
          console.log(`  - Objects don't support help()`);
          console.log(`  - Instantiation failed`);
          console.log(`  - chuckPrint override didn't work`);
          // Return debug info
          return { 
            output: '', 
            debug: `No output captured. Total lines captured: ${allOutput.length}`,
            allOutput: allOutput.slice(0, 10) // First 10 for debugging
          };
        }
        
        return { output: helpText, source: 'chuckPrint', lineCount: helpLines.length };
        
      } catch (error) {
        // If execution fails, that's okay - help extraction is optional
        console.error(`[Help Extraction] Error:`, error.message);
        captureActive = false;
        return { 
          error: error.message, 
          output: allOutput.length > 0 ? allOutput.join('\n') : '',
          debug: `Error occurred. Captured ${allOutput.length} lines before error.`
        };
      } finally {
        // Always restore original chuckPrint
        captureActive = false;
        if (originalChuckPrint && chuck && chuck.chuckPrint === captureChuckPrint) {
          chuck.chuckPrint = originalChuckPrint;
          console.log(`[Help Extraction] Restored original chuckPrint`);
        }
      }
    }, helpScript, timeoutMs, instances);
    
    if (helpOutput && helpOutput.output && helpOutput.output.trim().length > 0) {
      const charCount = helpOutput.output.length;
      const lineCount = helpOutput.lineCount || helpOutput.output.split('\n').length;
      console.log(`      ✅ Help extracted: ${lineCount} lines, ${charCount} chars (from ${helpOutput.source || 'chuckPrint'})`);
      
      // Extract technical tags from help output
      const technicalTags = extractTechnicalTagsFromHelp(helpOutput.output);
      if (technicalTags.length > 0) {
        console.log(`         Extracted ${technicalTags.length} technical tags: ${technicalTags.slice(0, 5).join(', ')}${technicalTags.length > 5 ? '...' : ''}`);
      }
      
      // Show preview of first line to confirm it's help output
      const firstLine = helpOutput.output.split('\n')[0].substring(0, 60);
      if (firstLine) {
        console.log(`         Preview: "${firstLine}..."`);
      }
      
      return {
        helpText: helpOutput.output,
        technicalTags: technicalTags
      };
    } else {
      console.log(`      ⚠️  No help output captured`);
      if (helpOutput) {
        if (helpOutput.error) {
          console.log(`         Error: ${helpOutput.error}`);
        }
        if (helpOutput.debug) {
          console.log(`         Debug: ${helpOutput.debug}`);
        }
        if (helpOutput.allOutput && helpOutput.allOutput.length > 0) {
          console.log(`         First few captured lines:`, helpOutput.allOutput.slice(0, 3));
        }
      }
      return { helpText: null, technicalTags: [] };
    }
    
  } catch (error) {
    // Fail gracefully - help extraction is optional
    console.log(`      ⚠️  Help extraction failed: ${error.message}`);
    return null;
  }
}

/**
 * Detect FileIO operations that WebChucK doesn't support
 * FileIO is the main unsupported I/O class in WebChucK
 */
function detectUnsupportedIO(code) {
  // Primary check: FileIO class instantiation
  if (/\bFileIO\s+\w+\s*[;=]/.test(code) || 
      /\bFileIO\s+\w+\s*=>/.test(code) ||
      /new\s+FileIO/.test(code)) {
    return { 
      unsupported: true, 
      feature: 'FileIO',
      reason: 'FileIO not supported in WebChucK' 
    };
  }
  
  // Check for FileIO method calls (common patterns)
  const fileIOMethods = [
    /\.open\s*\(/,
    /\.close\s*\(/,
    /\.good\s*\(/,
    /\.eof\s*\(/,
    /\.more\s*\(/,
    /\.size\s*\(/,
    /\.readInt\s*\(/,
    /\.readFloat\s*\(/,
    /\.readString\s*\(/,
    /\.readLine\s*\(/,
    /\.readToken\s*\(/,
    /\.readByte\s*\(/,
    /\.writeInt\s*\(/,
    /\.writeFloat\s*\(/,
    /\.writeString\s*\(/,
    /\.writeByte\s*\(/,
    /\.seek\s*\(/,
    /\.flush\s*\(/,
  ];
  
  // Check if code has FileIO-style operations (these methods are FileIO-specific)
  // But be careful - some might be on other objects, so we check context
  const codeLower = code.toLowerCase();
  
  // If we see FileIO-specific method patterns AND they're likely FileIO calls
  // (not on FileIO class definition, but actual usage)
  for (const pattern of fileIOMethods) {
    if (pattern.test(code)) {
      // Additional context check: if there's a FileIO variable nearby
      // Look backwards a bit to see if there's FileIO declaration
      const match = code.match(new RegExp(`(\\w+)\\s*${pattern.source.replace(/\\/g, '')}`));
      if (match) {
        const varName = match[1];
        // Check if this variable was declared as FileIO
        const beforeMatch = code.substring(0, code.indexOf(match[0]));
        if (new RegExp(`FileIO\\s+${varName}\\s*[;=]`, 'i').test(beforeMatch)) {
          return { 
            unsupported: true, 
            feature: 'FileIO methods',
            reason: 'FileIO operations not supported in WebChucK' 
          };
        }
      }
    }
  }
  
  // Check for common FileIO usage patterns in ChucK examples
  // Like: FileIO fio; fio.open("file.txt", FileIO.READ);
  if (/FileIO\s*\.\s*(READ|WRITE|APPEND)/i.test(code)) {
    return { 
      unsupported: true, 
      feature: 'FileIO constants',
      reason: 'FileIO not supported in WebChucK' 
    };
  }
  
  return { unsupported: false };
}

/**
 * Validate .ck file by attempting to run it in WebChucK
 */
async function validateChuckCode(page, code) {
  // First check for unsupported IO operations
  const ioCheck = detectUnsupportedIO(code);
  if (ioCheck.unsupported) {
    return { valid: false, error: ioCheck.reason, ioUnsupported: true };
  }
  
  // Basic syntax checks
  if (!code.includes('=>') && !code.includes('dac') && !code.includes('Dac') && !code.includes('help()')) {
    // Some code might be valid without connections (like type definitions)
    // But we'll still check runtime
  }
  
  // Check for balanced braces
  const openBraces = (code.match(/{/g) || []).length;
  const closeBraces = (code.match(/}/g) || []).length;
  if (openBraces !== closeBraces) {
    return { valid: false, error: 'Unbalanced braces' };
  }
  
  // If page provided, try actual execution
  if (page) {
    try {
      const execResult = await page.evaluate(async (chuckCode) => {
        if (typeof window.Chuck === 'undefined') {
          return { error: 'WebChucK not available' };
        }
        
        let chuck = window.validationChuck;
        if (!chuck) {
          chuck = await window.Chuck.init([]);
          window.validationChuck = chuck;
        }
        
        const errors = [];
        const originalPrint = chuck.chuckPrint;
        
        // Capture errors from chuckPrint (ChucK outputs errors there too)
        chuck.chuckPrint = (msg) => {
          const msgStr = String(msg);
          if (msgStr.toLowerCase().includes('error') || 
              msgStr.toLowerCase().includes('cannot') ||
              msgStr.toLowerCase().includes('not found') ||
              msgStr.toLowerCase().includes('unsupported')) {
            errors.push(msgStr);
          }
          originalPrint(msg);
        };
        
        try {
          // Try to run code - wrap in try/catch for timeout protection
          const codeToRun = chuckCode.length > 5000 
            ? chuckCode.slice(0, 5000) + '\n// ... truncated for validation'
            : chuckCode;
          
          // Add timeout wrapper to prevent infinite loops
          const wrappedCode = `
            // Validation wrapper - prevents infinite loops
            fun void runWithTimeout() {
              ${codeToRun}
              100::ms => now;
            }
            spork ~ runWithTimeout();
            500::ms => now;
          `;
          
          await Promise.race([
            chuck.runCode(wrappedCode),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Code execution timeout')), 3000)
            )
          ]);
          
          // Wait a bit for any errors to surface
          await new Promise(resolve => setTimeout(resolve, 500));
          
          if (errors.length > 0) {
            return { error: errors.join('; ') };
          }
          
          return { valid: true };
          
        } catch (error) {
          // Check if it's a known unsupported feature error
          const errorMsg = error.message.toLowerCase();
          if (errorMsg.includes('fileio') || 
              errorMsg.includes('file') ||
              errorMsg.includes('io') ||
              errorMsg.includes('not found') ||
              errorMsg.includes('unsupported')) {
            return { 
              valid: false, 
              error: `WebChucK runtime error: ${error.message}`,
              runtimeError: true 
            };
          }
          
          // Other runtime errors
          return { 
            valid: false, 
            error: `Runtime error: ${error.message}`,
            runtimeError: true 
          };
        } finally {
          chuck.chuckPrint = originalPrint;
        }
      }, code);
      
      if (execResult.error) {
        return { valid: false, error: execResult.error, runtimeError: execResult.runtimeError };
      }
      
      return execResult;
      
    } catch (error) {
      // If execution check fails, fall back to syntax check
      return { valid: true, warning: `Could not run validation: ${error.message}` };
    }
  }
  
  // No page provided, just syntax check
  return { valid: true };
}

/**
 * Enhanced validation with help() extraction
 */
async function validateAndExtractHelp(page, code) {
  // Run actual validation with WebChucK execution
  const validation = await validateChuckCode(page, code);
  
  // If validation failed due to IO or runtime errors, skip help extraction
  if (!validation.valid && (validation.ioUnsupported || validation.runtimeError)) {
    return {
      ...validation,
      helpOutput: null
    };
  }
  
  // Try to get help output (optional, may fail)
  let helpOutput = null;
  let helpTechnicalTags = [];
  if (validation.valid) {
    try {
      const helpResult = await getHelpOutput(page, code);
      if (helpResult) {
        helpOutput = helpResult.helpText;
        helpTechnicalTags = helpResult.technicalTags || [];
      }
    } catch (error) {
      // Silently fail - help extraction is optional
    }
  }
  
  return {
    ...validation,
    helpOutput,
    helpTechnicalTags
  };
}

/**
 * Main scraping function
 */
async function scrapeChuckDocs(baseUrl, options = {}) {
  const { validate = false } = options;
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  const allEntries = [];
  
  try {
    // Part 1: Find and scrape all .ck example files using DFS
    console.log('═══════════════════════════════════════════');
    console.log('PART 1: Finding .ck Example Files (DFS)');
    console.log('═══════════════════════════════════════════\n');
    
    // Start from examples directory
    const examplesUrl = baseUrl.replace('/reference/', '/examples/');
    console.log(`Starting DFS from: ${examplesUrl}\n`);
    
    const visited = new Set();
    const exampleEntries = await dfsFindChuckFiles(page, examplesUrl, '', [], 0, visited);
    console.log(`\n✅ Found ${exampleEntries.length} .ck example files\n`);
    
    // Optionally validate and extract help()
    if (validate) {
      console.log('🔍 Validating code and extracting help() output...');
      console.log('  (This requires WebChucK in browser - may take longer)\n');
      
      // Create a dedicated page for validation/help extraction
      const validationPage = await browser.newPage();
      
      // Load a simple HTML page with WebChucK
      console.log('  📦 Loading WebChucK validation page...');
      try {
        await validationPage.setContent(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <script src="https://chuck.stanford.edu/webchuck/src/webchuck.js" onerror="window.webchuckError = true;"></script>
            </head>
            <body>
              <div id="status">Loading WebChucK...</div>
              <script>
                // Track loading state
                window.webchuckLoaded = false;
                window.webchuckError = false;
                
                // Check if already loaded
                if (typeof window.Chuck !== 'undefined') {
                  window.webchuckLoaded = true;
                  document.getElementById('status').textContent = 'WebChucK ready';
                }
                
                // Wait for script to load
                window.addEventListener('load', () => {
                  setTimeout(() => {
                    if (typeof window.Chuck !== 'undefined') {
                      window.webchuckLoaded = true;
                      document.getElementById('status').textContent = 'WebChucK ready';
                    } else if (window.webchuckError) {
                      document.getElementById('status').textContent = 'WebChucK load error';
                    }
                  }, 2000);
                });
                
                // Poll for Chuck availability
                let attempts = 0;
                const checkInterval = setInterval(() => {
                  attempts++;
                  if (typeof window.Chuck !== 'undefined') {
                    window.webchuckLoaded = true;
                    document.getElementById('status').textContent = 'WebChucK ready';
                    clearInterval(checkInterval);
                  } else if (attempts > 20 || window.webchuckError) {
                    clearInterval(checkInterval);
                  }
                }, 500);
              </script>
            </body>
          </html>
        `, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // Wait for WebChucK to be available with better error handling
        console.log('  ⏳ Waiting for WebChucK to initialize (max 20s)...');
        
        let webchuckLoaded = false;
        try {
          // Use Promise.race to have more control over timeout
          const waitPromise = validationPage.waitForFunction(
            () => {
              try {
                return typeof window.Chuck !== 'undefined' || window.webchuckError;
              } catch (e) {
                return false;
              }
            }, 
            { 
              timeout: 20000,
              polling: 500 // Check every 500ms for faster detection
            }
          );
          
          // Race against a manual timeout to ensure we catch it
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('WebChucK load timeout (20s)')), 21000)
          );
          
          await Promise.race([waitPromise, timeoutPromise]);
          
          // Check if it actually loaded
          const webchuckStatus = await validationPage.evaluate(() => {
            try {
              return {
                loaded: typeof window.Chuck !== 'undefined',
                error: window.webchuckError || false,
                chuckAvailable: typeof window.Chuck !== 'undefined'
              };
            } catch (e) {
              return { loaded: false, error: true, chuckAvailable: false };
            }
          });
          
          if (!webchuckStatus.loaded || !webchuckStatus.chuckAvailable || webchuckStatus.error) {
            throw new Error('WebChucK failed to load - script error or timeout');
          }
          
          webchuckLoaded = true;
          console.log('  ✅ WebChucK loaded successfully');
          await delay(1000); // Give it a moment to fully initialize
          
        } catch (error) {
          // Catch both TimeoutError and our custom timeout
          const errorName = error.constructor?.name || 'Error';
          const isTimeout = errorName.includes('Timeout') || error.message?.includes('timeout');
          
          console.error(`  ⚠️  WebChucK failed to load${isTimeout ? ' (timeout)' : ''}`);
          console.error(`     Error: ${error.message || errorName}`);
          console.error('     This may be due to:');
          console.error('     - Network issues (CDN unavailable)');
          console.error('     - Firewall/security blocking external scripts');
          console.error('     - Slow internet connection');
          console.error('     - WebChucK CDN server issues');
          console.error('');
          console.error('     Continuing WITHOUT validation/help extraction...');
          console.error('     Entries will be saved without help() output');
          console.error('');
          
          try {
            await validationPage.close();
          } catch (closeError) {
            // Ignore close errors
          }
          
      // Continue without validation - normalize example_usage and return entries as-is
      exampleEntries.forEach(entry => {
        if (!entry.example_usage || entry.example_usage === null || !Array.isArray(entry.example_usage)) {
          entry.example_usage = entry.example_usage ? [entry.example_usage] : [];
        }
      });
      allEntries.push(...exampleEntries);
      console.log(`✅ Scraping complete without validation! Found ${exampleEntries.length} entries\n`);
      return allEntries;
        }
      } catch (loadError) {
        console.error('  ❌ Failed to load validation page:', loadError.message);
        console.error('     Continuing without validation...');
        await validationPage.close();
        // Normalize example_usage before adding
        exampleEntries.forEach(entry => {
          entry.example_usage = normalizeExampleUsage(entry.example_usage);
        });
        allEntries.push(...exampleEntries);
        return allEntries;
      }
      
      // Double-check WebChucK is actually available before proceeding
      const finalCheck = await validationPage.evaluate(() => {
        return typeof window.Chuck !== 'undefined';
      });
      
      if (!finalCheck) {
        console.error('  ❌ WebChucK not available after loading - skipping validation');
        await validationPage.close();
        // Normalize example_usage before adding
        exampleEntries.forEach(entry => {
          entry.example_usage = normalizeExampleUsage(entry.example_usage);
        });
        allEntries.push(...exampleEntries);
        console.log(`✅ Scraping complete without validation! Found ${exampleEntries.length} entries\n`);
        return allEntries;
      }
      
      const validated = [];
      let helpCount = 0;
      
      for (let i = 0; i < exampleEntries.length; i++) {
        const entry = exampleEntries[i];
        console.log(`  [${i + 1}/${exampleEntries.length}] ${entry.id}...`);
        
        try {
          const result = await validateAndExtractHelp(validationPage, entry.content);
          
          if (result.valid) {
            // Ensure example_usage is initialized as array
            entry.example_usage = normalizeExampleUsage(entry.example_usage);
            
            // Append help output to example_usage if available
            if (result.helpOutput && result.helpOutput.trim().length > 0) {
              const helpSection = `--- Help Output ---\n${result.helpOutput}`;
              
              // If there's existing usage, add help as new item, otherwise replace
              if (entry.example_usage.length > 0) {
                entry.example_usage.push(helpSection);
              } else {
                entry.example_usage = [helpSection];
              }
              
              // Add extracted technical tags from help output
              if (result.helpTechnicalTags && result.helpTechnicalTags.length > 0) {
                // Merge with existing technical_tags (deduplicate)
                const existingTags = new Set((entry.technical_tags || []).map(t => t.toLowerCase()));
                result.helpTechnicalTags.forEach(tag => {
                  if (!existingTags.has(tag.toLowerCase())) {
                    entry.technical_tags = entry.technical_tags || [];
                    entry.technical_tags.push(tag);
                  }
                });
                console.log(`    ✅ Valid + Help extracted + ${result.helpTechnicalTags.length} tech tags`);
              } else {
                console.log(`    ✅ Valid + Help extracted`);
              }
              
              helpCount++;
            } else {
              // Ensure example_usage is array (not null) even if no help output
              if (!entry.example_usage || !Array.isArray(entry.example_usage)) {
                entry.example_usage = entry.example_usage ? [entry.example_usage] : [];
              }
              validated.push(entry);
              console.log(`    ✅ Valid (no help output)`);
            }
          } else {
            // Filter out invalid entries (especially IO-related)
            if (result.ioUnsupported) {
              console.log(`    ❌ Filtered: ${result.error}`);
              // Don't add to validated - skip this entry
            } else {
              // Include entries with other validation issues (might be false positives)
              // Ensure example_usage is array
              entry.example_usage = normalizeExampleUsage(entry.example_usage);
              validated.push(entry);
              console.log(`    ⚠️  Validation issue: ${result.error} (included anyway)`);
            }
          }
        } catch (error) {
          // If validation/help extraction fails, still include the entry
          // (help extraction is optional)
          // Ensure example_usage is array
          entry.example_usage = normalizeExampleUsage(entry.example_usage);
          validated.push(entry);
          console.log(`    ⚠️  Error: ${error.message} (included anyway)`);
        }
        
        await delay(300); // Small delay between validations
      }
      
      console.log(`\n📊 Help extraction summary: ${helpCount}/${exampleEntries.length} entries got help output`);
      console.log(`📊 Filtered entries: ${exampleEntries.length - validated.length} entries removed (likely FileIO or runtime errors)`);
      
      await validationPage.close();
      // Final normalization of validated entries (should already be normalized, but ensure it)
      validated.forEach(entry => {
        entry.example_usage = normalizeExampleUsage(entry.example_usage);
      });
      allEntries.push(...validated);
      console.log(`\n✅ Validated: ${validated.length}/${exampleEntries.length} files passed\n`);
    } else {
      // Normalize example_usage before adding (when validation is disabled)
      exampleEntries.forEach(entry => {
        entry.example_usage = normalizeExampleUsage(entry.example_usage);
      });
      allEntries.push(...exampleEntries);
    }
    
    // Part 2: Scrape HTML documentation pages
    console.log('═══════════════════════════════════════════');
    console.log('PART 2: Scraping Documentation Pages');
    console.log('═══════════════════════════════════════════\n');
    
    const docLinks = await findDocPages(browser, baseUrl);
    
    for (let i = 0; i < docLinks.length; i++) {
      console.log(`[${i + 1}/${docLinks.length}]`);
      const entry = await scrapeDocPage(page, docLinks[i]);
      if (entry) {
        // Normalize example_usage to array
        entry.example_usage = normalizeExampleUsage(entry.example_usage);
        allEntries.push(entry);
        console.log(`  ✅ ${entry.title}`);
      }
      await delay(500);
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  } finally {
    await browser.close();
  }
  
  return allEntries;
}

/**
 * Main function
 */
async function main() {
  const argv = process.argv.slice(2);
  const urlIdx = argv.indexOf('--url');
  const baseUrl = urlIdx !== -1 && argv[urlIdx + 1]
    ? argv[urlIdx + 1]
    : 'https://chuck.stanford.edu/doc/reference/';
  
  const validate = argv.includes('--validate');
  
  console.log('🚀 Starting ChucK documentation + examples scraper v2...');
  console.log(`📍 Target URL: ${baseUrl}`);
  if (validate) {
    console.log('✅ Validation + Help extraction enabled');
    console.log('   - Will extract .help() output for objects/UGens');
    console.log('   - Requires WebChucK in browser (slower but adds documentation)');
  } else {
    console.log('ℹ️  Run with --validate to extract .help() documentation');
  }
  console.log('');
  
  try {
    const entries = await scrapeChuckDocs(baseUrl, { validate });
    
    console.log('');
    console.log(`✅ Scraping complete! Found ${entries.length} total entries`);
    
    // Save to JSON file
    const outputPath = path.join(__dirname, '../data/dsp-training-samples-chuck-docs.json');
    fs.writeFileSync(
      outputPath,
      JSON.stringify(entries, null, 2),
      'utf8'
    );
    
    console.log(`💾 Saved to: ${outputPath}`);
    console.log('');
    console.log('📊 Summary:');
    console.log(`   Total entries: ${entries.length}`);
    
    const byType = {};
    entries.forEach(e => {
      byType[e.type] = (byType[e.type] || 0) + 1;
    });
    
    console.log('   By type:');
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`     ${type}: ${count}`);
    });
    
    const totalUGens = entries.reduce((sum, e) => sum + (e.params?.ugens?.length || 0), 0);
    console.log(`   Total UGens: ${totalUGens}`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { 
  scrapeChuckDocs, 
  dfsFindChuckFiles, 
  validateChuckCode, 
  detectUnsupportedIO
};
