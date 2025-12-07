/**
 * Intent Router for DSP RAG Portal
 * Maps user textual intent → canonical intent + decision tree for which modules to call
 */

import { IntentType, IntentClassification, GoalDescriptor, Language } from '@/types/dsp-rag';

const INTENT_EXAMPLES = [
  {
    input: "I want to create a metallic granular lead with quick transients",
    intent: "CREATE_SOUND" as IntentType,
    goal: {
      perceptual_tags: ["metallic", "granular", "sharp"],
      technical_targets: { grain_ms: [8, 25], attack_ms: [0, 50] }
    }
  },
  {
    input: "Make this sound brighter and add shimmer",
    intent: "MODIFY_SOUND" as IntentType,
    goal: {
      perceptual_tags: ["bright", "shimmer"],
      technical_targets: { centroid_target: 4500, add_comb: true }
    }
  },
  {
    input: "What does spectral centroid mean?",
    intent: "EXPLAIN_CONCEPT" as IntentType
  },
  {
    input: "Convert this Faust code to ChucK",
    intent: "TRANSLATE_CODE" as IntentType,
    language: "chuck" as Language
  },
  {
    input: "What parameters should I use for this granular synth?",
    intent: "SUGGEST_PARAMS" as IntentType
  },
  {
    input: "Create visuals that respond to the low frequencies",
    intent: "VISUALIZE" as IntentType
  },
  {
    input: "Show me an example of a comb filter patch",
    intent: "RETRIEVE_EXAMPLE" as IntentType
  }
];

export async function classifyIntent(
  userText: string,
  options?: { modelEndpoint?: string }
): Promise<IntentClassification> {
  // Use LLM for classification (can call OpenAI/Anthropic or local model)
  // For now, using a simple pattern-based classifier with LLM fallback
  
  const lowerText = userText.toLowerCase();
  
  // Quick pattern matching for common intents
  if (lowerText.includes('create') || lowerText.includes('make') || lowerText.includes('generate') || 
      lowerText.includes('want') || lowerText.includes('need')) {
    if (lowerText.includes('visual') || lowerText.includes('video') || lowerText.includes('synth')) {
      return {
        intent: 'VISUALIZE',
        confidence: 0.8,
        user_text: userText
      };
    }
    return {
      intent: 'CREATE_SOUND',
      confidence: 0.85,
      user_text: userText
    };
  }
  
  if (lowerText.includes('modify') || lowerText.includes('change') || lowerText.includes('transform') ||
      lowerText.includes('brighten') || lowerText.includes('darken') || lowerText.includes('add')) {
    return {
      intent: 'MODIFY_SOUND',
      confidence: 0.85,
      user_text: userText
    };
  }
  
  if (lowerText.includes('what') || lowerText.includes('explain') || lowerText.includes('how') ||
      lowerText.includes('meaning') || lowerText.includes('mean')) {
    return {
      intent: 'EXPLAIN_CONCEPT',
      confidence: 0.9,
      user_text: userText
    };
  }
  
  if (lowerText.includes('convert') || lowerText.includes('translate') || 
      (lowerText.includes('faust') && lowerText.includes('chuck')) ||
      (lowerText.includes('pd') && lowerText.includes('max'))) {
    const targetLang = lowerText.includes('chuck') ? 'chuck' : 
                      lowerText.includes('faust') ? 'faust' :
                      lowerText.includes('pd') ? 'pd' : undefined;
    return {
      intent: 'TRANSLATE_CODE',
      confidence: 0.8,
      target_language: targetLang,
      user_text: userText
    };
  }
  
  if (lowerText.includes('parameter') || lowerText.includes('param') || 
      lowerText.includes('suggest') || lowerText.includes('recommend')) {
    return {
      intent: 'SUGGEST_PARAMS',
      confidence: 0.8,
      user_text: userText
    };
  }
  
  if (lowerText.includes('example') || lowerText.includes('show') || lowerText.includes('demo')) {
    return {
      intent: 'RETRIEVE_EXAMPLE',
      confidence: 0.85,
      user_text: userText
    };
  }
  
  // Default to CREATE_SOUND if unclear
  return {
    intent: 'CREATE_SOUND',
    confidence: 0.6,
    user_text: userText
  };
}

