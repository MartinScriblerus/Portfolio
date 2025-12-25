#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const https = require('https');

const WEBCHUGIN_URL = 'https://ccrma.stanford.edu/~tzfeng/static/webchugins/';
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
  // Skipping XML.chug.wasm by default to avoid adding optional binary to
  // the project's public assets unless explicitly requested.
];

const outDir = path.resolve(__dirname, '..', 'public', 'webchugins');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        return reject(new Error(`Status ${res.statusCode} for ${url}`));
      }
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve(dest)));
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

(async function main(){
  console.log('Fetching webchugins to', outDir);
  for (const name of chugins) {
    const url = WEBCHUGIN_URL + name;
    const dest = path.join(outDir, name);
    try {
      console.log('Downloading', url);
      await download(url, dest);
      console.log('Saved', dest);
    } catch (err) {
      console.error('Failed to download', url, err.message || err);
    }
  }
  console.log('Done. Check', outDir);
})();
