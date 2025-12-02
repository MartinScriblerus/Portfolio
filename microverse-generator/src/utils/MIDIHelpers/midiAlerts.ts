let midi = null; // global MIDIAccess object

export function onMIDISuccess(midiAccess: any) {
    console.log("MIDI ready!");
    midi = midiAccess; // store in the global (in real usage, would probably keep in an object instance)
    return midi;
  }
  
export function onMIDIFailure(msg: any) {
    console.error(`Failed to get MIDI access - ${msg}`);
    return undefined;
}