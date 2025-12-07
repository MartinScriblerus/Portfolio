# DSP Data Ingestion Guide

## Current Situation

The `ingest-dsp-rag.js` script processes **one file at a time**. To get both `chuck` and `chuck-docs` into Supabase, you have two options:

## Option 1: Use the Combined File (Recommended) ✅

The `scrape-chuck-combined.js` script already combines all sources:

### Step 1: Create combined file
```bash
npm run scrape:chuck-all
```

This creates `data/dsp-training-samples-combined.json` with:
- ✅ ChucK examples (`dsp-training-samples-chuck.json`)
- ✅ ChucK docs (`dsp-training-samples-chuck-docs.json`) 
- ✅ Original samples (`dsp-training-samples.json`)

### Step 2: Ingest the combined file
```bash
npm run ingest:dsp -- --file data/dsp-training-samples-combined.json
```

**Result:** All entries from all sources go into Supabase in one command!

---

## Option 2: Ingest Files Separately

If you want to ingest them separately (or check what's in each):

```bash
# Ingest ChucK examples
npm run ingest:dsp -- --file data/dsp-training-samples-chuck.json

# Ingest ChucK docs
npm run ingest:dsp -- --file data/dsp-training-samples-chuck-docs.json

# Ingest original samples
npm run ingest:dsp -- --file data/dsp-training-samples.json
```

**Note:** This will add all entries from all files. If there are duplicates, you might get duplicate entries in Supabase (depending on your schema).

---

## Current Default Behavior

If you run without `--file`:
```bash
npm run ingest:dsp
```

It defaults to: `data/dsp-training-samples.json` (the original 8 samples only)

---

## Recommended Workflow

```bash
# 1. Make sure you have both source files
ls data/dsp-training-samples-chuck.json
ls data/dsp-training-samples-chuck-docs.json

# 2. Create combined file (combines all sources)
npm run scrape:chuck-all

# 3. Ingest everything at once
npm run ingest:dsp -- --file data/dsp-training-samples-combined.json
```

This gives you:
- All ChucK examples (376 entries)
- All ChucK docs (324 entries)
- Original samples (8 entries)
- **Total: ~708 entries** in Supabase

---

## What Gets Ingested

Each entry includes:
- ✅ Code/documentation content
- ✅ Semantic embeddings (for search)
- ✅ Code embeddings (for code similarity)
- ✅ Perceptual tags
- ✅ Technical tags
- ✅ UGen information
- ✅ Example usage
- ✅ Source URLs
