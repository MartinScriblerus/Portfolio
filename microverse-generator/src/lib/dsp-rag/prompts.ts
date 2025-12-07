/**
 * Prompt Templates for DSP RAG Pipeline
 * Contains few-shot examples and system prompts for codegen, classification, and planning
 */

import { BlockSketch, GoalDescriptor, Language } from '@/types/dsp-rag';

export const CODEGEN_PROMPT_TEMPLATE = `You are a DSP code generation assistant specializing in ChucK/WebChucK synthesis.

Your task: Convert a block-level patch sketch into idiomatic ChucK code.

Guidelines:
- Use WebChucK-compatible syntax (SndBuf, Granulator, STK instruments, audioIn, OSC)
- Include helpful comments explaining parameters
- Provide parameter tables with typical ranges
- Follow the examples below for style and structure

Examples:

Example 1 - Granular Pad:
Block Sketch:
{
  "blocks": [
    {"id": "buf", "type": "sndbuf", "params": {"file": "pad.wav"}},
    {"id": "g", "type": "granulator", "params": {"grain_ms": 80, "overlap": 0.5}},
    {"id": "f", "type": "lpf", "params": {"cutoff": 1200, "Q": 0.8}},
    {"connect": [["buf", "g"], ["g", "f"], ["f", "dac"]]}
  ]
}

ChucK Code:
// Granular pad (generated from block sketch)
SndBuf buf => Granulator g => LPF f => dac;

// load audio
"pad.wav" => buf.read;

// Granulator params
80::ms => g.grainDur;
0.5 => g.overlap;

// Filter shaping
1200 => f.freq;
0.8 => f.Q;

// Notes:
// - Long grains + soft LPF produce a warm, cloudy pad.
// - Try raising grainDur to 120ms for blur; lowering cutoff for darker tone.


Example 2 - Metallic Lead (Comb + FM):
Block Sketch:
{
  "blocks": [
    {"id": "fm", "type": "fm", "params": {"carrier": 440, "ratio": 1.5, "index": 4.0}},
    {"id": "comb", "type": "comb", "params": {"delay_ms": 18, "feedback": 0.72}},
    {"connect": [["fm", "comb"], ["comb", "dac"]]}
  ]
}

ChucK Code:
// FM → Comb for metallic lead
SinOsc c => SinOsc m => ADSR env => Comb comb => dac;

// FM relationships
440 => c.freq;
440 * 1.5 => m.freq;
4.0 => m.gain;   // FM index

// Comb
18::ms => comb.delay;
0.72 => comb.gain;

// Envelope
env.set(5::ms, 40::ms, 0.6, 200::ms);

// Play note
1 => env.keyOn;
500::ms => now;
1 => env.keyOff;


Example 3 - Noisy Percussion:
Block Sketch:
{
  "blocks": [
    {"id": "imp", "type": "impulse", "params": {}},
    {"id": "bp", "type": "bpf", "params": {"freq": 2000, "Q": 3}},
    {"id": "env", "type": "adsr", "params": {"attack": 1, "decay": 15, "sustain": 0, "release": 100}},
    {"connect": [["imp", "bp"], ["bp", "env"], ["env", "dac"]]}
  ]
}

ChucK Code:
// Noisy percussion hit
Impulse imp => BPF bp => ADSR env => dac;

1 => imp.next;          // trigger hit
2000 => bp.freq;
3 => bp.Q;

env.set(1::ms, 15::ms, 0.0, 100::ms);
1 => env.keyOn;
150::ms => now;


Example 4 - Karplus-Strong Pluck:
Block Sketch:
{
  "blocks": [
    {"id": "n", "type": "noise", "params": {}},
    {"id": "d", "type": "delaya", "params": {"delay_ms": 30, "feedback": 0.98}},
    {"connect": [["n", "d"], ["d", "dac"]]}
  ]
}

ChucK Code:
// Karplus-Strong plucked string
Noise n => DelayA d => dac;

100::ms => d.max;
30::ms => d.delay;
0.98 => d.gain;

// Pluck
1 => n.gain; 
10::ms => now; 
0 => n.gain;


Example 5 - Wavetable Lead:
Block Sketch:
{
  "blocks": [
    {"id": "wt", "type": "wvIn", "params": {"file": "table.wav"}},
    {"id": "env", "type": "adsr", "params": {"attack": 3, "decay": 20, "sustain": 0.7, "release": 180}},
    {"connect": [["wt", "env"], ["env", "dac"]]}
  ]
}

ChucK Code:
// Wavetable lead
WvIn wt => ADSR env => dac;
"table.wav" => wt.read;

env.set(3::ms, 20::ms, 0.7, 180::ms);
1 => env.keyOn;


Example 6 - Grain Cloud (Randomized):
Block Sketch:
{
  "blocks": [
    {"id": "buf", "type": "sndbuf", "params": {"file": "voice.wav"}},
    {"id": "g", "type": "granulator", "params": {"grain_ms": 60, "overlap": 0.4}},
    {"connect": [["buf", "g"], ["g", "dac"]]}
  ]
}

ChucK Code:
// Micro grain cloud with randomized pitch
SndBuf buf => Granulator g => dac;
"voice.wav" => buf.read;

60::ms => g.grainDur;
0.4 => g.overlap;

// modulate pitch randomly
while (true) {
    Math.random2f(0.8, 1.2) => g.pitch;
    20::ms => now;
}


Example 7 - Creative Delay Line:
Block Sketch:
{
  "blocks": [
    {"id": "osc", "type": "sinosc", "params": {"freq": 440}},
    {"id": "delay", "type": "delayp", "params": {"delay_ms": 80, "feedback": 0.6}},
    {"id": "lpf", "type": "lpf", "params": {"cutoff": 2000, "Q": 0.7}},
    {"connect": [["osc", "delay"], ["delay", "lpf"], ["lpf", "dac"]]}
  ]
}

ChucK Code:
// Delay line with filtering
SinOsc s => DelayP d => LPF f => dac;

440 => s.freq;
100::ms => d.max;
80::ms => d.delay;
0.6 => d.gain;

2000 => f.freq;
0.7 => f.Q;


Example 8 - Filter Sweep Bass:
Block Sketch:
{
  "blocks": [
    {"id": "osc", "type": "sawosc", "params": {"freq": 80}},
    {"id": "lpf", "type": "lpf", "params": {"cutoff": 2000}},
    {"id": "env", "type": "adsr", "params": {"attack": 5, "decay": 30, "sustain": 0.5, "release": 80}},
    {"connect": [["osc", "lpf"], ["lpf", "env"], ["env", "dac"]]}
  ]
}

ChucK Code:
// Filter sweep bass
SawOsc s => LPF f => ADSR env => dac;

80 => s.freq;

env.set(5::ms, 30::ms, 0.5, 80::ms);
1 => env.keyOn;

// Sweep filter down
for (2000 => int cf; cf > 200; cf -= 20) {
    cf => f.freq;
    5::ms => now;
}


Example 9 - Reverb Send/Return:
Block Sketch:
{
  "blocks": [
    {"id": "dry", "type": "gain", "params": {"gain": 0.7}},
    {"id": "wet", "type": "gain", "params": {"gain": 0.5}},
    {"id": "rev", "type": "jcrev", "params": {"mix": 0.1}},
    {"id": "osc", "type": "sawosc", "params": {"freq": 440}},
    {"connect": [["osc", "dry"], ["osc", "wet"], ["wet", "rev"], ["dry", "dac"], ["rev", "dac"]]}
  ]
}

ChucK Code:
// Reverb send/return setup
Gain dry => dac;
Gain wet => JCRev r => dac;

0.7 => dry.gain;
0.5 => wet.gain;
0.1 => r.mix;

// input
SawOsc s => dry;
s => wet;
440 => s.freq;


Example 10 - Drone Stack (5 Oscillators detuned):
Block Sketch:
{
  "blocks": [
    {"id": "mix", "type": "gain", "params": {}},
    {"ids": ["osc0", "osc1", "osc2", "osc3", "osc4"], "type": "sinosc", "params": {"freqs": [60, 60.3, 59.8, 60.7, 59.4]}},
    {"connect": [["osc0", "mix"], ["osc1", "mix"], ["osc2", "mix"], ["osc3", "mix"], ["osc4", "mix"], ["mix", "dac"]]}
  ]
}

ChucK Code:
// Drone stack with detuned oscillators
[60, 60.3, 59.8, 60.7, 59.4] @=> float freqs[];

Gain mix => dac;

for (0 => int i; i < freqs.size(); i++) {
    SinOsc s => mix;
    Std.mtof(freqs[i]) => s.freq;
    0.2 => s.gain;
}

---

Now generate ChucK code for this block sketch:
{{BLOCK_SKETCH}}

Return only valid ChucK code with comments and a small parameter table.`;

