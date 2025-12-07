#!/usr/bin/env node

/**
 * Scrape ChucK code examples from GitHub webchuck-ide repository
 * Version 2: Uses GitHub API for more reliable access
 * 
 * Usage:
 *   node scripts/scrape-chuck-examples-v2.js [--url https://github.com/ccrma/webchuck-ide/tree/main/public/examples]
 *   
 * Note: GitHub API has rate limits (60 requests/hour without auth, 5000/hour with auth)
 * For better results, set GITHUB_TOKEN environment variable
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Import helper functions from original script
const { transformFileToContentString, extractUGens, extractExampleUsage } = require('./scrape-chuck-examples.js');

/**
 * Fetch from GitHub API or raw content
 */
function fetchGitHub(url, isAPI = false) {
  return new Promise((resolve, reject) => {
    const token = process.env.GITHUB_TOKEN;
    const headers = {
      'User-Agent': 'ChucK-Examples-Scraper',
      'Accept': 'application/vnd.github.v3+json'
    };
    
    if (token && isAPI) {
      headers['Authorization'] = `token ${token}`;
    }
    
    https.get(url, { headers }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Parse GitHub URL to get owner, repo, and path
 */
function parseGitHubUrl(url) {
  // https://github.com/ccrma/webchuck-ide/tree/main/public/examples
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)\/tree\/([^\/]+)\/(.*)/);
  if (match) {
    return {
      owner: match[1],
      repo: match[2],
      branch: match[3],
      path: match[4]
    };
  }
  return null;
}

/**
 * Get folder contents using GitHub API
 */
async function getFolderContents(owner, repo, branch, folderPath) {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${folderPath}?ref=${branch}`;
  
  try {
    const data = await fetchGitHub(apiUrl, true);
    return JSON.parse(data);
  } catch (error) {
    console.error(`  ⚠️  API failed, trying raw access for ${folderPath}:`, error.message);
    return null;
  }
}

/**
 * Get raw file content
 */
async function getFileContent(owner, repo, branch, filePath) {
  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
  
  try {
    return await fetchGitHub(rawUrl, false);
  } catch (error) {
    throw new Error(`Failed to fetch ${rawUrl}: ${error.message}`);
  }
}

/**
 * DFS traversal using GitHub API
 */
async function scrapeGitHubFolderAPI(baseUrl) {
  const urlParts = parseGitHubUrl(baseUrl);
  if (!urlParts) {
    throw new Error(`Invalid GitHub URL: ${baseUrl}`);
  }
  
  const { owner, repo, branch, path: basePath } = urlParts;
  const entries = [];
  
  console.log(`Using GitHub API to scrape:`);
  console.log(`  Owner: ${owner}`);
  console.log(`  Repo: ${repo}`);
  console.log(`  Branch: ${branch}`);
  console.log(`  Path: ${basePath}`);
  console.log('');
  
  /**
   * Recursively process folder
   */
  async function dfsScrapeFolder(folderPath) {
    const displayPath = folderPath || '(root)';
    console.log(`📁 Scanning: ${displayPath}`);
    
    const contents = await getFolderContents(owner, repo, branch, folderPath || basePath);
    
    if (!contents || !Array.isArray(contents)) {
      console.log(`  ⚠️  No contents found or API rate limited`);
      return;
    }
    
    // Process files first
    for (const item of contents) {
      if (item.type === 'file' && item.name.endsWith('.ck')) {
        console.log(`  📄 Processing: ${item.name}`);
        
        try {
          // Get file content
          const filePath = folderPath ? `${folderPath}/${item.name}` : item.name;
          const fullPath = basePath ? `${basePath}/${filePath}` : filePath;
          const content = await getFileContent(owner, repo, branch, fullPath);
          
          const fileLines = content.split('\n').map(line => line.trim());
          const formattedContent = transformFileToContentString(fileLines);
          
          // Extract metadata
          const ugens = extractUGens(formattedContent);
          const exampleUsage = extractExampleUsage(formattedContent);
          
          // Create entry
          const pathParts = folderPath ? folderPath.split('/') : [];
          const folderName = pathParts.length > 0 ? pathParts[pathParts.length - 1] : 'root';
          const fileName = item.name.replace('.ck', '');
          
          const entry = {
            id: `chuck-code_${folderName}-${fileName}`,
            title: `${fileName} (${folderName})`,
            type: 'code',
            language: 'chuck',
            tool: 'webchuck',
            content: formattedContent,
            perceptual_tags: [],
            technical_tags: [],
            params: {
              ugens: ugens
            },
            example_usage: exampleUsage ? [exampleUsage] : [],
            license: 'cc-by',
            source_url: item.html_url || `https://github.com/${owner}/${repo}/blob/${branch}/${fullPath}`
          };
          
          entries.push(entry);
          console.log(`    ✅ Created: ${entry.id} (${ugens.length} UGens)`);
          
          // Rate limiting: wait a bit between requests
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          console.error(`    ❌ Error processing ${item.name}:`, error.message);
        }
      }
    }
    
    // Process subdirectories
    for (const item of contents) {
      if (item.type === 'dir') {
        const nextPath = folderPath ? `${folderPath}/${item.name}` : item.name;
        await dfsScrapeFolder(nextPath);
      }
    }
  }
  
  await dfsScrapeFolder('');
  
  // Also try to get moreExamples.json if it exists
  try {
    console.log('\n📦 Checking for moreExamples.json...');
    const moreExamplesPath = basePath ? `${basePath}/moreExamples.json` : 'moreExamples.json';
    const moreExamplesContent = await getFileContent(owner, repo, branch, moreExamplesPath);
    const moreExamplesData = JSON.parse(moreExamplesContent);
    
    console.log(`  Found moreExamples.json with ${typeof moreExamplesData === 'object' ? Object.keys(moreExamplesData).length : 'unknown'} categories`);
    
    // Parse moreExamples.json structure
    // Structure: { category: [ { "filename.ck": { name, code } }, ... ] }
    if (typeof moreExamplesData === 'object' && !Array.isArray(moreExamplesData)) {
      // It's an object with categories
      for (const [category, examples] of Object.entries(moreExamplesData)) {
        if (Array.isArray(examples)) {
          for (const exampleItem of examples) {
            // Each item is like: { "help.ck": { name: "help.ck", code: "..." } }
            if (typeof exampleItem === 'object' && exampleItem !== null) {
              // Get the first (and only) key which is the filename
              const fileKey = Object.keys(exampleItem)[0];
              const exampleData = exampleItem[fileKey];
              
              if (exampleData && typeof exampleData === 'object') {
                const code = exampleData.code || exampleData.source || '';
                const name = exampleData.name || fileKey || 'unnamed';
                
                if (code && code.trim().length > 0) {
                  const fileLines = code.split('\n').map(line => line.trim());
                  const formattedContent = transformFileToContentString(fileLines);
                  const ugens = extractUGens(formattedContent);
                  const exampleUsage = extractExampleUsage(formattedContent);
                  
                  const fileName = name.replace('.ck', '');
                  const entry = {
                    id: `chuck-code_${category}-${fileName}`,
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
                    example_usage: exampleUsage ? [exampleUsage] : [],
                    license: 'cc-by',
                    source_url: `https://github.com/${owner}/${repo}/blob/${branch}/${moreExamplesPath}#${category}-${fileKey}`
                  };
                  
                  entries.push(entry);
                  console.log(`    ✅ Added from moreExamples.json: ${entry.id} (${ugens.length} UGens)`);
                }
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.log(`  ℹ️  moreExamples.json not found or couldn't be parsed: ${error.message}`);
  }
  
  return entries;
}

/**
 * Main function
 */
async function main() {
  const argv = process.argv.slice(2);
  const urlIdx = argv.indexOf('--url');
  const baseUrl = urlIdx !== -1 && argv[urlIdx + 1]
    ? argv[urlIdx + 1]
    : 'https://github.com/ccrma/webchuck-ide/tree/main/public/examples';
  
  console.log('🚀 Starting ChucK examples scraper (GitHub API version)...');
  console.log(`📍 Target URL: ${baseUrl}`);
  
  if (process.env.GITHUB_TOKEN) {
    console.log('✅ Using GitHub token for higher rate limits');
  } else {
    console.log('⚠️  No GITHUB_TOKEN set - limited to 60 requests/hour');
    console.log('   Set GITHUB_TOKEN env var for 5000 requests/hour');
  }
  console.log('');
  
  try {
    const entries = await scrapeGitHubFolderAPI(baseUrl);
    
    console.log('');
    console.log(`✅ Scraping complete! Found ${entries.length} ChucK files`);
    
    // Save to JSON file
    const outputPath = path.join(__dirname, '../data/dsp-training-samples-chuck.json');
    fs.writeFileSync(
      outputPath,
      JSON.stringify(entries, null, 2),
      'utf8'
    );
    
    console.log(`💾 Saved to: ${outputPath}`);
    console.log('');
    console.log('📊 Summary:');
    console.log(`   Total entries: ${entries.length}`);
    
    const totalUGens = entries.reduce((sum, e) => sum + (e.params?.ugens?.length || 0), 0);
    console.log(`   Total UGens found: ${totalUGens}`);
    
    const withUsage = entries.filter(e => e.example_usage).length;
    console.log(`   Entries with usage notes: ${withUsage}`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    if (error.message.includes('403') || error.message.includes('rate limit')) {
      console.error('');
      console.error('💡 Tip: Set GITHUB_TOKEN environment variable to increase rate limits');
      console.error('   Get token from: https://github.com/settings/tokens');
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { scrapeGitHubFolderAPI, parseGitHubUrl };
