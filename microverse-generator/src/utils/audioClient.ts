'use client';

import { DeferredPromise } from "webchuck";

export interface Filename {
    serverFilename: string;
    virtualFilename: string;
}
export interface File {
    filename: string;
    data?: ArrayBuffer;
}

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
    // Note: XML chugin is skipped to avoid optional network fetch and
    // increasing deployed asset size for small/free hosting tiers.
    // "XML.chug.wasm",
];

export function loadWebChugins(): string[] {
  // Loading the full set of remote webchugins can cause long blocking
  // fetches during `Chuck.init()` (the webchuck runtime preloads the
  // registered chugins). Default to NOT loading remote webchugins to
  // avoid network timeouts and long startup stalls in development and
  // small/free hosting environments.
  //
  // Opt-in controls:
  // - Set `NEXT_PUBLIC_LOAD_WEBCHUGINS=1` in your env to enable on build
  // - Or set `window.__LOAD_WEBCHUGINS = true` at runtime for local testing
  const enabled = (typeof window !== 'undefined' && (window as any).__LOAD_WEBCHUGINS) ||
    process.env.NEXT_PUBLIC_LOAD_WEBCHUGINS === '1';

  if (!enabled) {
    // Return empty list to avoid calling `Chuck.loadChugin()` by default.
    return [];
  }

  return chugins.map((chuginName) => {
    return WEBCHUGIN_URL + chuginName;
  });
}

let displayDigits: number = 0; // e.g. 5 in 44100
/**
 * Calculate the number of digits to display for a sample rate
 * @param sampleRate The sample rate
 */
export function calculateDisplayDigits(sampleRate: number) {
    displayDigits = (Math.log(sampleRate) * Math.LOG10E + 1) | 0;
}


let __ChuckCtor: typeof import('webchuck').Chuck | null = null;
let __ChuckInstance: any | null = null;

// Load the Chuck constructor dynamically (client-only)
async function getChuckCtor(): Promise<typeof import('webchuck').Chuck> {
  if (__ChuckCtor) return __ChuckCtor;
  const mod = await import('webchuck') as typeof import('webchuck');
  if (!mod.Chuck) throw new Error('[webchuck] Chuck export not found');
  __ChuckCtor = mod.Chuck;
  return __ChuckCtor;
}

// Resume or create a browser AudioContext, safely
export async function resumeAudioContext(): Promise<AudioContext | undefined> {
  if (typeof window === 'undefined') return;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return;
  (window as any).__appAudioCtx ??= new AudioCtx();
  const ctx: AudioContext = (window as any).__appAudioCtx;
  if (ctx.state === 'suspended') {
    try { await ctx.resume(); } catch {}
  }
  return ctx;
}

/**
 * Create a Chuck instance using the factory expected by your webchuck version.
 * Most builds use Chuck.init(audioContext, options?) → Promise<Chuck>.
 * Some older builds expose Chuck.create(audioContext, options?).
 */
export async function createChuckInstance(options?: any) {
  const Chuck = await getChuckCtor();
  const ctx = await resumeAudioContext();
  if (!ctx) throw new Error('No AudioContext available');

  // Prefer init(); fallback to create()
  if (typeof (Chuck as any).init === 'function') {
    return await (Chuck as any).init(ctx, options);
  }
  if (typeof (Chuck as any).create === 'function') {
    return await (Chuck as any).create(ctx, options);
  }
  // If you reach here, your version likely doesn’t allow direct construction
  // and requires one of the factory methods above.
  throw new Error('webchuck: constructor is private; use Chuck.init(ctx, options) or Chuck.create(ctx, options).');
}

/**
 * Optional: singleton getter if you only want one instance app-wide.
 */
export async function getChuckInstance(options?: any) {
  if (__ChuckInstance) return __ChuckInstance;
  __ChuckInstance = await createChuckInstance(options);
  return __ChuckInstance;
}

/**
 * Back-compat helper: if you previously used tryGetAudio to obtain Chuck,
 * return the constructor (not an instance) so existing call sites can adapt.
 */
export async function tryGetChuckAudio() {
  return await getChuckCtor();
}

function readAsync(
url: string,
onload: (buffer: ArrayBuffer) => void,
onerror: () => void
): void {
const xhr = new XMLHttpRequest();
xhr.open("GET", url, true);
xhr.responseType = "arraybuffer";
xhr.onload = () => {
    if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) {
    onload(xhr.response);
    } else {
    onerror();
    }
};
xhr.onerror = onerror;
xhr.send(null);
}
  

export function asyncLoadFile(
url: string,
onload: (buffer: ArrayBuffer) => void,
onerror: () => void
): void {
readAsync(
    url,
    (arrayBuffer: ArrayBuffer) => {
    // TODO: do we need Uint8Array here?
    onload(arrayBuffer);
    },
    () => {
    if (onerror) {
        onerror();
    } else {
        throw new Error(`Loading data file ${url} failed.`);
    }
    }
);
}

export async function preloadFiles(
filenamesToPreload: Filename[]
): Promise<File[]> {
console.log("is this a thing??? ", filenamesToPreload); 
const promises = filenamesToPreload.map(
    (filenameToPreload) =>
    new Promise<File>((resolve, _reject) => {
        asyncLoadFile(
        filenameToPreload.serverFilename,
        (byteArray) => {
            resolve({
            filename: filenameToPreload.virtualFilename,
            data: byteArray,
            });
        },
        () => {
            console.error(
            `Error fetching file: ${filenameToPreload.serverFilename}`
            );
        }
        );
    })
);
return await Promise.all(promises);
}

export async function loadWasm(): Promise<ArrayBuffer> {
return await new Promise((resolve, reject) => {
    asyncLoadFile(
    // "https://chuck.stanford.edu/webchuck/src/webchuck.wasm",
    `../../src/webchuck.wasm`,
    resolve,
    reject
    );
});
}

export const defer = () => new DeferredPromise();