// Small, pure helpers for OldParentMonolith

export function flattenFreqsInRange(
  obj: Record<any, Record<any, number>>,
  minOctave: number,
  maxOctave: number
): number[] {
  const result: number[] = [];
  for (let octave = minOctave; octave <= maxOctave; octave++) {
    const scale = obj[octave];
    if (!scale) continue;
    const positions = Object.keys(scale)
      .map((n) => Number(n))
      .sort((a, b) => a - b);
    for (const pos of positions) {
      result.push(scale[pos]);
    }
  }
  return result;
}
