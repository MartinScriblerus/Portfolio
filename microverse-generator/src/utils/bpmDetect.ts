// src/utils/bpmDetect.ts
import { estimateBPMFromEnvelope } from './tempoEstimate';

export type BpmDetectOptions = {
  hopSize?: number;     // frames per envelope sample
  channel?: number;     // which channel to analyze
  minWindowSec?: number;// min duration of audio to analyze
};

export function computeRmsEnvelope(signal: Float32Array, hopSize = 1024): Float32Array {
  const n = Math.ceil(signal.length / hopSize);
  const env = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const start = i * hopSize;
    const end = Math.min(signal.length, start + hopSize);
    let sum = 0;
    for (let j = start; j < end; j++) {
      const s = signal[j];
      sum += s * s;
    }
    const len = end - start || 1;
    env[i] = Math.sqrt(sum / len);
  }
  // quick high-pass-ish normalization to reduce DC drift
  const mean = env.reduce((a, b) => a + b, 0) / env.length;
  for (let i = 0; i < env.length; i++) env[i] = Math.max(0, env[i] - mean);
  return env;
}

export function detectBpmFromAudioBuffer(
  buffer: AudioBuffer,
  windowStartSec?: number,
  windowEndSec?: number,
  opts: BpmDetectOptions = {}
): number | null {
  const { hopSize = 1024, channel = 0, minWindowSec = 1.5 } = opts;
  const sr = buffer.sampleRate;
  const totalSec = buffer.duration;

  const start = Math.max(0, Math.min(windowStartSec ?? 0, totalSec));
  const end = Math.max(start, Math.min(windowEndSec ?? totalSec, totalSec));
  if (end - start < minWindowSec) return null;

  const ch = Math.min(channel, buffer.numberOfChannels - 1);
  const chan = buffer.getChannelData(ch);
  const startSample = Math.floor(start * sr);
  const endSample = Math.floor(end * sr);
  const segment = chan.subarray(startSample, endSample);

  const env = computeRmsEnvelope(segment, hopSize);
  return estimateBPMFromEnvelope(env, sr, hopSize);
}

/**
 * Convenience for Wavesurfer.js v7 instances (works with or without @wavesurfer/react).
 * If a region is passed, analyze that window; otherwise, analyze the full decoded buffer.
 */
export function detectBpmFromWavesurfer(
  wavesurfer: any,
  region?: { start: number; end: number },
  opts?: BpmDetectOptions
): number | null {
  const buffer: AudioBuffer | null = wavesurfer?.getDecodedData?.() ?? null;
  if (!buffer) return null;
  if (region) {
    return detectBpmFromAudioBuffer(buffer, region.start, region.end, opts);
  }
  return detectBpmFromAudioBuffer(buffer, undefined, undefined, opts);
}

