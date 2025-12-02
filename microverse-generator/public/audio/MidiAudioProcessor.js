class MidiAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.midiQueue = []; // Queue for incoming MIDI messages
    this.midiFrame = 0;

    this.bpmHistory = { current: [] };
    this.triggerType = '';
    this.triggerArgs = [];
    this.quarterNoteBeatStart = { current: undefined };
   
    this.noteWeights = { current: [] };
    this.lastClockTime = { current: Date.now()};
    this.quarterLengthNumPriorEstimates = { current: 0 };

    this.bpmSmoothingTooLarge = { current: 0 };
    this.bpmSmoothingIsFine = { current: 0 };

    this.midiBPMClockIncoming = { current: [] };

    this.port.onmessage = (event) => {
      // Push incoming MIDI data into queue
      if (event.data) {
        this.midiQueue.push(event.data);
      }
    };

    this.quarterLengthEstimate = { current: 0 }; // Default quarter note length estimate in milliseconds

    this.handleObserveQuarterLength = (observedLength) => {
      // if (observedLength !== quarterLengthEstimate.current) {
      this.quarterLengthEstimate.current = (this.quarterLengthEstimate.current * (this.quarterLengthNumPriorEstimates.current - 1) + observedLength) / (this.quarterLengthNumPriorEstimates.current);
      // }
      // console.log("NEW QUARTER LENGTH ESTIMATE: ", quarterLengthEstimate.current);
      // console.log("NEW BPM ESTIMATE?? ", 60000/quarterLengthEstimate.current);
    }
  }

  process(inputs, outputs, parameters) {
    // const this.bpmHistory = null;

    

    // Example MIDI data processing
    while (this.midiQueue.length > 0) {
      const msg = this.midiQueue.shift();
      // console.log("PROCESSING MIDI MSG", msg);
      const statusByte = msg[0] & 0xf0;
      const statusByteClock = msg[0] & 0xf8;
      const note = msg[1];
      const velocity = msg[2];

      // BPM / clock handling
      if (statusByteClock) {
        if (msg[0] === 250) {
          this.quarterNoteBeatStart.current = Date.now();
        } else if (this.quarterNoteBeatStart.current) {
          this.quarterLengthNumPriorEstimates.current++;
          const quarterLength = 24 * ((Date.now() - this.quarterNoteBeatStart.current) / this.quarterLengthNumPriorEstimates.current);
          this.handleObserveQuarterLength(quarterLength);
        }

        if (msg[0] === 248) {
          this.midiFrame++;
          const currentTime = Date.now();

          if (this.lastClockTime.current) {
            const delta = currentTime - this.lastClockTime.current;
            if (delta > MAX_CLOCK_PULSE_INTERVAL) {
              this.bpmSmoothingTooLarge.current++;
            } else {
              this.bpmSmoothingIsFine.current++;
              if (delta > MIN_CLOCK_PULSE_INTERVAL && delta < MAX_CLOCK_PULSE_INTERVAL) {
                const bpm = 60 / ((delta * 24) / 1000);
                if (bpm && bpm > 0 && !isNaN(bpm)) {
                  this.bpmHistory.current.push(bpm);
                  if (this.bpmHistory.current.length > BPM_SMOOTHING_WINDOW) {
                    this.bpmHistory.current.shift();
                  }
                  const smoothedBPM = this.bpmHistory.current.reduce((sum, b) => sum + b, 0) / this.bpmHistory.current.length;
                  this.midiBPMClockIncoming.current = smoothedBPM;
                }
              }
            }
          }
          this.lastClockTime.current = currentTime;
        }

        // Note weights (unchanged)
        if (this.midiFrame % 96 === 0 && !this.noteWeights.current.includes('Whole')) this.noteWeights.current.push('Whole');
        else if (this.midiFrame % 48 === 0 && !this.noteWeights.current.includes('Half')) this.noteWeights.current.push('Half');
        else if (this.midiFrame % 24 === 0 && !this.noteWeights.current.includes('Quarter')) this.noteWeights.current.push('Quarter');
        else if (this.midiFrame % 12 === 0 && !this.noteWeights.current.includes('Eighth')) this.noteWeights.current.push('Eighth');
        else if (this.midiFrame % 6 === 0 && !this.noteWeights.current.includes('Sixteenth')) this.noteWeights.current.push('Sixteenth');
      }

      let triggerType = null;
      let triggerArgs = null;

      if (statusByte === 0x90 && velocity > 0) {
        triggerType = 'noteOnPlay';
        triggerArgs = [msg[0], note, velocity];
      } else if (statusByte === 0x80 || (statusByte === 0x90 && velocity === 0)) {
        triggerType = 'noteOffPlay';
        // triggerArgs = [msg[0], note];
        triggerArgs = [msg[0], note];
      }

      if (triggerType) {
        const eventData = {
          triggerType,
          triggerArgs,
          quarterStartTimestamp: this.quarterNoteBeatStart.current,
          noteType: this.noteWeights.current,
          noteTimestamp: Date.now(),
          bpmHistory: this.bpmHistory.current,
          bpmGuess: this.midiBPMClockIncoming.current
        };
        // console.log("CHECK FOR EVENT DATA???", eventData);
        this.port.postMessage(eventData);
      }
    // }
    }
    return true;
  }
}

registerProcessor('midi-audio-processor', MidiAudioProcessor);