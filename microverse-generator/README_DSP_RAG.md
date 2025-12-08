# DSP RAG Portal - Quick Start

This implementation provides a complete RAG (Retrieval-Augmented Generation) system for DSP sound design, enabling users to create sounds through natural language descriptions.

## What's Included

✅ **MCP Schema** - Complete TypeScript types for DSP documents  
✅ **Supabase Schema** - Database migration with vector search  
✅ **Intent Router** - Classifies user intents and normalizes goals  
✅ **Prompt Packs** - Few-shot examples for code generation  
✅ **Validator** - Static validation + Meyda audio feature analysis  
✅ **RAG Chunking** - Optimized chunking strategy for code/docs  
✅ **Goal Portal UI** - React component for user interaction  
✅ **API Routes** - Complete generation pipeline  
✅ **Training Data** - Sample DSP examples ready to ingest  
✅ **Ingestion Scripts** - Automated data loading  
✅ **Hydra Templates** - Audio-reactive visual synthesis code  

## Quick Setup

1. **Run database migration:**
   ```bash
   # In Supabase SQL editor, run:
   supabase/dsp-rag-schema.sql
   ```

2. **Ingest training data:**
   ```bash
   npm run ingest:dsp
   ```

3. **Use the component:**
   ```tsx
   import DSPGoalPortal from '@/components/DSPGoalPortal';
   
   <DSPGoalPortal onGenerate={(result) => console.log(result)} />
   ```

## Example Usage

**User Input:**
> "I want a metallic granular lead with quick transients, under 1s release, slightly detuned"

**System Output:**
- Intent: `CREATE_SOUND`
- Generated ChucK code with Granulator + Comb filter
- Parameter recommendations (grain_ms, detune, etc.)
- Explanation of DSP choices
- Retrieved similar examples

## File Structure

```
src/
├── types/
│   └── dsp-rag.ts              # TypeScript types
├── lib/
│   └── dsp-rag/
│       ├── intent-router.ts    # Intent classification
│       ├── prompts.ts          # LLM prompts
│       ├── validator.ts        # Code validation
│       ├── chunking.ts         # Document chunking
│       └── hydra-templates.ts  # Visual synth templates
├── components/
│   └── DSPGoalPortal.tsx       # Main UI component
app/
└── api/
    └── dsp/
        └── generate/
            └── route.ts        # Generation API
supabase/
└── dsp-rag-schema.sql          # Database schema
data/
└── dsp-training-samples.json   # Sample training data
scripts/
└── ingest-dsp-rag.js           # Ingestion script
```

## Next Steps

1. **Add LLM Integration** - Connect to OpenAI/Anthropic for actual code generation
2. **Expand Training Data** - Ingest ChucK cookbook, Faust docs, etc.
3. **Audio Preview** - Add WebChucK playback of generated patches
4. **Parameter UI** - Interactive sliders for tweaking parameters

See `docs/DSP_RAG_SETUP.md` for detailed documentation.


