declare function setupAudioAnalysisWorklet(
  audioContext: AudioContext,
  setMeydaData: (data: any) => void
): Promise<void>;

export default setupAudioAnalysisWorklet;

