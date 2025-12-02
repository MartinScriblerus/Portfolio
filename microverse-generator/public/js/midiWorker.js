self.onmessage = async function (event) {
    
    if (event.data && event.data.type === "INIT_MIDI") {
        try {
            const midiAccess = await navigator.requestMIDIAccess();
            midiAccess.onstatechange = (e) => {
                self.postMessage({ type: "MIDI_STATE_CHANGE", data: e.port.state });
            };

            for (let input of midiAccess.inputs.values()) {
                input.onmidimessage = (midiMessage) => {
                    self.postMessage({ type: "MIDI_MESSAGE", data: midiMessage.data });
                };
            }

            self.postMessage({ type: "MIDI_READY", status: "success" });
        } catch (error) {
            self.postMessage({ type: "MIDI_ERROR", error: error.message });
        }
    }
};


// nav.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure).catch(function(error: Error) {
//     //     console.error("Failed to get MIDI access:", error);
//     //   });