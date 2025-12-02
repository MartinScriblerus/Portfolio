const BaseWorkletNode =
  (typeof globalThis !== 'undefined' && typeof globalThis.AudioWorkletNode !== 'undefined')
    ? globalThis.AudioWorkletNode
    : class {};

export default class MidiAudioNode extends BaseWorkletNode {
  constructor(context, options = {}) {
    if (!context?.audioWorklet || typeof globalThis.AudioWorkletNode === 'undefined') {
      throw new Error('AudioWorklet not available; create this node only in the browser after addModule().');
    }
    super(context, 'midi-audio-processor', {
      outputChannelCount: [2],
      processorOptions: options.processorOptions || {}
    });
    this.port.onmessage = (e) => { if (this.onmessage) this.onmessage(e.data); };
  }

  static async ensureModule(context, moduleUrl = '/audio/midi-audio-processor.js') {
    if (!context?.audioWorklet) throw new Error('audioWorklet unavailable');
    await context.audioWorklet.addModule(moduleUrl);
  }

  sendMidiData(midiData) { this.port.postMessage(midiData); }
}