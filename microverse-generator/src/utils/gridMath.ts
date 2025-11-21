// src/utils/gridMath.ts
import { GridConfig, TimeSignature } from '../interfaces/audioInterfaces';

export function computeGridConfig(
  ts: TimeSignature,
  stepsPerBeat: number,
  loopMeasures = 1
): GridConfig {
  const beatsPerMeasure = 4 * (ts.num / ts.den);
  const stepsPerMeasure = Math.round(beatsPerMeasure * stepsPerBeat);
  return { beatsPerMeasure, stepsPerMeasure, loopMeasures };
}

export function secondsPerBeat(bpm: number) {
  return 60 / bpm;
}

export function computePlayheadSteps(opts: {
  audioCtxTime: number;
  startedAt: number;
  bpm: number;
  stepsPerBeat: number;
  stepsPerMeasure: number;
  loopMeasures: number;
}) {
  const { audioCtxTime, startedAt, bpm, stepsPerBeat, stepsPerMeasure, loopMeasures } = opts;
  const t = Math.max(0, audioCtxTime - startedAt);
  const spb = secondsPerBeat(bpm);
  const beats = t / spb;
  const steps = beats * stepsPerBeat;
  const stepsPerLoop = stepsPerMeasure * loopMeasures;
  return stepsPerLoop > 0 ? (steps % stepsPerLoop) : 0;
}