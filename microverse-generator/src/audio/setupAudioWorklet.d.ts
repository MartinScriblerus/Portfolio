declare function setupAudioWorklet(
  audioContext: AudioContext,
  setMidiData: (data: any) => void
): Promise<void>;

export default setupAudioWorklet;

