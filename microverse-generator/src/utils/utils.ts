  export const tryGetAudio = async () => {
    const devices = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    console.log('Audio devices:', devices);
  };


const WEBCHUGIN_URL = "https://ccrma.stanford.edu/~tzfeng/static/webchugins/";

const chugins = [
    "ABSaturator.chug.wasm",
    "AmbPan.chug.wasm",
    "Binaural.chug.wasm",
    "Bitcrusher.chug.wasm",
    "Elliptic.chug.wasm",
    "ExpDelay.chug.wasm",
    "ExpEnv.chug.wasm",
    "FIR.chug.wasm",
    "FoldbackSaturator.chug.wasm",
    "GVerb.chug.wasm",
    "KasFilter.chug.wasm",
    "Ladspa.chug.wasm",
    "Line.chug.wasm",
    "MagicSine.chug.wasm",
    "Mesh2D.chug.wasm",
    "Multicomb.chug.wasm",
    "NHHall.chug.wasm",
    "Overdrive.chug.wasm",
    "PanN.chug.wasm",
    "Patch.chug.wasm",
    "Perlin.chug.wasm",
    "PitchTrack.chug.wasm",
    "PowerADSR.chug.wasm",
    "Random.chug.wasm",
    "Range.chug.wasm",
    "RegEx.chug.wasm",
    "Sigmund.chug.wasm",
    "Spectacle.chug.wasm",
    "WPDiodeLadder.chug.wasm",
    "WPKorg35.chug.wasm",
    "Wavetable.chug.wasm",
    "WinFuncEnv.chug.wasm",
    "XML.chug.wasm",
];

/**
 * Create paths to webchugins for loading into WebChucK
 * TODO: implement some kind of caching
 * @returns {string[]} array of chugin paths
 */
export function loadWebChugins(): string[] {
    return chugins.map((chuginName) => {
        return WEBCHUGIN_URL + chuginName;
    });
}

// Temporary stub to start ChucK intro; replace with real WebChucK integration later
// export function tryStartChucKIntro(bpm?: number) {
//   console.log('tryStartChucKIntro invoked', { bpm });
// }
export function makeLetterOverlay(scene: BABYLON.Scene, text: string, color: string) {
  const size = 256;
  const letterDT = new BABYLON.DynamicTexture(`letter-${text}-${color}-${Date.now()}`, { width: size, height: size }, scene, false);
  const lctx = letterDT.getContext();
  lctx.clearRect(0,0,size,size);
  lctx.font = 'bold 140px sans-serif';
  (lctx as CanvasRenderingContext2D).textAlign = 'center';
  (lctx as CanvasRenderingContext2D).textBaseline = 'middle';
  lctx.fillStyle = color;
  lctx.fillText(text, size/2, size/2);
  letterDT.hasAlpha = true;
  letterDT.update();
  return letterDT;
}