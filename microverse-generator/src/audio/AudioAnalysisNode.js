// class MeydaAudioWorkletNode extends AudioWorkletNode {
//   constructor(context) {
//       super(context, 'meyda-audio-processor');
//       this.data = [];
//   }

//   setMeydaData(audioData) {
//       // Send audio data to Web Worker for analysis
//       console.log("AUD DATA? ", audioData);
//       this.port.postMessage(audioData);
//   }
// }

// export default MeydaAudioWorkletNode;

const BaseWorkletNode =
  (typeof globalThis !== 'undefined' && typeof globalThis.AudioWorkletNode !== 'undefined')
    ? globalThis.AudioWorkletNode
    : class {};

export default class MeydaAudioWorkletNode extends BaseWorkletNode {
  constructor(context, options = {}) {
    if (!context || !context.audioWorklet || typeof globalThis.AudioWorkletNode === 'undefined') {
      throw new Error('AudioWorklet not available; create this node only in the browser after a user gesture (HTTPS).');
    }
    // Extract processorName from options and remove it before passing to super
    const processorName = options.processorName || 'meyda-audio-processor';
    const { processorName: _, ...workletOptions } = options;
    super(context, processorName, workletOptions);
    this.data = [];
    this.port.onmessage = (e) => {
      this.data.push(e.data);
      if (this.ondata) this.ondata(e.data);
    };
  }

  static async ensureModule(context, moduleUrl) {
    if (!context?.audioWorklet) throw new Error('audioWorklet unavailable');
    await context.audioWorklet.addModule(moduleUrl);
  }
}