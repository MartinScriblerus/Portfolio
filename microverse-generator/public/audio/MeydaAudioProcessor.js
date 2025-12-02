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

  processAudio(audioData) {
      // Process audio (e.g., apply Meyda analysis here)
      // Example:
      // const features = Meyda.extract([...], audioData);

      // Send features back to the main thread or Web Worker
      console.log("meyda features: ", features);
      console.log("AUDIO DATA? ", audioData);
      this.port.postMessage({ features });
  }

  process(inputs, outputs, parameters) {
      // Audio processing happens here for real-time feedback
      return true; // Indicates this processor should continue to run
  }
}

registerProcessor('meyda-audio-processor', MeydaAudioWorkletProcessor);