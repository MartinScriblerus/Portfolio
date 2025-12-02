// src/utils/tempoEstimate.ts
export function estimateBPMFromEnvelope(envelope: Float32Array, sampleRate: number, hopSize: number) {
  // envelope length in frames; time between frames = hopSize / sampleRate
  const frameTime = hopSize / sampleRate; // seconds per envelope frame
  // Autocorrelation
  const n = envelope.length;
  const ac = new Float32Array(n);
  for (let lag = 1; lag < n; lag++) {
    let sum = 0;
    for (let i = 0; i + lag < n; i++) {
      sum += envelope[i] * envelope[i + lag];
    }
    ac[lag] = sum;
  }
  // Find best lag in a plausible tempo band (60–200 BPM)
  // BPM = 60 / periodSeconds; periodSeconds = lag * frameTime
  let bestLag = -1;
  let bestVal = -Infinity;
  const minLag = Math.max(1, Math.floor((60 / 200) / frameTime));
  const maxLag = Math.min(n - 1, Math.ceil((60 / 60) / frameTime));
  for (let lag = minLag; lag <= maxLag; lag++) {
    const val = ac[lag];
    if (val > bestVal) {
      bestVal = val;
      bestLag = lag;
    }
  }
  if (bestLag <= 0) return null;
  const periodSec = bestLag * frameTime;
  let bpm = 60 / periodSec;

  // Octave fold to 60–200 if needed
  while (bpm < 60) bpm *= 2;
  while (bpm > 200) bpm /= 2;

  return Math.round(bpm);
}

export function bpmFromNoteOnsets(onsetTimesSec: number[]) {
  if (onsetTimesSec.length < 2) return null;
  const diffs = [];
  for (let i = 1; i < onsetTimesSec.length; i++) diffs.push(onsetTimesSec[i] - onsetTimesSec[i - 1]);
  const median = diffs.sort((a,b)=>a-b)[Math.floor(diffs.length/2)];
  if (!median || median <= 0) return null;
  let bpm = 60 / median;
  while (bpm < 60) bpm *= 2;
  while (bpm > 200) bpm /= 2;
  return Math.round(bpm);
}