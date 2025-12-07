import { NextRequest } from 'next/server';
import { routeIntent, normalizeGoal } from '../../../../src/lib/dsp-rag/intent-router';
import { getCodegenPrompt, getPlannerPrompt } from '../../../../src/lib/dsp-rag/prompts';
import { validateCodeStatic, compareFeatures } from '../../../../src/lib/dsp-rag/validator';
import { DSPDoc, PatchGenerationResult, Language } from '../../../../src/types/dsp-rag';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

// Get embedding function (reuse from existing embed route)
async function getEmbedding(text: string): Promise<number[]> {
  // For server-side, import the embedder directly
  // In production, you might want to use the same embedding logic without HTTP
  const { pipeline } = await import('@xenova/transformers');
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  const out = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(out.data as Float32Array);
}

async function searchDSPDocs(
  query: string,
  filters?: {
    language?: Language;
    perceptualTags?: string[];
    technicalTags?: string[];
  },
  k: number = 12
): Promise<Array<DSPDoc & { similarity: number }>> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase not configured');
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  const embedding = await getEmbedding(query);
  
  // Use the match_dsp_docs function
  const { data, error } = await supabase.rpc('match_dsp_docs', {
    query_embedding: embedding,
    match_count: k,
    min_similarity: 0.5,
    filter_language: filters?.language || null,
    perceptual_tags_filter: filters?.perceptualTags || null,
    technical_tags_filter: filters?.technicalTags || null
  });
  
  if (error) {
    console.error('Supabase search error:', error);
    return [];
  }
  
  return (data || []).map((doc: any) => ({
    ...doc,
    similarity: doc.similarity || 0
  }));
}

async function generateCodeFromLLM(
  prompt: string,
  blockSketch?: any
): Promise<string> {
  // Use OpenAI (or fallback to template if no API key)
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️  No OPENAI_API_KEY found - using template-based generation');
    if (blockSketch) {
      return generateChucKFromSketch(blockSketch);
    }
    return '// Code generation requires OPENAI_API_KEY environment variable';
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert ChucK/WebChucK programmer. Generate valid, idiomatic ChucK code based on user requests. Always include helpful comments.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    const generatedCode = data.choices?.[0]?.message?.content?.trim();
    
    if (!generatedCode) {
      throw new Error('No code generated from LLM');
    }
    
    // Extract code block if wrapped in markdown
    const codeMatch = generatedCode.match(/```(?:chuck|javascript)?\n([\s\S]*?)```/);
    return codeMatch ? codeMatch[1].trim() : generatedCode;
    
  } catch (error: any) {
    console.error('LLM code generation error:', error.message);
    // Fallback to template-based generation
    if (blockSketch) {
      console.log('Falling back to template-based generation');
      return generateChucKFromSketch(blockSketch);
    }
    throw error;
  }
}

async function generateBlockSketchFromLLM(
  plannerPrompt: string
): Promise<any> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    // Return a basic default sketch
    return {
      blocks: [
        { id: 'src', type: 'sinosc', notes: 'Sound source', params: { freq: 440 } },
        { id: 'fx', type: 'lpf', notes: 'Shaping filter', params: { cutoff: 2000, Q: 0.7 } }
      ],
      connect: [['src', 'fx'], ['fx', 'dac']]
    };
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a DSP patch planner. Generate JSON block sketches. Always return valid JSON only, no markdown or extra text.'
          },
          {
            role: 'user',
            content: plannerPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    const sketchJson = data.choices?.[0]?.message?.content?.trim();
    
    if (!sketchJson) {
      throw new Error('No sketch generated from LLM');
    }
    
    // Parse JSON (handle markdown code blocks)
    const jsonMatch = sketchJson.match(/```(?:json)?\n?([\s\S]*?)```/) || [null, sketchJson];
    return JSON.parse(jsonMatch[1] || sketchJson);
    
  } catch (error: any) {
    console.error('LLM block sketch generation error:', error.message);
    // Return basic default
    return {
      blocks: [
        { id: 'src', type: 'sinosc', notes: 'Sound source', params: { freq: 440 } },
        { id: 'fx', type: 'lpf', notes: 'Shaping filter', params: { cutoff: 2000, Q: 0.7 } }
      ],
      connect: [['src', 'fx'], ['fx', 'dac']]
    };
  }
}

function generateChucKFromSketch(sketch: any): string {
  // Simplified code generation (in production, use LLM)
  let code = '// Generated from block sketch\n';
  
  // Declare UGens
  const ugens: Record<string, string> = {};
  for (const block of sketch.blocks || []) {
    const ugenName = mapBlockTypeToUGen(block.type);
    if (ugenName) {
      ugens[block.id] = ugenName;
      code += `${ugenName} ${block.id};\n`;
    }
  }
  
  code += '\n';
  
  // Connect blocks
  for (const [from, to] of sketch.connect || []) {
    if (ugens[from] && ugens[to]) {
      code += `${from} => ${to};\n`;
    } else if (to === 'dac') {
      code += `${from} => dac;\n`;
    }
  }
  
  code += '\n';
  
  // Set parameters
  for (const block of sketch.blocks || []) {
    for (const [param, value] of Object.entries(block.params || {})) {
      if (param !== 'file' && typeof value === 'number') {
        code += `${value} => ${block.id}.${mapParamName(param)};\n`;
      }
    }
  }
  
  return code;
}

