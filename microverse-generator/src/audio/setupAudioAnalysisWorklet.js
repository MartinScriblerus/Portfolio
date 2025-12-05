import AudioAnalysisNode from "./AudioAnalysisNode";

let processorRegisteredAnalysis = false;

const setupAudioAnalysisWorklet = async (audioContext, setMeydaData) => {
  console.log("Setting up audio analysis worklet: ", audioContext.audioWorklet);
  try {
    // Ensure the processor module is added once per page load; create and return
    // a fresh node instance every time the helper is called.
    if (!processorRegisteredAnalysis) {
      // Ensure correct file name (public folder): MeydaAudioProcessor.js
      await audioContext.audioWorklet.addModule('/audio/MeydaAudioProcessor.js');
      processorRegisteredAnalysis = true; // Mark as registered
    }

    const meydaNode = new AudioAnalysisNode(audioContext, { processorName: 'meyda-audio-processor' });
    console.log('meydaNode: ', meydaNode);
    // Do not attach a default port.onmessage handler here — callers (hooks)
    // should attach their own listener so they can decide whether to forward
    // raw frames to a worker or run Meyda.extract on the main thread.
    return meydaNode;
  } catch (e) {
    console.log("ERROR setting up Meyda worklet:", e);
    return null;
  }
};
export default setupAudioAnalysisWorklet;
