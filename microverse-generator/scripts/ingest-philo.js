/*
  Usage:
  1) Create .env.ingest.local (not committed) at repo root with:
    SUPABASE_URL=https://<project-ref>.supabase.co
    SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
  2) Add content as markdown/txt files under ./content (optional)
    - Optional frontmatter (YAML) with fields: work, author, year, era, topic (array)
    - Body is the text; it will be chunked ~300–500 words per row
  3) Run: npm run ingest:philo [--dry-run]

  Notes:
  - Uses @xenova/transformers to compute 384-dim embeddings (all-MiniLM-L6-v2)
  - Inserts into public.documents (see supabase/schema.sql)
*/

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.ingest.local') });

const { createClient } = require('@supabase/supabase-js');
const matter = require('gray-matter');

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

function splitIntoChunks(text, targetWords = 400, overlapWords = 50) {
  const paras = text
    .split(/\n\s*\n+/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const chunks = [];
  let buf = [];
  let count = 0;
  const pushBuf = () => {
    if (buf.length) {
      chunks.push(buf.join('\n\n'));
      buf = [];
      count = 0;
    }
  };
  for (const p of paras) {
    const words = p.split(' ').filter(Boolean);
    // If a single paragraph is longer than target, split it into windows with overlap
    if (words.length > targetWords) {
      // First flush whatever is in the buffer to keep chunks near target size
      pushBuf();
      let i = 0;
      const step = Math.max(1, targetWords - overlapWords);
      while (i < words.length) {
        const slice = words.slice(i, i + targetWords).join(' ');
        chunks.push(slice);
        if (i + targetWords >= words.length) break;
        i += step;
      }
      continue;
    }
    // Otherwise, accumulate paragraphs until near target
    if (count + words.length > targetWords && buf.length) {
      pushBuf();
    }
    buf.push(p);
    count += words.length;
  }
  pushBuf();
  // Ensure at least one chunk
  return chunks.length ? chunks : [text.trim()];
}

function loadContentDir(dir = path.resolve(process.cwd(), 'content')) {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => /\.(md|mdx|txt)$/i.test(f));
  const docs = [];
  for (const fname of files) {
    const full = path.join(dir, fname);
    const raw = fs.readFileSync(full, 'utf8');
    const fm = matter(raw);
    const meta = fm.data || {};
    const body = (fm.content || '').trim();
    if (!body) continue;
    const base = {
      work: meta.work || path.parse(fname).name,
      author: meta.author || 'unknown',
      year: typeof meta.year === 'number' ? meta.year : null,
      era: meta.era || null,
      topic: Array.isArray(meta.topic) ? meta.topic : [],
    };
    const targetWords = typeof meta.targetWords === 'number' ? meta.targetWords : 400;
    const overlapWords = typeof meta.overlapWords === 'number' ? meta.overlapWords : 50;
    const chunks = splitIntoChunks(body, targetWords, overlapWords);
    for (const c of chunks) {
      docs.push({ ...base, content: c });
    }
  }
  return docs;
}

function getDocs() {
  const fromDir = loadContentDir();
  if (fromDir.length > 0) return fromDir;
  // Fallback seed docs
  return [
    {
      work: 'Optics', author: 'Euclid', year: -300, era: 'ancient', topic: ['perception','vision'],
      content: 'Let it be postulated that the visual rays proceed in straight lines and diverge from the eye...'
    },
    {
      work: 'An Essay Towards a New Theory of Vision', author: 'George Berkeley', year: 1709, era: 'enlightenment', topic: ['perception','vision'],
      content: 'Distance of itself, and immediately, cannot be seen. For distance being a line directed end-wise to the eye...'
    },
    {
      work: 'On the Sensations of Tone', author: 'Hermann von Helmholtz', year: 1863, era: '19c', topic: ['perception','audio'],
      content: 'The tones of musical instruments are composed of a fundamental and its upper partials; timbre depends upon these relations.'
    },
  ];
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
  const dryRun = process.argv.includes('--dry-run');
  const rows = [];
  for (const d of docs) {
    const embedding = await embed(d.content);
    rows.push({ ...d, embedding });
  }
  if (dryRun) {
    console.log(`[DRY RUN] Would insert ${rows.length} rows from ${docs.length} docs.`);
    return;
  }
  const { error } = await supabase.from('documents').insert(rows);
  if (error) {
    console.error('Insert error:', error);
    process.exit(1);
  }
  console.log(`Inserted ${rows.length} documents.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