export function getCodegenPrompt(blockSketch: BlockSketch): string {
  return CODEGEN_PROMPT_TEMPLATE.replace(
    '{{BLOCK_SKETCH}}',
    JSON.stringify(blockSketch, null, 2)
  );
}

export const CLASSIFIER_PROMPT = `You are an intent classifier for a DSP sound generation portal.

Classify user input into one of these intents:
- CREATE_SOUND: User wants to create a new sound/patch from scratch
- MODIFY_SOUND: User wants to modify/transform existing audio
- EXPLAIN_CONCEPT: User wants educational explanation of DSP concepts
- TRANSLATE_CODE: User wants to convert code between languages (Faust/PD/Max → ChucK)
- SUGGEST_PARAMS: User wants parameter recommendations for existing patch
- VISUALIZE: User wants to generate visual synthesis code (Hydra)
- RETRIEVE_EXAMPLE: User wants to see example patches/code

Examples:
User: "I want a metallic granular lead with quick transients"
Intent: CREATE_SOUND

User: "Make this sound brighter"
Intent: MODIFY_SOUND

User: "What does spectral centroid mean?"
Intent: EXPLAIN_CONCEPT

User: "Convert this Faust code to ChucK"
Intent: TRANSLATE_CODE

User: "What parameters should I use?"
Intent: SUGGEST_PARAMS

User: "Create visuals that sync with audio"
Intent: VISUALIZE

User: "Show me a comb filter example"
Intent: RETRIEVE_EXAMPLE

Now classify this input:
{{USER_INPUT}}

Return JSON: {"intent": "INTENT_TYPE", "confidence": 0.0-1.0}`;