function mapBlockTypeToUGen(type: string): string | null {
  const mapping: Record<string, string> = {
    sndbuf: 'SndBuf',
    granulator: 'Granulator',
    lpf: 'LPF',
    hpf: 'HPF',
    bpf: 'BPF',
    comb: 'Comb',
    delayp: 'DelayP',
    delaya: 'DelayA',
    jcrev: 'JCRev',
    adsr: 'ADSR',
    gain: 'Gain',
    sinosc: 'SinOsc',
    sawosc: 'SawOsc',
    noise: 'Noise',
    impulse: 'Impulse',
    wvIn: 'WvIn'
  };
  return mapping[type.toLowerCase()] || null;
}

function mapParamName(param: string): string {
  const mapping: Record<string, string> = {
    grain_ms: 'grainDur',
    delay_ms: 'delay',
    feedback: 'gain',
    cutoff: 'freq',
    Q: 'Q',
    freq: 'freq',
    gain: 'gain'
  };
  return mapping[param] || param;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const goal = formData.get('goal') as string;
    const targetLanguage = (formData.get('targetLanguage') as Language) || 'chuck';
    const visualSync = formData.get('visualSync') === 'true';
    const audioFile = formData.get('audioFile') as File | null;
    
    if (!goal) {
      return new Response(JSON.stringify({ error: 'Goal is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Step 1: Classify intent and normalize goal
    const { classification, nextSteps } = await routeIntent(goal, {
      uploadedAudio: audioFile || undefined,
      targetLanguage
    });
    
    if (classification.intent !== 'CREATE_SOUND' && classification.intent !== 'MODIFY_SOUND') {
      return new Response(JSON.stringify({
        error: 'This endpoint currently only supports CREATE_SOUND and MODIFY_SOUND intents',
        classification
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Step 2: Retrieve relevant DSP documents
    const structuredGoal = classification.structured_goal;
    if (!structuredGoal) {
      return new Response(JSON.stringify({ error: 'Could not parse goal' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const queryText = `${goal} ${structuredGoal.perceptual_tags.join(' ')} ${Object.keys(structuredGoal.technical_targets || {}).join(' ')}`;
    const retrievedDocs = await searchDSPDocs(queryText, {
      language: targetLanguage,
      perceptualTags: structuredGoal.perceptual_tags
    }, 12);
    
    // Step 3: Generate block sketch using LLM (or fallback to template)
    const plannerPrompt = getPlannerPrompt(structuredGoal, retrievedDocs);
    const blockSketch = await generateBlockSketchFromLLM(plannerPrompt);
    
    // Step 4: Generate code
    const codegenPrompt = getCodegenPrompt(blockSketch);
    const generatedCode = await generateCodeFromLLM(codegenPrompt, blockSketch);
    
    // Step 5: Validate code
    const staticValidation = validateCodeStatic(generatedCode);
    
    // Step 6: Compare features if we have targets
    let validationRecommendations: Array<{
      param: string;
      change: 'increase' | 'decrease' | 'set';
      value?: number;
      reason: string;
    }> = [];
    if (structuredGoal.technical_targets && staticValidation.valid) {
      // In production, would run actual audio analysis
      // For now, provide generic recommendations
      if (structuredGoal.technical_targets.centroid_target) {
        validationRecommendations.push({
          param: 'filter_cutoff',
          change: 'increase' as const,
          reason: 'Target brightness suggests higher filter cutoff'
        });
      }
    }
    
    const result: PatchGenerationResult = {
      intent: classification.intent,
      block_sketch: blockSketch,
      code: {
        code: generatedCode,
        language: targetLanguage,
        explanation: `Generated ${targetLanguage} code based on your goal: "${goal}". This patch creates ${structuredGoal.perceptual_tags.join(', ')} sound characteristics.`,
        tweak_sliders: [
          {
            param: 'freq',
            range: [220, 880] as [number, number],
            default: 440,
            description: 'Fundamental frequency'
          },
          {
            param: 'cutoff',
            range: [200, 8000] as [number, number],
            default: 2000,
            description: 'Filter cutoff frequency'
          }
        ]
      },
      validation: {
        valid: staticValidation.valid,
        errors: staticValidation.errors,
        recommendations: validationRecommendations
      },
      retrieved_docs: retrievedDocs,
      explanation: `Based on your goal "${goal}", I created a ${structuredGoal.perceptual_tags.join(', ')} sound using ${Object.keys(structuredGoal.technical_targets || {}).join(', ') || 'standard DSP'}. The patch uses a ${blockSketch.blocks[0].type} source through a ${blockSketch.blocks[1].type} filter.`
    };
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('DSP generation error:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Generation failed',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}


