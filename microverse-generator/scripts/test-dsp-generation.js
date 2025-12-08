#!/usr/bin/env node

/**
 * Test script for DSP code generation
 * Tests the /api/dsp/generate endpoint with various user goals
 * 
 * Usage:
 *   node scripts/test-dsp-generation.js [goal]
 *   
 * Examples:
 *   node scripts/test-dsp-generation.js "I want a metallic granular lead with quick transients"
 *   node scripts/test-dsp-generation.js "Create a warm pad with slow attack"
 */

const https = require('https');
const http = require('http');

const testGoals = [
  "I want a metallic granular lead with quick transients",
  "Create a warm pad with slow attack and shimmer",
  "Generate a percussive bass with filter sweep",
  "Make a detuned drone with 5 oscillators",
  "Create a reverb-washed ambient texture"
];

async function testDSPGeneration(goal, baseUrl = 'http://localhost:3000') {
  console.log(`\n🧪 Testing DSP Generation`);
  console.log(`   Goal: "${goal}"`);
  console.log(`   Endpoint: ${baseUrl}/api/dsp/generate\n`);
  
  const formData = new FormData ? new FormData() : null;
  
  // For Node.js, we need to manually build multipart/form-data
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const bodyParts = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="goal"',
    '',
    goal,
    `--${boundary}`,
    'Content-Disposition: form-data; name="targetLanguage"',
    '',
    'chuck',
    `--${boundary}`,
    'Content-Disposition: form-data; name="visualSync"',
    '',
    'false',
    `--${boundary}--`
  ];
  
  const body = bodyParts.join('\r\n');
  
  const url = new URL(`${baseUrl}/api/dsp/generate`);
  const protocol = url.protocol === 'https:' ? https : http;
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(body)
      }
    };
    
    const req = protocol.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode === 200) {
            resolve(json);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${json.error || data}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}\nResponse: ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const goal = process.argv[2] || testGoals[0];
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  
  console.log('═══════════════════════════════════════════');
  console.log('DSP Code Generation Test');
  console.log('═══════════════════════════════════════════');
  console.log(`\n⚠️  Make sure your dev server is running:`);
  console.log(`   npm run dev`);
  console.log(`\n   Then run this test script.\n`);
  
  try {
    const result = await testDSPGeneration(goal, baseUrl);
    
    console.log('✅ Generation successful!\n');
    console.log('📊 Results:');
    console.log(`   Intent: ${result.intent}`);
    console.log(`   Valid: ${result.validation?.valid ? '✅' : '❌'}`);
    if (result.validation?.errors && result.validation.errors.length > 0) {
      console.log(`   Errors: ${result.validation.errors.join(', ')}`);
    }
    console.log(`\n📝 Generated Code:\n`);
    console.log(result.code.code);
    console.log(`\n💡 Explanation: ${result.explanation}`);
    
    if (result.retrieved_docs && result.retrieved_docs.length > 0) {
      console.log(`\n📚 Retrieved ${result.retrieved_docs.length} relevant documents`);
      console.log(`   Top match: ${result.retrieved_docs[0].title} (${(result.retrieved_docs[0].similarity * 100).toFixed(0)}% similarity)`);
    }
    
    console.log('\n═══════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Is the dev server running? (npm run dev)');
    console.error('  2. Do you have OPENAI_API_KEY set? (optional - will use template fallback)');
    console.error('  3. Have you ingested training data? (npm run ingest:dsp)');
    console.error('  4. Check the server logs for detailed errors\n');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { testDSPGeneration };
