import MidiAudioNode from "./MidiAudioNode";

let processorRegistered = false;

const setupAudioWorklet = async (audioContext, setMidiData) => {
  if (processorRegistered) return;  // Skip if already registered

    await audioContext.audioWorklet.addModule('/audio/midiAudioProcessor.js');
    processorRegistered = true;  // Mark as registered  
  
    const midiNode = new MidiAudioNode(audioContext, 'midi-audio-processor');
  
    midiNode.port.onmessage = (event) => {
      // console.log("Received MIDI event:", event.data);
      setMidiData(event.data); // Store it in React state
    };
  
    return midiNode;
};
export default setupAudioWorklet;
  