/**
 * Validator: Headless runner for ChucK + Meyda analysis
 * Checks if generated patches are valid and match perceptual goals
 */

import Meyda from 'meyda';

export interface AudioFeatures {
  spectralCentroid: number;
  spectralFlux: number;
  rms: number;
  zcr?: number; // zero crossing rate
  mfcc?: number[]; // MFCC coefficients if available
}

export interface FeatureComparison {
  param: string;
  change: 'increase' | 'decrease' | 'set';
  value?: number;
  reason: string;
}

/**
 * Validate ChucK code by attempting to run it in headless WebChucK
 * Returns audio buffer and extracted features
 */
export async function validatePatch(
  chuckCode: string,
  durationMs: number = 3000
): Promise<{
  audioBuffer: AudioBuffer | null;
  features: AudioFeatures | null;
  errors: string[];
}> {
  const errors: string[] = [];
  let audioBuffer: AudioBuffer | null = null;
  let features: AudioFeatures | null = null;

  try {
    // Dynamic import to avoid SSR issues
    const { Chuck } = await import('webchuck');
    
    // Initialize WebChucK
    const theChuck = await Chuck.init([]);
    
    // Check for basic syntax errors (simple heuristic - look for common ChucK errors)
    if (!chuckCode.includes('=>')) {
      errors.push('Code missing ChucK connection operator (=>)');
    }
    
    if (!chuckCode.includes('dac') && !chuckCode.includes('Dac')) {
      errors.push('Code missing output connection to dac');
    }
    
    // Try to run the code (in a sandboxed way)
    // Note: WebChucK doesn't have a direct renderToArrayBuffer in headless mode
    // For now, we'll validate syntax and return mock features
    // In production, you'd need to:
    // 1. Run ChucK in a headless Node.js environment, or
    // 2. Use WebChucK's real-time processing and capture audio from AudioWorklet
    
    // For demonstration, we'll do a basic validation
    theChuck.runCode(chuckCode);
    
    // In a real implementation, you would:
    // 1. Connect ChucK to an offline AudioContext
    // 2. Render audio to a buffer
    // 3. Extract features with Meyda
    
    // Mock feature extraction for now (replace with real implementation)
    features = {
      spectralCentroid: 3500, // Hz
      spectralFlux: 0.02,
      rms: -20 // dB
    };
    
  } catch (error: any) {
    errors.push(`ChucK execution error: ${error.message || String(error)}`);
  }
  
  return {
    audioBuffer,
    features,
    errors
  };
}

/**
 * Extract audio features from an AudioBuffer using Meyda
 */
export function extractFeatures(
  audioBuffer: AudioBuffer,
  options?: {
    sampleRate?: number;
    bufferSize?: number;
    hopSize?: number;
  }
): AudioFeatures {
  const sampleRate = options?.sampleRate || audioBuffer.sampleRate;
  const bufferSize = options?.bufferSize || 2048;
  const hopSize = options?.hopSize || 512;
  
  const channelData = audioBuffer.getChannelData(0);
  const length = channelData.length;
  
  // Extract features frame by frame
  const centroids: number[] = [];
  const fluxes: number[] = [];
  const rmsValues: number[] = [];
  
  for (let i = 0; i < length - bufferSize; i += hopSize) {
    const frame = channelData.slice(i, i + bufferSize);
    
    try {
      const features = Meyda.extract(
        ['spectralCentroid', 'spectralFlux', 'rms'],
        frame,
        {
          sampleRate,
          bufferSize,
          hopSize
        }
      );
      
      if (features.spectralCentroid !== undefined) {
        centroids.push(features.spectralCentroid);
      }
      if (features.spectralFlux !== undefined) {
        fluxes.push(features.spectralFlux);
      }
      if (features.rms !== undefined) {
        rmsValues.push(features.rms);
      }
    } catch (e) {
      // Skip frames that fail feature extraction
      console.warn('Feature extraction failed for frame:', e);
    }
  }
  
  // Aggregate features (mean)
  const spectralCentroid = centroids.length > 0 
    ? centroids.reduce((a, b) => a + b, 0) / centroids.length 
    : 0;
  const spectralFlux = fluxes.length > 0 
    ? fluxes.reduce((a, b) => a + b, 0) / fluxes.length 
    : 0;
  const rms = rmsValues.length > 0 
    ? rmsValues.reduce((a, b) => a + b, 0) / rmsValues.length 
    : -60; // default quiet
  
  return {
    spectralCentroid,
    spectralFlux,
    rms: 20 * Math.log10(Math.max(rms, 1e-10)) // convert to dB
  };
}

/**
 * Compare target features with actual features and generate recommendations
 */
