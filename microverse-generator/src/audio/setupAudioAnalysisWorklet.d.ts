declare function setupAudioAnalysisWorklet(
  audioContext: AudioContext,
  setMeydaData: (data: any) => void
): Promise<any | null>;

export default setupAudioAnalysisWorklet;

