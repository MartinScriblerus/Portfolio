/*
 * Parse Oblique Strategies from the PDF
 * Usage: npm run parse:oblique-strategies
 * 
 * This script:
 * 1. Fetches the PDF from monoskop.org
 * 2. Extracts text using pdf-parse
 * 3. Parses out all Oblique Strategies
 * 4. Outputs as JSON array
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Check if pdf-parse is available (optional)
let pdfParse;
let hasPdfParse = false;
try {
  pdfParse = require('pdf-parse');
  hasPdfParse = true;
} catch (e) {
  console.log('ℹ️  pdf-parse not found. Using pre-extracted strategies.');
  console.log('   To parse PDF directly, install: npm install pdf-parse');
}

const PDF_URL = 'https://monoskop.org/images/8/8c/Eno_Brian_Schmidt_Peter_Oblique_Strategies.pdf';
const OUTPUT_FILE = path.join(__dirname, '../data/oblique-strategies.json');

// Ensure data directory exists
const dataDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

/**
 * Download PDF from URL
 */
function downloadPDF(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download PDF: ${response.statusCode}`));
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Extract Oblique Strategies from text
 * Based on the PDF structure, strategies are separated by newlines and dashes
 */
function extractStrategies(text) {
  const strategies = [];
  
  // Split by common separators and clean up
  const lines = text
    .split(/\n+/)
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  // Remove header/footer content
  const startIndex = lines.findIndex(line => 
    line.toLowerCase().includes('oblique') || 
    line.toLowerCase().includes('reality of the situation')
  );
  
  const endIndex = lines.findIndex((line, idx) => 
    idx > startIndex && (
      line.toLowerCase().includes('be less critical') ||
      line.match(/^[-—–\s]+$/) // Just dashes/separators
    )
  );
  
  const relevantLines = startIndex >= 0 
    ? lines.slice(startIndex, endIndex > 0 ? endIndex : undefined)
    : lines;
  
  // Extract strategies - they're typically:
  // 1. Single lines that are questions or statements
  // 2. Not empty
  // 3. Not just separators (---)
  // 4. Not page numbers or headers
  
  let currentStrategy = '';
  
  for (const line of relevantLines) {
    // Skip separators, page numbers, headers
    if (
      line.match(/^[-—–\s]+$/) ||
      line.match(/^\d+$/) ||
      line.toLowerCase().includes('oblique strategies') ||
      line.toLowerCase().includes('cluster analysis') ||
      line.toLowerCase().includes('work at a different speed') ||
      line.match(/^[|─\s]+$/) // Table separators
    ) {
      if (currentStrategy) {
        strategies.push(currentStrategy.trim());
        currentStrategy = '';
      }
      continue;
    }
    
    // Check if this looks like a strategy
    // Strategies are usually:
    // - Questions (start with "What", "How", "Are", etc.)
    // - Imperatives (start with verb)
    // - Statements
    // - Not too long (usually < 200 chars)
    
    if (line.length > 5 && line.length < 200) {
      // Check if it's a continuation of previous strategy
      if (currentStrategy && !line.match(/^[A-Z]/)) {
        currentStrategy += ' ' + line;
      } else {
        if (currentStrategy) {
          strategies.push(currentStrategy.trim());
        }
        currentStrategy = line;
      }
    } else if (currentStrategy) {
      // Line is too long or too short, might be a separator
      strategies.push(currentStrategy.trim());
      currentStrategy = '';
    }
  }
  
  // Add last strategy
  if (currentStrategy) {
    strategies.push(currentStrategy.trim());
  }
  
  // Clean and deduplicate
  return strategies
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .filter((s, idx, arr) => arr.indexOf(s) === idx) // Remove duplicates
    .filter(s => {
      // Filter out obvious non-strategies
      return !s.match(/^[|─\s]+$/) && 
             !s.match(/^\d+$/) &&
             s.length > 3;
    });
}

/**
 * Alternative: Use pre-extracted strategies from web search
 * This is a fallback if PDF parsing doesn't work well
 */
function getPreExtractedStrategies() {
  return [
    "What is the reality of the situation?",
    "Are there sections? Consider transitions",
    "Turn it upside down",
    "Allow an easement (an easement is the abandonment of a stricture)",
    "Simple subtraction",
    "Remove specifics and convert to ambiguities",
    "Go slowly all the way round the outside",
    "Make an exhaustive list of everything you might do and do the last thing on the list",
    "Into the impossible",
    "Ask people to work against their better judgment",
    "Take away the elements in order of apparent non-importance",
    "Change instrument roles",
    "Accretion",
    "Disconnect from desire",
    "Emphasize repetitions",
    "Don't be afraid of things because they're easy to do",
    "Don't be frightened to display your talents",
    "Breathe more deeply",
    "Honor thy error as a hidden intention",
    "Only one element of each kind",
    "Is there something missing?",
    "Use unqualified people",
    "How would you have done it?",
    "Emphasize differences",
    "Do nothing for as long as possible",
    "You don't have to be ashamed of using your own ideas",
    "Tidy up",
    "Do the words need changing?",
    "Ask your body",
    "Water",
    "Make a sudden, destructive unpredictable action; incorporate",
    "Consult other sources",
    "Use an unacceptable color",
    "Humanize something free of error",
    "Use filters",
    "Fill every beat with something",
    "Discard an axiom",
    "What wouldn't you do?",
    "Decorate, decorate",
    "Balance the consistency principle with the inconsistency principle",
    "Listen to the quiet voice",
    "Is it finished?",
    "Put in earplugs",
    "Give the game away",
    "Abandon normal instruments",
    "Use fewer notes",
    "Repetition is a form of change",
    "Give way to your worst impulse",
    "Trust in the you of now",
    "What would your closest friend do?",
    "Distorting time",
    "Make a blank valuable by putting it in an exquisite frame",
    "Ghost echoes",
    "You can only make one dot at a time",
    "Just carry on (Organic) machinery",
    "Don't break the silence",
    "Discover the recipes you are using and abandon them",
    "Cascades",
    "Courage!",
    "What mistakes did you make last time?",
    "Consider different fading systems",
    "Mute and continue",
    "It is quite possible (after all)",
    "Don't stress one thing more than another",
    "You are an engineer",
    "Remove ambiguities and convert to specifics",
    "Look at the order in which you do things",
    "Go outside. Shut the door.",
    "Do we need holes?",
    "Work at a different speed",
    "Do something boring",
    "Look closely at the most embarrassing details and amplify them",
    "Define an area as 'safe' and use it as an anchor",
    "Mechanicalize something idiosyncratic",
    "Overtly resist change",
    "Emphasize the flaws",
    "Accept advice",
    "Remember those quiet evenings",
    "Short circuit (example; a man eating peas with the idea that they will improve his virility shovels them straight into his lap)",
    "Use an old idea",
    "Destroy -nothing -the most important thing",
    "Change nothing and continue with immaculate consistency",
    "The tape is now the music",
    "Imagine the music as a moving chain or caterpillar",
    "Intentions -credibility of -nobility of -humility of",
    "Imagine the music as a set of disconnected events",
    "Imagine the piece as a set of disconnected events",
    "What are you really thinking about just now? Incorporate.",
    "The most important thing is the thing most easily forgotten",
    "Idiot glee",
    "Be extravagant",
    "State the problem in words as clearly as possible",
    "Disciplined self-indulgence",
    "Always first steps",
    "Question the heroic approach",
    "Always give yourself credit for having more than personality",
    "Faced with a choice, do both",
    "Get your neck massaged",
    "Do the washing up",
    "Convert a melodic element into a rhythmic element",
    "Spectrum analysis",
    "Twist the spine",
    "Lowest common denominator check -single bent -single note -single riff",
    "Listen in total darkness, or in a very large room, very quietly",
    "Would anybody want it?",
    "Retrace your steps",
    "Go to an extreme, move back to a more comfortable place",
    "Once the search is in progress, something will be found",
    "Only a part, not the whole",
    "From nothing to more than nothing",
    "Be less critical more often"
  ];
}

async function main() {
  let strategies;
  
  if (hasPdfParse) {
    console.log('📄 Fetching Oblique Strategies PDF...');
    
    try {
      // Download PDF
      const pdfBuffer = await downloadPDF(PDF_URL);
      console.log(`✅ Downloaded PDF (${pdfBuffer.length} bytes)`);
      
      // Parse PDF
      console.log('📖 Parsing PDF...');
      const data = await pdfParse(pdfBuffer);
      const text = data.text;
      
      console.log(`✅ Extracted ${text.length} characters of text`);
      console.log('🔍 Extracting strategies...');
      
      // Extract strategies
      strategies = extractStrategies(text);
      
      // If extraction didn't work well, use pre-extracted list
      if (strategies.length < 50) {
        console.log('⚠️  PDF parsing yielded fewer strategies than expected.');
        console.log('📋 Using pre-extracted strategies from web search...');
        strategies = getPreExtractedStrategies();
      }
    } catch (error) {
      console.error('❌ Error parsing PDF:', error.message);
      console.log('📋 Falling back to pre-extracted strategies...');
      strategies = getPreExtractedStrategies();
    }
  } else {
    console.log('📋 Using pre-extracted strategies from web search...');
    strategies = getPreExtractedStrategies();
  }
  
  console.log(`✅ Extracted ${strategies.length} strategies`);
  
  // Save to JSON
  const output = {
    source: PDF_URL,
    extractedAt: new Date().toISOString(),
    method: hasPdfParse ? 'pdf-parse' : 'pre-extracted',
    count: strategies.length,
    strategies: strategies.map((strategy, index) => ({
      id: index + 1,
      text: strategy
    }))
  };
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8');
  console.log(`✅ Saved to ${OUTPUT_FILE}`);
  console.log(`\n📊 Summary:`);
  console.log(`   - Total strategies: ${strategies.length}`);
  console.log(`   - Output file: ${OUTPUT_FILE}`);
  
  // Print first few strategies as preview
  console.log(`\n📝 Preview (first 5 strategies):`);
  strategies.slice(0, 5).forEach((s, i) => {
    console.log(`   ${i + 1}. ${s}`);
  });
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { extractStrategies, getPreExtractedStrategies };

