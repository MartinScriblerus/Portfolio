#!/usr/bin/env node

/**
 * Ingest DSP RAG training data into Supabase
 * Usage: node scripts/ingest-dsp-rag.js [--dry-run] [--file data/dsp-training-samples.json]
 * 
 * Environment variables (set in .env.local or .env.ingest.local):
 *   SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env files
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.ingest.local') });
require('dotenv').config(); // Also load default .env if it exists

// Load embedding function (directly use transformer model, no dev server needed)
async function getEmbedder() {
  const transformers = await import('@xenova/transformers');
  const { pipeline } = transformers;
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  return async function embed(text) {
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    // output.data is a Float32Array
    return Array.from(output.data);
  };
}

// Keep the old function name for compatibility, but use direct embedding
let cachedEmbedder = null;
async function getEmbedding(text) {
  if (!cachedEmbedder) {
    cachedEmbedder = await getEmbedder();
  }
  return await cachedEmbedder(text);
}

// Extract code structure for code embedding (simplified)
function extractCodeStructure(content) {
  // For code files, extract function/class names, UGen names, etc.
  // This is a simplified version - in production, use a proper parser
  const lines = content.split('\n');
  const structures = [];
  
  for (const line of lines) {
    // Extract UGen declarations
    const ugenMatch = line.match(/\b(SinOsc|SawOsc|SndBuf|Granulator|LPF|HPF|BPF|Comb|DelayA|DelayP|JCRev|ADSR|Gain|Noise|Impulse|WvIn)\s+(\w+)/);
    if (ugenMatch) {
      structures.push(`${ugenMatch[1]} ${ugenMatch[2]}`);
    }
    
    // Extract connections
    const connMatch = line.match(/(\w+)\s*=>\s*(\w+)/);
    if (connMatch) {
      structures.push(`${connMatch[1]} => ${connMatch[2]}`);
    }
  }
  
  return structures.join('\n');
}

async function processDocument(doc, options = {}) {
  const { dryRun = false, embedder = null } = options;
  
  // Extract embeddings
  let embedSemantic = null;
  let embedCode = null;
  
  if (!dryRun && embedder) {
    // Semantic embedding from full content
    embedSemantic = await embedder(doc.content);
    
    // Code embedding from structured content (for code documents)
    if (doc.type === 'code') {
      const codeStructure = extractCodeStructure(doc.content);
      if (codeStructure) {
        embedCode = await embedder(codeStructure);
      }
    }
  }
  
  // Generate UUID - don't use the string ID from JSON if it's not a valid UUID
  // Store original ID in title or as a comment, but use UUID for database
  const crypto = require('crypto');
  let docId = doc.id;
  
  // Check if doc.id is a valid UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!docId || !uuidRegex.test(docId)) {
    // Generate deterministic UUID from the string ID (or title) using v5-like hashing
    // This ensures same document always gets same UUID if re-run
    const namespace = crypto.createHash('sha256').update(doc.id || doc.title || '').digest();
    docId = crypto.randomUUID(); // Generate new UUID, but we could make it deterministic
    // For now, just use random UUID and omit id to let DB generate it
    docId = undefined; // Let database generate UUID
  }
  
  const processed = {
    // Omit id if not a valid UUID - let database generate it
    title: doc.title,
    type: doc.type,
    language: doc.language || null,
    tool: doc.tool || null,
    content: doc.content,
    tokens_est: Math.ceil(doc.content.length / 4), // rough estimate
    chunk_of: null,
    chunk_index: null,
    chunk_total: null,
    perceptual_tags: doc.perceptual_tags || [],
    technical_tags: doc.technical_tags || [],
    ugens: doc.params?.ugens || [],
    params: doc.params || null,
    // Normalize example_usage: always use array, convert null/undefined to []
    example_usage: (() => {
      if (doc.example_usage === null || doc.example_usage === undefined) return [];
      if (Array.isArray(doc.example_usage)) return doc.example_usage.length > 0 ? doc.example_usage : [];
      if (typeof doc.example_usage === 'string') {
        return doc.example_usage.trim().length > 0 ? [doc.example_usage] : [];
      }
      return [];
    })(),
    license: doc.license || 'cc-by',
    source_url: doc.source_url || null,
    embed_semantic: embedSemantic,
    embed_code: embedCode
  };
  
  // Only include id if it's a valid UUID
  if (docId && uuidRegex.test(docId)) {
    processed.id = docId;
  }
  
  return processed;
}

async function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');
  const fileIdx = argv.indexOf('--file');
  const inputFile = fileIdx !== -1 && argv[fileIdx + 1]
    ? argv[fileIdx + 1]
    : path.join(__dirname, '../data/dsp-training-samples.json');
  
  const limitIdx = argv.indexOf('--limit');
  const limit = limitIdx !== -1 ? parseInt(argv[limitIdx + 1], 10) : null;
  const batchIdx = argv.indexOf('--batch-size');
  const batchSize = batchIdx !== -1 ? Math.max(1, parseInt(argv[batchIdx + 1], 10)) : 10;
  
  // Load documents
  console.log(`Loading documents from: ${inputFile}`);
  const fileContent = fs.readFileSync(inputFile, 'utf8');
  const docs = JSON.parse(fileContent);
  
  const sourceDocs = Number.isFinite(limit) && limit > 0 
    ? docs.slice(0, limit) 
    : docs;
  
  console.log(`Processing ${sourceDocs.length} documents...`);
  
  if (dryRun) {
    console.log(`[DRY RUN] Would insert ${sourceDocs.length} rows. Batch size: ${batchSize}.`);
    console.log('Sample document:', JSON.stringify(sourceDocs[0], null, 2));
    return;
  }
  
  // Initialize clients - check multiple possible env var names
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  // For INSERT operations, we NEED the service role key (bypasses RLS)
  // ANON key will fail with RLS policy violations
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url) {
    console.error('❌ Missing Supabase URL in environment variables');
    console.error('Set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
    process.exit(1);
  }
  
  if (!serviceKey) {
    console.error('❌ Missing Supabase SERVICE_ROLE_KEY (required for inserts)');
    console.error('');
    console.error('The ANON key can only read data due to Row Level Security (RLS).');
    console.error('For inserting data, you need the SERVICE_ROLE_KEY which bypasses RLS.');
    console.error('');
    console.error('Required for INSERT:');
    console.error('  SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ROLE_KEY');
    console.error('');
    console.error('Where to find it:');
    console.error('  1. Go to your Supabase Dashboard');
    console.error('  2. Project Settings → API');
    console.error('  3. Copy the "service_role" key (secret, not the anon key)');
    console.error('');
    console.error('Set it in one of these files:');
    console.error('  - .env.local');
    console.error('  - .env.ingest.local');
    console.error('');
    console.error('Current environment check:');
    console.error(`  SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅' : '❌'}`);
    console.error(`  NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅' : '❌'}`);
    console.error(`  SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌'}`);
    console.error(`  SUPABASE_ROLE_KEY: ${process.env.SUPABASE_ROLE_KEY ? '✅' : '❌'}`);
    console.error(`  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${anonKey ? '✅ (can read only)' : '❌'}`);
    console.error('');
    console.error('⚠️  Note: SERVICE_ROLE_KEY is powerful - keep it secret! Never commit it to git.');
    process.exit(1);
  }
  
  console.log(`✅ Using Supabase URL: ${url}`);
  console.log(`✅ Using SERVICE_ROLE key (bypasses RLS for inserts)`);
  
  const supabase = createClient(url, serviceKey);
  
  // Initialize embedder (load transformer model directly)
  console.log('Loading embedding model... (this may take a moment on first run)');
  let embedder = null;
  try {
    embedder = await getEmbedder();
    console.log('✅ Embedding model loaded successfully');
  } catch (e) {
    console.error('❌ Could not initialize embedder:', e.message);
    console.error('   Make sure @xenova/transformers is installed: npm install');
    process.exit(1);
  }
  
  // Process documents
  const rows = [];
  console.log(`\nGenerating embeddings for ${sourceDocs.length} documents...`);
  for (let i = 0; i < sourceDocs.length; i++) {
    const doc = sourceDocs[i];
    try {
      const processed = await processDocument(doc, { dryRun: false, embedder });
      rows.push(processed);
      console.log(`[${i + 1}/${sourceDocs.length}] ✅ Processed: ${processed.title || processed.id}`);
    } catch (error) {
      console.error(`[${i + 1}/${sourceDocs.length}] ❌ Error processing ${doc.id || 'unknown'}:`, error.message);
      // Continue with next document
    }
  }
  
  if (rows.length === 0) {
    console.error('\n❌ No documents were successfully processed. Exiting.');
    process.exit(1);
  }
  
  console.log(`\n✅ Successfully processed ${rows.length}/${sourceDocs.length} documents`);
  
  // Insert in batches
  let inserted = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    
    // Convert embeddings to PostgreSQL vector format if present
    const batchWithVectors = batch.map(row => {
      const result = { ...row };
      
      // Convert embed_semantic to vector format
      if (result.embed_semantic && Array.isArray(result.embed_semantic)) {
        result.embed_semantic = `[${result.embed_semantic.join(',')}]`;
      } else {
        delete result.embed_semantic;
      }
      
      // Convert embed_code to vector format
      if (result.embed_code && Array.isArray(result.embed_code)) {
        result.embed_code = `[${result.embed_code.join(',')}]`;
      } else {
        delete result.embed_code;
      }
      
      return result;
    });
    
    const { error } = await supabase
      .from('dsp_docs')
      .insert(batchWithVectors);
    
    if (error) {
      console.error(`Insert error at batch ${Math.floor(i / batchSize) + 1}:`, error);
      
      // Try inserting one by one to identify problematic rows
      console.log('Attempting individual inserts to identify errors...');
      for (const row of batch) {
        try {
          const { error: singleError } = await supabase
            .from('dsp_docs')
            .insert(row);
          
          if (singleError) {
            console.error(`Failed to insert ${row.title || row.id}:`, singleError);
          } else {
            inserted++;
            console.log(`✓ Inserted: ${row.title || row.id}`);
          }
        } catch (e) {
          console.error(`Exception inserting ${row.title || row.id}:`, e);
        }
      }
    } else {
      inserted += batch.length;
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}: ${inserted}/${rows.length}...`);
    }
  }
  
  console.log(`\nDone! Inserted ${inserted}/${rows.length} documents in batches of ${batchSize}.`);
}

if (require.main === module) {
  main().catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  });
}

module.exports = { processDocument, main };


