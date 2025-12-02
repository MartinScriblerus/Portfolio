let prevSpectrum = null;
const fluxHist = [];
const onsetTimes = [];
const MAX_FRAMES = 1024;

function median(arr) {
  const a = arr.slice().sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}
function mad(arr, m) {
  return median(arr.map(v => Math.abs(v - m)));
}
function spectralFlux(prev, curr) {
  if (!prev || !curr || prev.length !== curr.length) return 0;
  let s = 0;
  for (let i = 0; i < curr.length; i++) {
    const d = curr[i] - prev[i];
    if (d > 0) s += d;
  }
  return s / curr.length;
}
function estimateBpmFromOnsets(times) {
  if (times.length < 5) return null;
  const intervals = [];
  for (let i = 1; i < times.length; i++) intervals.push(times[i] - times[i - 1]);
  const med = median(intervals);
  if (!med || !isFinite(med)) return null;
  let bpm = 60000 / med;
  if (bpm < 60 && bpm * 2 <= 240) bpm *= 2;
  if (bpm > 200 && bpm / 2 >= 60) bpm /= 2;
  return Math.round(bpm);
}

self.onmessage = (event) => {
  const { audioData, sampleRate, features } = event.data || {};
  if (!audioData && !features) return;

  let f = features || {};

  const rms = Number(f?.rms) || 0;
  const centroid = Number(f?.spectralCentroid) || undefined;
  const spectrum = Array.isArray(f?.amplitudeSpectrum) ? f.amplitudeSpectrum : null;

  // Compute spectral flux if we have spectra
  const flux = spectrum ? spectralFlux(prevSpectrum, spectrum) : 0;
  if (spectrum) prevSpectrum = spectrum;

  // Track flux history for adaptive threshold onset
  fluxHist.push(flux);
  if (fluxHist.length > MAX_FRAMES) fluxHist.shift();

  let onset = false;
  const WINDOW = 64;
  const recent = fluxHist.slice(-WINDOW);
  if (recent.length >= 16) {
    const m = median(recent);
    const spread = mad(recent, m) || 1e-6;
    const thresh = m + spread * 2.5; // tweak for sensitivity
    const latest = recent[recent.length - 1];
    if (latest > thresh) {
      const prev = recent[recent.length - 2];
      if (prev != null && latest > prev) {
        // Debounce very rapid repeats
        const nowMs = performance.now();
        const last = onsetTimes.length ? onsetTimes[onsetTimes.length - 1] : -Infinity;
        if (nowMs - last > 80) {
          onset = true;
          onsetTimes.push(nowMs);
          if (onsetTimes.length > 256) onsetTimes.shift();
        }
      }
    }
  }

  // BPM from IOIs occasionally
  let bpm = null;
  if (onsetTimes.length >= 6) {
    const span = onsetTimes[onsetTimes.length - 1] - onsetTimes[0];
    if (span > 2000) bpm = estimateBpmFromOnsets(onsetTimes);
  }

  self.postMessage({
    amp: rms,
    centroid,
    onset,
    bpm,
    flux,
    t: performance.now()
  });
};