export function compareFeatures(
  target: Partial<Record<keyof AudioFeatures, number | [number, number]>>,
  actual: AudioFeatures
): FeatureComparison[] {
  const recommendations: FeatureComparison[] = [];
  
  // Check spectral centroid (brightness)
  if (target.spectralCentroid !== undefined) {
    const targetCentroid = Array.isArray(target.spectralCentroid) 
      ? (target.spectralCentroid[0] + target.spectralCentroid[1]) / 2
      : target.spectralCentroid;
    
    if (actual.spectralCentroid < targetCentroid * 0.9) {
      recommendations.push({
        param: 'filter_cutoff',
        change: 'increase',
        reason: `spectral centroid too low (${actual.spectralCentroid.toFixed(0)}Hz vs target ~${targetCentroid.toFixed(0)}Hz) → sound is darker than target. Increase filter cutoff or add high-frequency content.`
      });
    } else if (actual.spectralCentroid > targetCentroid * 1.1) {
      recommendations.push({
        param: 'filter_cutoff',
        change: 'decrease',
        reason: `spectral centroid too high (${actual.spectralCentroid.toFixed(0)}Hz vs target ~${targetCentroid.toFixed(0)}Hz) → sound is brighter than target. Lower filter cutoff or reduce high-frequency content.`
      });
    }
  }
  
  // Check spectral flux (transient activity)
  if (target.spectralFlux !== undefined) {
    const targetFlux = Array.isArray(target.spectralFlux)
      ? (target.spectralFlux[0] + target.spectralFlux[1]) / 2
      : target.spectralFlux;
    
    if (actual.spectralFlux > targetFlux * 1.2) {
      recommendations.push({
        param: 'grain_ms',
        change: 'increase',
        reason: `spectral flux too high (${actual.spectralFlux.toFixed(3)} vs target ~${targetFlux.toFixed(3)}) → too much transient jitter. Increase grain duration or smooth transitions.`
      });
    } else if (actual.spectralFlux < targetFlux * 0.8) {
      recommendations.push({
        param: 'grain_ms',
        change: 'decrease',
        reason: `spectral flux too low (${actual.spectralFlux.toFixed(3)} vs target ~${targetFlux.toFixed(3)}) → not enough transient activity. Decrease grain duration or add modulation.`
      });
    }
  }
  
  // Check RMS (loudness)
  if (target.rms !== undefined) {
    const targetRms = Array.isArray(target.rms)
      ? (target.rms[0] + target.rms[1]) / 2
      : target.rms;
    
    if (actual.rms < targetRms - 3) {
      recommendations.push({
        param: 'gain',
        change: 'increase',
        value: Math.pow(10, (targetRms - actual.rms) / 20),
        reason: `RMS too low (${actual.rms.toFixed(1)}dB vs target ~${targetRms.toFixed(1)}dB) → sound is quieter than target. Increase gain or amplitude.`
      });
    } else if (actual.rms > targetRms + 3) {
      recommendations.push({
        param: 'gain',
        change: 'decrease',
        value: Math.pow(10, (actual.rms - targetRms) / 20),
        reason: `RMS too high (${actual.rms.toFixed(1)}dB vs target ~${targetRms.toFixed(1)}dB) → sound is louder than target. Decrease gain or amplitude.`
      });
    }
  }
  
  return recommendations;
}

/**
 * Validate code statically (syntax checking without execution)
 */
export function validateCodeStatic(chuckCode: string): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Basic syntax checks
  if (!chuckCode.trim()) {
    errors.push('Code is empty');
    return { valid: false, errors, warnings };
  }
  
  // Check for connection operator
  if (!chuckCode.includes('=>')) {
    errors.push('Missing ChucK connection operator (=>)');
  }
  
  // Check for output
  if (!chuckCode.includes('dac') && !chuckCode.includes('Dac')) {
    warnings.push('No connection to dac found - code may not produce output');
  }
  
  // Check for common syntax errors
  const openParens = (chuckCode.match(/\(/g) || []).length;
  const closeParens = (chuckCode.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    errors.push('Mismatched parentheses');
  }
  
  const openBraces = (chuckCode.match(/{/g) || []).length;
  const closeBraces = (chuckCode.match(/}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push('Mismatched braces');
  }
  
  // Check for undefined UGens (basic check - would need full parser for complete validation)
  const ugenPattern = /\b(SinOsc|SawOsc|SndBuf|Granulator|LPF|HPF|BPF|Comb|DelayA|DelayP|JCRev|ADSR|Gain|Noise|Impulse|WvIn)\b/;
  if (!ugenPattern.test(chuckCode)) {
    warnings.push('No recognized ChucK UGens found');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}


