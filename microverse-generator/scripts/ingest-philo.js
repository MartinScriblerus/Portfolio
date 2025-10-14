/*
  Usage:
  1) Create a file .env.ingest.local (not committed) at repo root with:
       SUPABASE_URL=https://<project-ref>.supabase.co
       SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
  2) Run: npm run ingest:philo

  Notes:
  - Uses @xenova/transformers to compute 384-dim embeddings (all-MiniLM-L6-v2)
  - Inserts into public.documents (see supabase/schema.sql)
*/

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.ingest.local') });

const { createClient } = require('@supabase/supabase-js');

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

function getDocs() {
  const docs = [
    {
      work: 'Optics', author: 'Euclid', year: -300, era: 'ancient', topic: ['optics','geometry'],
      content: 'Let it be postulated that the visual rays proceed in straight lines and diverge from the eye...'
    },
    {
      work: 'An Essay Towards a New Theory of Vision', author: 'George Berkeley', year: 1709, era: 'enlightenment', topic: ['vision','philosophy'],
      content: 'Distance of itself, and immediately, cannot be seen. For distance being a line directed end-wise to the eye...'
    },
    {
      work: 'On the Sensations of Tone', author: 'Hermann von Helmholtz', year: 1863, era: '19c', topic: ['audio','acoustics'],
      content: 'The tones of musical instruments are composed of a fundamental and its upper partials; timbre depends upon these relations.'
    },
  ];
  return docs;
}

async function main() {
  const url = process.env.SUPABASE_URL;
  // Prefer SUPABASE_SERVICE_ROLE_KEY, but accept SUPABASE_ROLE_KEY as a fallback
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ROLE_KEY) in .env.ingest.local');
    process.exit(1);
  }
  const supabase = createClient(url, serviceKey);
  const embed = await getEmbedder();
  const docs = getDocs();
  const rows = [];
  for (const d of docs) {
    const embedding = await embed(d.content);
    rows.push({ ...d, embedding });
  }
  const { error } = await supabase.from('documents').insert(rows);
  if (error) {
    console.error('Insert error:', error);
    process.exit(1);
  }
  console.log(`Inserted ${rows.length} documents.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