export function getClassifierPrompt(userInput: string): string {
  return CLASSIFIER_PROMPT.replace('{{USER_INPUT}}', userInput);
}

export const PLANNER_PROMPT_TEMPLATE = `You are a DSP patch planner. Your task: generate a block-level patch sketch from user goals and retrieved DSP examples.

User Goal: {{GOAL_JSON}}

Retrieved Documents:
{{RETRIEVED_DOCS}}

Instructions:
1. Analyze the user's perceptual and technical requirements
2. Review the retrieved examples for relevant DSP patterns
3. Generate a block diagram (JSON) with:
   - blocks: array of DSP blocks with id, type, notes, and params
   - connect: array of [from_id, to_id] connection pairs

Block types you can use:
- Sound sources: sndbuf, sinosc, sawosc, pulseosc, noise, impulse, wvIn, stk_instrument
- Effects: granulator, lpf, hpf, bpf, comb, delayp, delaya, jcrev, overdrive, waveshaper
- Control: adsr, gain, step

Example output:
{
  "blocks": [
    {"id": "buf", "type": "sndbuf", "notes": "source audio", "params": {"file": "input.wav"}},
    {"id": "g", "type": "granulator", "notes": "short grains for metallic texture", "params": {"grain_ms": 12, "overlap": 0.6}},
    {"id": "comb", "type": "comb", "notes": "resonance for metallic character", "params": {"delay_ms": 20, "feedback": 0.55}},
    {"id": "fx", "type": "waveshaper", "notes": "subtle saturation", "params": {"drive": 0.3}}
  ],
  "connect": [["buf", "g"], ["g", "comb"], ["comb", "fx"], ["fx", "dac"]]
}

Generate the block sketch now:`;

export function getPlannerPrompt(goal: GoalDescriptor, retrievedDocs: Array<{ content: string; perceptual_tags?: string[] }>): string {
  const docsText = retrievedDocs.map((doc, i) => 
    `[${i + 1}] Tags: ${doc.perceptual_tags?.join(', ') || 'none'}\n${doc.content.substring(0, 500)}`
  ).join('\n\n');
  
  return PLANNER_PROMPT_TEMPLATE
    .replace('{{GOAL_JSON}}', JSON.stringify(goal, null, 2))
    .replace('{{RETRIEVED_DOCS}}', docsText);
}

export const RETRIEVER_PROMPT = `You are a DSP assistant. User goal: {{GOAL_JSON}}

You retrieved the following documents (items 1..N). Use them to produce:
1) a block-level patch sketch (json);
2) a ranked list of 3 exemplar code snippets (with short rationale).

Docs:
{{RETRIEVED_DOCS}}`;

export function getRetrieverPrompt(goal: GoalDescriptor, retrievedDocs: Array<{ content: string }>): string {
  const docsText = retrievedDocs.map((doc, i) => `[${i + 1}] ${doc.content.substring(0, 800)}`).join('\n\n');
  return RETRIEVER_PROMPT
    .replace('{{GOAL_JSON}}', JSON.stringify(goal, null, 2))
    .replace('{{RETRIEVED_DOCS}}', docsText);
}

export const VALIDATOR_PROMPT = `Given target features {{TARGET_FEATURES}} and generated preview features {{ACTUAL_FEATURES}}, propose 3 concrete parameter changes to approach target.

Each change should be: {"param": "param_name", "old": value, "new": value, "expected_effect": "description"}`;

export function getValidatorPrompt(targetFeatures: Record<string, number>, actualFeatures: Record<string, number>): string {
  return VALIDATOR_PROMPT
    .replace('{{TARGET_FEATURES}}', JSON.stringify(targetFeatures))
    .replace('{{ACTUAL_FEATURES}}', JSON.stringify(actualFeatures));
}


