// public/workers/meydaStreamWorker.js
// Worker that extracts Meyda features off the main thread.
// This worker tries to use an available Meyda global; if not present,
// it falls back to loading Meyda from a CDN via importScripts.

let MeydaLib = null;
let initialized = false;
let config = {
  sampleRate: 44100,
  hopSize: 1024,
  features: ["rms", "zcr", "spectralCentroid", "loudness"]
};

// Strictly cap at 60 FPS: 1000ms / 60fps = 16.67ms per frame
const MIN_POST_MS = 1000 / 60; // ~16.67ms for exactly 60 FPS
let _lastPost = 0;

const ensureMeyda = () => {
  if (MeydaLib) return true;
  try {
    // If Meyda is already available in the worker scope (e.g., when bundled), use it
    if (typeof Meyda !== 'undefined' && Meyda) {
      MeydaLib = Meyda;
      return true;
    }
  } catch (e) {}
  // Attempt local vendor first (recommended to avoid CDN/CSP/network issues)
  try {
    importScripts('/vendor/meyda.min.js');
    if (typeof Meyda !== 'undefined' && Meyda) {
      MeydaLib = Meyda;
      return true;
    }
  } catch (e) {
    // local vendor not available or failed; try CDN next
    try {
      importScripts('https://unpkg.com/meyda@6.0.0/dist/web/meyda.min.js');
      if (typeof Meyda !== 'undefined' && Meyda) {
        MeydaLib = Meyda;
        return true;
      }
    } catch (err) {
      // both import attempts failed
    }
  }

  return false;
};

self.onmessage = (e) => {
  const data = e.data;
  if (!data) return;

  if (data.type === 'init') {
    config = { ...config, ...data };
    // Try to ensure Meyda is available now
    const ok = ensureMeyda();
    initialized = ok;
    const meydaVersion = ok && MeydaLib ? (MeydaLib.version || MeydaLib.VERSION || null) : null;
    self.postMessage({ type: ok ? 'ready' : 'error', error: ok ? null : 'Meyda not available in worker', version: meydaVersion });
    return;
  }

  if (data.type === 'audio') {
    const f32 = data.f32;
    if (!(f32 && f32.length)) return;

    // Ensure Meyda library is present; if not, attempt to load it lazily
    if (!initialized && !ensureMeyda()) {
      // If Meyda cannot be loaded, notify once and bail
      self.postMessage({ type: 'error', error: 'Meyda unavailable in worker; falling back to main thread' });
      initialized = false;
      return;
    }

    try {
      const now = performance.now();
      // Compute features
      const feats = MeydaLib.extract(config.features, f32, {
        bufferSize: f32.length,
        sampleRate: config.sampleRate
      });

      // Throttle posting features to main thread to avoid excessive messaging
      if (now - _lastPost >= MIN_POST_MS) {
        _lastPost = now;
        self.postMessage({ type: 'features', ts: data.ts || now, features: feats });
      }
    } catch (err) {
      self.postMessage({ type: 'error', error: String(err) });
    }
  }
};