export async function normalizeGoal(
  userText: string,
  intent: IntentType
): Promise<GoalDescriptor> {
  // Extract structured goal from free text
  // This would typically use an LLM to parse perceptual and technical descriptors
  
  const lowerText = userText.toLowerCase();
  const perceptualTags: string[] = [];
  const technicalTargets: Record<string, any> = {};
  
  // Extract perceptual descriptors
  const perceptualKeywords: Record<string, string[]> = {
    bright: ['bright', 'shiny', 'sparkly', 'crisp'],
    dark: ['dark', 'muffled', 'warm', 'wooly'],
    metallic: ['metallic', 'steel', 'tinny', 'bell-like'],
    warm: ['warm', 'smooth', 'creamy', 'soft'],
    harsh: ['harsh', 'aggressive', 'edgy', 'sharp'],
    shimmer: ['shimmer', 'shimmery', 'sparkle', 'glitter'],
    ambient: ['ambient', 'atmospheric', 'distant', 'spacey'],
    percussive: ['percussive', 'punchy', 'snappy', 'tight'],
    granular: ['granular', 'grainy', 'textured', 'cloudy'],
    resonant: ['resonant', 'ringing', 'echoing', 'reverberant']
  };
  
  for (const [tag, keywords] of Object.entries(perceptualKeywords)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      perceptualTags.push(tag);
    }
  }
  
  // Extract technical parameters
  const grainMatch = lowerText.match(/(\d+)\s*(ms|millisecond)/i);
  if (grainMatch) {
    const ms = parseInt(grainMatch[1]);
    technicalTargets.grain_ms = [ms * 0.8, ms * 1.2];
  }
  
  if (lowerText.includes('quick') || lowerText.includes('fast') || lowerText.includes('short')) {
    technicalTargets.attack_ms = [0, 50];
    technicalTargets.release_ms = [100, 500];
  }
  
  if (lowerText.includes('slow') || lowerText.includes('long') || lowerText.includes('sustain')) {
    technicalTargets.attack_ms = [50, 200];
    technicalTargets.release_ms = [500, 2000];
  }
  
  if (lowerText.includes('detune') || lowerText.includes('detuned')) {
    technicalTargets.pitch_detune_cents = [-15, 15];
  }
  
  if (lowerText.includes('centroid') || lowerText.includes('brightness')) {
    technicalTargets.centroid_target = 4500; // Hz, default for "bright"
  }
  
  return {
    perceptual_tags: perceptualTags.length > 0 ? perceptualTags : ['neutral'],
    technical_targets: technicalTargets,
    time_scale: lowerText.includes('short') ? 'short' : 
                lowerText.includes('long') ? 'long' : 'medium',
    dynamic_range: lowerText.includes('wide') ? 'wide' : 
                   lowerText.includes('narrow') ? 'narrow' : undefined
  };
}

/**
 * Route user intent to appropriate handler modules
 */
export async function routeIntent(
  userText: string,
  userContext?: {
    uploadedAudio?: File;
    existingCode?: string;
    targetLanguage?: Language;
  }
): Promise<{
  classification: IntentClassification;
  nextSteps: string[];
}> {
  const classification = await classifyIntent(userText);
  const structuredGoal = classification.intent === 'CREATE_SOUND' || 
                        classification.intent === 'MODIFY_SOUND'
    ? await normalizeGoal(userText, classification.intent)
    : undefined;
  
  if (structuredGoal) {
    classification.structured_goal = structuredGoal;
  }
  
  const nextSteps: string[] = [];
  
  switch (classification.intent) {
    case 'CREATE_SOUND':
      nextSteps.push('retriever: Fetch relevant DSP examples');
      nextSteps.push('planner: Generate block-level patch sketch');
      nextSteps.push('codegen: Generate ChucK/FAUST/PD code');
      nextSteps.push('validator: Validate code and check features');
      break;
      
    case 'MODIFY_SOUND':
      nextSteps.push('analyzer: Analyze uploaded audio (Meyda/librosa)');
      nextSteps.push('retriever: Fetch matching transform examples');
      nextSteps.push('codegen: Generate transform chain');
      nextSteps.push('validator: Preview and validate');
      break;
      
    case 'EXPLAIN_CONCEPT':
      nextSteps.push('retriever: Fetch relevant documentation');
      nextSteps.push('explainer: Generate explanation with examples');
      break;
      
    case 'TRANSLATE_CODE':
      nextSteps.push('parser: Parse source code structure');
      nextSteps.push('codegen: Generate target language code');
      nextSteps.push('validator: Validate translated code');
      break;
      
    case 'SUGGEST_PARAMS':
      nextSteps.push('analyzer: Analyze current patch');
      nextSteps.push('retriever: Fetch similar patches with params');
      nextSteps.push('recommender: Suggest parameter ranges');
      break;
      
    case 'VISUALIZE':
      nextSteps.push('analyzer: Extract audio features');
      nextSteps.push('codegen: Generate Hydra visual code');
      nextSteps.push('validator: Test visual sync');
      break;
      
    case 'RETRIEVE_EXAMPLE':
      nextSteps.push('retriever: Search for matching examples');
      nextSteps.push('formatter: Format examples for display');
      break;
  }
  
  return {
    classification,
    nextSteps
  };
}


