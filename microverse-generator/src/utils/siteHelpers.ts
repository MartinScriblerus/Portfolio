export function getBaseUrl() {
    return process.env.VERCEL_ENV === "development" || "local"
        ? `http://localhost:3000`
        : process.env.NEXT_PUBLIC_URL
}

export function deriveGridParams(beatsNumerator: number, beatsDenominator: number) {
    const safeNum = (n: any, d = 4) => Number.isFinite(+n) && +n > 0 ? (+n | 0) : d;
    const beatsPerMeasure = safeNum(beatsNumerator, 4);
    const stepsPerBeat = safeNum(beatsDenominator, 4);
    const stepsPerMeasure = beatsPerMeasure * stepsPerBeat;
    return { beatsPerMeasure, stepsPerBeat, stepsPerMeasure };
}

export type NoteUnit = '1/1' | '1/2' | '1/4' | '1/8' | '1/16' | '1/32';

export type Subdivision = {
  unit: NoteUnit;       // base note value relative to a whole note
  dotted?: boolean;     // + 50% time
  triplet?: boolean;    // * 2/3 time (three in the space of two)
};

// 1. Quarter-note duration in milliseconds for a given BPM
export function quarterMs(bpm: number): number {
  return 60000 / Math.max(1, bpm);
}

// 2. Convert a subdivision to a multiplier of a quarter-note length
// Example: '1/8' -> 0.5 quarters; dotted 1/8 -> 0.75; triplet 1/8 -> 1/3 (~0.3333)
export function unitToQuarterMultiplier(sub: Subdivision): number {
  const map: Record<NoteUnit, number> = {
    '1/1': 4,
    '1/2': 2,
    '1/4': 1,
    '1/8': 0.5,
    '1/16': 0.25,
    '1/32': 0.125,
  };
  let mult = map[sub.unit] ?? 1;

  // Dotted adds 50% time
  if (sub.dotted) mult *= 1.5;

  // Triplet squeezes 3 into the time of 2 of the same base unit
  if (sub.triplet) mult *= (2 / 3);

  return mult;
}

// 3. Interval duration in milliseconds for a chosen subdivision
export function intervalMs(bpm: number, sub: Subdivision): number {
  return quarterMs(bpm) * unitToQuarterMultiplier(sub);
}

// 4. Steps per quarter for a chosen subdivision (purely for timing overlay, not grid shape)
// Example: 1/16 -> 4 steps/quarter; 1/8T -> 3 steps/quarter; dotted values produce non-integers.
export function stepsPerQuarterFromSubdivision(sub: Subdivision): number {
  const qMult = unitToQuarterMultiplier(sub); // length in quarters
  return 1 / qMult;
}

// 5. Optional: compute measure length (ms) using your current grid shape mapping
export function measureMs(
  bpm: number,
  beatsNumerator: number,
  beatsDenominator: number
): number {
  // Your grid uses beatsNumerator beats per measure, each beat = 1/denominator of a whole.
  // Quarter-note ms:
  const qms = quarterMs(bpm);
  // One beat (denominator) in quarters:
  const beatInQuarters = 4 / Math.max(1, beatsDenominator);
  const beatMs = qms * beatInQuarters;
  return beatMs * Math.max(1, beatsNumerator);
}

// 6. Logging helper
export function logTimingInfo(
  bpm: number,
  sub: Subdivision,
  beatsNumerator: number,
  beatsDenominator: number
) {
  const q = quarterMs(bpm);
  const beatInQuarters = 4 / Math.max(1, beatsDenominator);
  const beatLenMs = q * beatInQuarters;
  const intMs = intervalMs(bpm, sub);
  const measMs = measureMs(bpm, beatsNumerator, beatsDenominator);
  // eslint-disable-next-line no-console
  console.info('[timing]',
    { bpm, quarterMs: q, beatLenMs, intervalMs: intMs, measureMs: measMs, sub });
}

export const analysisObjectDefaults = {
    osc: {
        centroid: [],
        flux: [],
        rms: [],
        mfccEnergy: [],
        mfccVals: [],
        rolloff: [],
        dct: [],
        gain: [],
        freq: [],
        kurtosis: [],
    },
    stk: {
        centroid: [],
        flux: [],
        rms: [],
        mfccEnergy: [],
        mfccVals: [],
        rolloff: [],
        dct: [],
        gain: [],
        freq: [],
        kurtosis: [],
    },
    sampler: {
        centroid: [],
        flux: [],
        rms: [],
        mfccEnergy: [],
        mfccVals: [],
        rolloff: [],
        dct: [],
        gain: [],
        freq: [],
        kurtosis: [],
    },
    audioin: {
        centroid: [],
        flux: [],
        rms: [],
        mfccEnergy: [],
        mfccVals: [],
        rolloff: [],
        dct: [],
        gain: [],
        freq: [],
        kurtosis: [],
    },
}

export async function convertFrequency(notefreqchart: any, freq: number, microFreq: any, microMidiNum: any) { 
    console.log("FREQ??? ", freq, "NOTE FREQ CHART??? ", notefreqchart, "MICROFREQ??? ", microFreq, "MICROMIDINUM??? ", microMidiNum);
    const freqLets: string[] = [];
    Object.values(notefreqchart).forEach((val: any, idx: number) => {        
        // console.log("WHAT IS VAL? ", val, Object.keys(notefreqchart)[idx - 1])
        if (!freqLets.includes(
            Object.keys(notefreqchart)[idx - 1])
        ) freqLets.push(Object.keys(notefreqchart)[idx - 1]);
    });
    // console.log("FREQLETS: ", freqLets);
    // console.log("NEW MICRO ARR: ", newMicroTonalArr);
    return freqLets;
}

export const noteToMidi = (note: string, octave: number): number => {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const enharmonics: Record<string, string> = {
    "Db": "C#",
    "Eb": "D#",
    "Gb": "F#",
    "Ab": "G#",
    "Bb": "A#",
  };

  const normalized = enharmonics[note] || note.toUpperCase();

  const index = names.indexOf(normalized);
  if (index === -1) {
    console.warn(`Unknown note: ${note}, defaulting to middle C`);
    return 60;
  }

  return (octave + 1) * 12 + index;
};