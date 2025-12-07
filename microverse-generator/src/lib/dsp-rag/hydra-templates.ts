/**
 * Hydra Video Synth Integration Templates
 * Templates for generating Hydra code that syncs with audio features
 */

export interface HydraTemplate {
  id: string;
  name: string;
  description: string;
  code: string;
  audioFeatures: string[]; // Which Meyda features to use
}

export const HYDRA_TEMPLATES: HydraTemplate[] = [
  {
    id: 'hydra-fft-bars',
    name: 'FFT Frequency Bars',
    description: 'Vertical bars responding to frequency spectrum',
    audioFeatures: ['spectralCentroid', 'rms'],
    code: `// Hydra code synced with audio features
// Use spectralCentroid for color, rms for brightness

osc(20, 0.1, () => audio.spectralCentroid / 1000)
  .rotate(() => audio.rms * 2)
  .kaleid(4)
  .saturate(() => audio.rms * 3)
  .luma(0.5)
  .out()`
  },
  {
    id: 'hydra-waveform',
    name: 'Waveform Visualization',
    description: 'Oscilloscope-style waveform display',
    audioFeatures: ['spectralCentroid', 'spectralFlux'],
    code: `// Waveform visualization
osc(() => audio.spectralCentroid / 2000, 0.1)
  .rotate(() => Math.sin(time * 0.1) * audio.spectralFlux * 10)
  .kaleid(3)
  .color(() => audio.spectralCentroid / 4000, 0.5, 1)
  .out()`
  },
  {
    id: 'hydra-particles',
    name: 'Particle Field',
    description: 'Particle field responding to audio transients',
    audioFeatures: ['spectralFlux', 'rms'],
    code: `// Particle field synced to transients
noise(() => audio.spectralFlux * 20)
  .pixelate(20, 20)
  .kaleid(() => audio.spectralFlux * 5)
  .rotate(() => time * 0.1 + audio.rms * 2)
  .color(() => audio.spectralCentroid / 5000, 0.8, 1)
  .out()`
  },
  {
    id: 'hydra-low-mid-high',
    name: 'Low/Mid/High Frequency Split',
    description: 'Three layers for low, mid, and high frequencies',
    audioFeatures: ['spectralCentroid', 'rms'],
    code: `// Low/Mid/High frequency layers
// Low frequencies (red layer)
osc(5, 0.1, () => audio.rms * 2)
  .modulate(noise(2))
  .color(1, 0.2, 0.2)
  .luma(() => Math.max(0, audio.rms + 0.3))
  .layer(
    // Mid frequencies (green layer)
    osc(15, 0.1, () => audio.spectralCentroid / 1000)
      .modulate(noise(5))
      .color(0.2, 1, 0.2)
      .luma(() => Math.max(0, audio.rms))
      .layer(
        // High frequencies (blue layer)
        osc(30, 0.1, () => audio.spectralCentroid / 500)
          .modulate(noise(10))
          .color(0.2, 0.2, 1)
          .luma(() => Math.max(0, audio.rms - 0.3))
      )
  )
  .out()`
  },
  {
    id: 'hydra-kaleidoscope',
    name: 'Audio-Reactive Kaleidoscope',
    description: 'Symmetrical patterns that pulse with audio',
    audioFeatures: ['spectralFlux', 'rms'],
    code: `// Audio-reactive kaleidoscope
osc(() => audio.spectralFlux * 10, 0.1)
  .kaleid(() => 4 + audio.rms * 2)
  .rotate(() => time * 0.2 + audio.spectralFlux * 5)
  .scale(() => 1 + audio.rms * 0.5)
  .color(() => audio.spectralCentroid / 4000, 0.7, 1)
  .out()`
  },
  {
    id: 'hydra-gradient-flow',
    name: 'Flowing Gradient',
    description: 'Smooth gradient flow responding to spectral content',
    audioFeatures: ['spectralCentroid'],
    code: `// Flowing gradient
gradient(() => Math.sin(time * 0.5) + audio.spectralCentroid / 5000)
  .modulate(noise(() => audio.spectralCentroid / 2000))
  .rotate(() => time * 0.1)
  .scale(() => 1.2 + audio.rms * 0.3)
  .color(() => audio.spectralCentroid / 5000, 0.6, 0.9)
  .out()`
  }
];

/**
 * Generate Hydra code from audio features
 */
export function generateHydraCode(
  templateId: string,
  audioFeatures: Record<string, number>
): string {
  const template = HYDRA_TEMPLATES.find(t => t.id === templateId);
  
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }
  
  let code = template.code;
  
  // Replace audio feature placeholders with actual values
  // In a real implementation, you'd have a more sophisticated replacement system
  // that handles the audio.* references dynamically
  
  return code;
}

/**
 * Create a complete Hydra setup with audio feature binding
 */
export function createHydraSetup(audioFeatures: Record<string, number>): string {
  return `
// Hydra setup with audio feature binding
// Make sure to update audio.spectralCentroid, audio.spectralFlux, audio.rms from Meyda

${HYDRA_TEMPLATES[0].code}

// To use other templates, replace the code above with:
// - hydra-fft-bars: FFT frequency bars
// - hydra-waveform: Waveform visualization  
// - hydra-particles: Particle field
// - hydra-low-mid-high: Low/Mid/High frequency split
// - hydra-kaleidoscope: Audio-reactive kaleidoscope
// - hydra-gradient-flow: Flowing gradient
`;
}

/**
 * Generate Hydra code that responds to specific audio features
 */
export function generateResponsiveHydra(
  targetFeatures: {
    centroid?: boolean;
    flux?: boolean;
    rms?: boolean;
  }
): string {
  const features = [];
  if (targetFeatures.centroid) features.push('spectralCentroid');
  if (targetFeatures.flux) features.push('spectralFlux');
  if (targetFeatures.rms) features.push('rms');
  
  return `
// Hydra code responding to: ${features.join(', ')}
osc(${targetFeatures.centroid ? '() => audio.spectralCentroid / 2000' : '10'}, 0.1)
  ${targetFeatures.flux ? '.rotate(() => audio.spectralFlux * 10)' : '.rotate(() => time * 0.1)'}
  ${targetFeatures.rms ? '.saturate(() => audio.rms * 3)' : '.saturate(1)'}
  .kaleid(4)
  ${targetFeatures.centroid ? '.color(() => audio.spectralCentroid / 4000, 0.5, 1)' : '.color(0.5, 0.5, 1)'}
  .out()
`;
}


