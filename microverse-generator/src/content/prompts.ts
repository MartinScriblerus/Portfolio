export const CTA_PROMPTS: string[] = [
  'Name a color or a sound.',
  'Tap once to stir the image.',
  'Type one word you trust.',
  'Lean left or right—choose a side.',
];

export function randomCTA(): string {
  const i = (Math.random() * CTA_PROMPTS.length) | 0;
  return CTA_PROMPTS[i];
}

export const STARTER_PROMPTS: string[] = [
  'Offer a word to tilt the lens.',
  'Name a color or sound you trust.',
  'What silence calls you now?',
];

export function randomStarter(): string {
  const i = (Math.random() * STARTER_PROMPTS.length) | 0;
  return STARTER_PROMPTS[i];
}
