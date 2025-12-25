/*
 * Check Supabase configuration and validate connection
 * Usage: node scripts/check-supabase-config.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Try to load environment variables
const envPath = path.join(process.cwd(), '.env.local');
let envVars = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      envVars[key] = value;
    }
  });
}

// Also check process.env (for runtime)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Supabase Configuration Check\n');
console.log('=' .repeat(60));

// Check if variables exist
console.log('\n📋 Environment Variables:');
console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseKey ? '✅ Set' : '❌ Missing'}`);

if (!supabaseUrl || !supabaseKey) {
  console.log('\n⚠️  Missing environment variables!');
  console.log('   Create a .env.local file with:');
  console.log('   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
  console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
  process.exit(1);
}

// Show URL (masked key)
const urlObj = supabaseUrl ? new URL(supabaseUrl) : null;
const projectRef = urlObj ? urlObj.hostname.split('.')[0] : 'unknown';
const keyPreview = supabaseKey ? `${supabaseKey.substring(0, 20)}...${supabaseKey.substring(supabaseKey.length - 10)}` : 'missing';

console.log(`\n🔗 Current Configuration:`);
console.log(`   Project Ref: ${projectRef}`);
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Key: ${keyPreview}`);

// Check for stored previous values
const cachePath = path.join(process.cwd(), '.supabase-config-cache.json');
let previousConfig = null;

if (fs.existsSync(cachePath)) {
  try {
    previousConfig = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    console.log(`\n📦 Previous Configuration (from cache):`);
    console.log(`   Project Ref: ${previousConfig.projectRef || 'unknown'}`);
    console.log(`   URL: ${previousConfig.url || 'unknown'}`);
    console.log(`   Cached At: ${previousConfig.timestamp || 'unknown'}`);
    
    // Compare
    const urlChanged = previousConfig.url !== supabaseUrl;
    const keyChanged = previousConfig.keyHash !== (supabaseKey ? hashKey(supabaseKey) : null);
    
    if (urlChanged || keyChanged) {
      console.log(`\n⚠️  Configuration Changed:`);
      if (urlChanged) console.log(`   ❌ URL changed`);
      if (keyChanged) console.log(`   ❌ Key changed`);
    } else {
      console.log(`\n✅ Configuration unchanged since last check`);
    }
  } catch (e) {
    console.log(`\n⚠️  Could not read cache file: ${e.message}`);
  }
}

// Validate URL format
console.log(`\n🔍 Validation:`);
try {
  const url = new URL(supabaseUrl);
  if (!url.hostname.includes('supabase.co')) {
    console.log(`   ⚠️  URL doesn't look like a Supabase URL`);
  } else {
    console.log(`   ✅ URL format valid`);
  }
} catch (e) {
  console.log(`   ❌ Invalid URL format: ${e.message}`);
}

// Test connection
console.log(`\n🌐 Testing Connection:`);
testConnection(supabaseUrl, supabaseKey)
  .then(({ success, error }) => {
    if (success) {
      console.log(`   ✅ Connection successful`);
    } else {
      console.log(`   ❌ Connection failed: ${error}`);
      if (error.includes('resolve') || error.includes('ENOTFOUND')) {
        console.log(`   💡 Hint: The project may be paused or the URL is incorrect`);
        console.log(`      Check your Supabase dashboard: https://supabase.com/dashboard`);
      }
    }
    
    // Save current config to cache
    const configCache = {
      projectRef,
      url: supabaseUrl,
      keyHash: hashKey(supabaseKey),
      timestamp: new Date().toISOString(),
      connectionTest: success ? 'success' : `failed: ${error}`
    };
    
    fs.writeFileSync(cachePath, JSON.stringify(configCache, null, 2));
    console.log(`\n💾 Configuration cached to: .supabase-config-cache.json`);
    
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.log(`   ❌ Unexpected error: ${err.message}`);
    process.exit(1);
  });

function hashKey(key) {
  // Simple hash for comparison (don't store full key)
  return key ? `${key.substring(0, 10)}...${key.substring(key.length - 10)}` : null;
}

function testConnection(url, key) {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(url);
      const testPath = '/rest/v1/';
      
      const options = {
        hostname: urlObj.hostname,
        port: 443,
        path: testPath,
        method: 'GET',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
        },
        timeout: 5000
      };
      
      const req = https.request(options, (res) => {
        // Any response means the server is reachable
        resolve({ success: true });
      });
      
      req.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve({ success: false, error: 'Connection timeout' });
      });
      
      req.end();
    } catch (error) {
      resolve({ success: false, error: error.message });
    }
  });
}









