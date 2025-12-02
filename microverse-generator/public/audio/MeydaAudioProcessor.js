class MeydaAudioWorkletProcessor extends AudioWorkletProcessor {
  constructor() {
      super();
      this.port.onmessage = (event) => {
        console.log("onMSG ", event.data);
          if (event.data.audioData) {
              this.processAudio(event.data.audioData);
          }
      };
  }

    // Small circular buffer to accumulate samples if needed
    _accum = null;
    _accumLen = 0;
    _hop = 128; // post every _hop frames

    process(inputs, outputs, parameters) {
        // inputs is an array of input connections; take first channel of first input
        try {
            const input = inputs && inputs[0] && inputs[0][0];
            if (input && input.length > 0) {
                // copy input to a Float32Array to avoid passing views into main thread
                const frame = new Float32Array(input);

                // initialize accumulator if needed
                if (!this._accum) {
                    this._accum = new Float32Array(this._hop);
                    this._accumLen = 0;
                }

                // push samples into accum (keep last _hop samples)
                const need = this._hop - this._accumLen;
                if (frame.length >= need) {
                    // shift and append
                    if (need > 0 && this._accumLen > 0) {
                        // move tail to front
                        this._accum.set(this._accum.subarray(this._accumLen));
                    }
                    // copy last _hop samples from frame
                    this._accum.set(frame.subarray(frame.length - this._hop), 0);
                    this._accumLen = this._hop;
                } else {
                    // not enough to fill, append at end
                    this._accum.set(frame, this._accumLen);
                    this._accumLen += frame.length;
                }

                // When accumulator full, post a copy to main thread
                if (this._accumLen >= this._hop) {
                    const out = new Float32Array(this._accum);
                    this.port.postMessage({ audioData: out }, [out.buffer]);
                    // reset accumulator
                    this._accumLen = 0;
                }
            }
        } catch (err) {
            // swallow
        }
        return true;
    }
}

registerProcessor('meyda-audio-processor', MeydaAudioWorkletProcessor);