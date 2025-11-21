// public/workers/meydaStreamWorker.js
import Meyda from "meyda";

let config = {
  sampleRate: 44100,
  hopSize: 1024,
  features: ["rms", "zcr", "spectralCentroid", "loudness"]
};

self.onmessage = (e) => {
  const data = e.data;
  if (data?.type === 'init') {
    config = { ...config, ...data };
    return;
  }
  if (data?.type === 'audio') {
    const f32 = data.f32;
    if (!(f32 && f32.length)) return;
    try {
      const feats = Meyda.extract(config.features, f32, {
        bufferSize: f32.length,
        sampleRate: config.sampleRate
      });
      self.postMessage({ type: 'features', ts: data.ts || performance.now(), features: feats });
    } catch (err) {
      self.postMessage({ type: 'error', error: String(err) });
    }
  }
};