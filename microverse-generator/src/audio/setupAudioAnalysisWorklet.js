import AudioAnalysisNode from "./AudioAnalysisNode";

let processorRegisteredAnalysis = false;

const setupAudioAnalysisWorklet = async (audioContext, setMeydaData) => {
  if (processorRegisteredAnalysis) return;  // Skip if already registered
    console.log("Setting up audio analysis worklet: ", audioContext.audioWorklet);
    // console.log(audioContext.audioWorklet);
    try {
      // Ensure correct file name (public folder): MeydaAudioProcessor.js
      await audioContext.audioWorklet.addModule('/audio/MeydaAudioProcessor.js');
      processorRegisteredAnalysis = true;  // Mark as registered  
    
      const meydaNode = new AudioAnalysisNode(audioContext, { processorName: 'meyda-audio-processor' });
      console.log('meydaNode: ', meydaNode);
      meydaNode.port.onmessage = (event) => {
        console.log("Received Meyda event:", event.data);
        setMeydaData(event.data); // Store it in React state
      };
      return meydaNode;
    } catch (e) {
      console.log("ERROR: ", e);
    }
  

};
export default setupAudioAnalysisWorklet;
  