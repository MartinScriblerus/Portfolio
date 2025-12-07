#!/usr/bin/env node

/**
 * Combined scraper: ChucK examples + documentation
 * Scrapes both code examples and documentation into a single dataset
 * 
 * Usage:
 *   node scripts/scrape-chuck-combined.js
 */

const { scrapeChuckDocs } = require('./scrape-chuck-docs-v2.js');
const scrapeExamples = require('./scrape-chuck-examples-v2.js');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🚀 Starting combined ChucK scraper (examples + docs)...\n');
  
  const allEntries = [];
  
  // Part 1: Scrape code examples (or load if already scraped)
  console.log('═══════════════════════════════════════════');
  console.log('PART 1: Loading ChucK Code Examples');
  console.log('═══════════════════════════════════════════\n');
  
  const examplesPath = path.join(__dirname, '../data/dsp-training-samples-chuck.json');
  if (fs.existsSync(examplesPath)) {
    try {
      const examplesContent = fs.readFileSync(examplesPath, 'utf8');
      const examplesData = JSON.parse(examplesContent);
      allEntries.push(...examplesData);
      console.log(`✅ Loaded ${examplesData.length} code examples from file\n`);
    } catch (error) {
      console.error('⚠️  Could not load examples file:', error.message);
      console.log('💡 Run: npm run scrape:chuck first\n');
    }
  } else {
    console.log('ℹ️  Examples file not found.');
    console.log('💡 Run: npm run scrape:chuck to scrape examples first\n');
  }
  
  // Part 2: Load or scrape documentation
  console.log('═══════════════════════════════════════════');
  console.log('PART 2: ChucK Documentation');
  console.log('═══════════════════════════════════════════\n');
  
  const docsPath = path.join(__dirname, '../data/dsp-training-samples-chuck-docs.json');
  if (fs.existsSync(docsPath)) {
    try {
      const docsContent = fs.readFileSync(docsPath, 'utf8');
      const docsData = JSON.parse(docsContent);
      allEntries.push(...docsData);
      console.log(`✅ Loaded ${docsData.length} documentation entries from file\n`);
    } catch (error) {
      console.error('⚠️  Could not load docs file:', error.message);
      console.log('💡 Run: npm run scrape:chuck-docs to scrape documentation\n');
    }
  } else {
    console.log('ℹ️  Documentation file not found.');
    console.log('💡 To scrape docs, run: npm run scrape:chuck-docs\n');
    console.log('   (This will take a few minutes to scrape all pages)\n');
  }
  
  // Part 3: Load original samples
  const samplesPath = path.join(__dirname, '../data/dsp-training-samples.json');
  if (fs.existsSync(samplesPath)) {
    try {
      const samplesContent = fs.readFileSync(samplesPath, 'utf8');
      const samplesData = JSON.parse(samplesContent);
      allEntries.push(...samplesData);
      console.log(`✅ Loaded ${samplesData.length} original sample entries\n`);
    } catch (error) {
      console.error('⚠️  Could not load samples file:', error.message);
    }
  }
  
  // Save combined results
  if (allEntries.length > 0) {
    const outputPath = path.join(__dirname, '../data/dsp-training-samples-combined.json');
    fs.writeFileSync(
      outputPath,
      JSON.stringify(allEntries, null, 2),
      'utf8'
    );
    
    console.log('═══════════════════════════════════════════');
    console.log('📊 FINAL SUMMARY');
    console.log('═══════════════════════════════════════════');
    console.log(`   Total entries: ${allEntries.length}`);
    
    const byType = {};
    allEntries.forEach(e => {
      byType[e.type] = (byType[e.type] || 0) + 1;
    });
    
    console.log('   By type:');
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`     ${type}: ${count}`);
    });
    
    const totalUGens = allEntries.reduce((sum, e) => sum + (e.params?.ugens?.length || 0), 0);
    console.log(`   Total UGens: ${totalUGens}`);
    
    console.log(`\n💾 Combined dataset saved to: ${outputPath}`);
    console.log('');
    console.log('💡 Next step: Ingest into Supabase');
    console.log(`   npm run ingest:dsp -- --file ${outputPath}`);
  } else {
    console.log('⚠️  No entries to save. Make sure you run the scrapers first.');
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}
