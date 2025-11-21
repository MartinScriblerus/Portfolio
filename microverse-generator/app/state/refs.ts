import type { Chuck } from 'webchuck';
import { Sources, EffectsSettings } from '../../src/interfaces/audioTypes';
// /src/interfaces/audioTypes';
import type WaveSurfer from 'wavesurfer.js';
// import { FFmpeg } from '@ffmpeg/ffmpeg';
import MoogGrandmotherEffects from '../../src/interfaces/audioInterfaces';
import moogGMPresets from '../../src/utils/moogGMPresets';
import { FXOption, STKOption } from '../../src/utils/fixedOptionsDropdownData';
import {
  delayADefault,
  delayDefault,
  delayLDefault,
  ellipticDefault,
  expDelayDefault,
  expEnvDefault,
  korg35Default,
  modulateDefault,
  powerADSRDefault,
  spectacleDefault,
  winFuncEnvDefault,
  wpDiodeDefault
} from '../../src/utils/helperDefaults';

export const workerRef: { current: Worker | null } = { current: null };

export const chuckRef = { current: null as Chuck | null };
export const currNotes = { current: [0] as any };
export const currNotesHash = { current: {} as any };
export const universalSources = { current: undefined as Sources | undefined };
export const currentFX = { current: undefined as any };
export const filesToProcess = {current: [
  { filename: "DR-55Kick.wav", data: [] },
  { filename: "DR-55Snare.wav", data: []  },
  { filename: "DR-55Hat.wav", data: [] },
  { filename: "Conga.wav", data: [] }
] as any};

export const visibleFXKnobs = { current: undefined as any };
export const testArrBuffFile = { current: undefined as any };
export const currentScreen = { current: 'synth' };
export const doReturnToSynth = { current: false };
export const isInPatternEditMode = { current: false };
export const currentStkTypeVar = { current: '' };
export const currentEffectType = { current: '' };
export const masterPatternsRef = { current: {} as any };
export const parentDivRef = { current: null as any };
export const allOctaveMidiFreqs = { current: {} as any };
export const uploadedBlob = { current: undefined as any };
export const currentHeatmapXY = { current: undefined as any };
// MIDIAccess is a Web MIDI API type - define it if not available
type MIDIAccessType = {
  inputs: Map<string, MIDIInput>;
  outputs: Map<string, MIDIOutput>;
  onstatechange: ((e: MIDIConnectionEvent) => void) | null;
  sysexEnabled: boolean;
};

type MIDIInput = {
  id: string;
  manufacturer: string;
  name: string;
  state: 'connected' | 'disconnected';
  type: 'input';
  onmidimessage: ((e: MIDIMessageEvent) => void) | null;
};

type MIDIOutput = {
  id: string;
  manufacturer: string;
  name: string;
  state: 'connected' | 'disconnected';
  type: 'output';
  send: (data: Uint8Array, timestamp?: number) => void;
};

type MIDIConnectionEvent = {
  port: MIDIInput | MIDIOutput;
};

type MIDIMessageEvent = {
  data: Uint8Array;
  receivedTime: number;
};

export const midiAccess = { current: undefined as MIDIAccessType | undefined };
export const resetHeatmapCell = { current: undefined as boolean | undefined };
export const lastFileUploadMeydaData = { current: [] as any[] };
export const wavesurferRef = { current: null as WaveSurfer | null };

export const regionStart = { current: undefined as any };
export const regionEnd = { current: undefined as any };
export const totalDuration = { current: undefined as any };
export const clippedDuration = { current: undefined as any };

export const ffmpegRef = { current: null as any }; 
// export const ffmpegRef = { current: new FFmpeg() };
export const messageRef = { current: null as HTMLParagraphElement | null };

export const moogGrandmotherEffects: any = { current: moogGMPresets as MoogGrandmotherEffects };

export const fxValsRef = { current: [] as FXOption[] };
export const checkedFXList = { current: [] as FXOption[] };

export const winFuncEnvFinalHelper = { current: winFuncEnvDefault as any  };
export const powerADSRFinalHelper = { current: powerADSRDefault as any  };
export const expEnvFinalHelper = { current: expEnvDefault as any  };
export const wpDiodeLadderFinalHelper = { current: wpDiodeDefault as any  };
export const wpKorg35FinalHelper = { current: korg35Default as any  };
export const modulateFinalHelper = { current: modulateDefault as any  };
export const delayFinalHelper = { current: delayDefault as any  };
export const delayAFinalHelper = { current: delayADefault as any  };
export const delayLFinalHelper = { current: delayLDefault as any  };
export const expDelayFinalHelper = { current: expDelayDefault as any  };
export const ellipticFinalHelper = { current: ellipticDefault as any  };
export const spectacleFinalHelper = { current: spectacleDefault as any  };

export const initialNodes = { current: undefined as any };
export const initialEdges = { current: undefined as any };
export const keysAndTuneDone = { current: undefined as any };

export const inputRef = { current: undefined as any };

export const stkKnobValsRef = { current: [] as STKOption[] };
export const activeSTKDeclarations = { current: '' as string };
export const activeSTKSettings = { current: '' as string };
export const activeSTKPlayOn = { current: '' as string };
export const activeSTKPlayOff = { current: '' as string };

export const NOTES_SET_REF = { current: undefined as any };
export const initialRun = { current: true as any };

export const isSubmitting = { current: false as any };

export const masterVolumeVals = { current: 0.5 as number };

export const isBrowser = typeof window !== 'undefined';

let __ffmpegInstance: any | null = null;
let __ffmpegLoading: Promise<any> | null = null;

/**
 * Load and return a singleton FFmpeg instance (client-only).
 * Uses @ffmpeg/ffmpeg 0.12.x new FFmpeg() API and @ffmpeg/util to create blob URLs.
 * Throws if called on the server.
 */
export async function getFFmpeg() {
  if (!isBrowser) {
    throw new Error('getFFmpeg() must be called in the browser (client component/effect).');
  }
  if (__ffmpegInstance) return __ffmpegInstance;
  if (__ffmpegLoading) return __ffmpegLoading;

  __ffmpegLoading = (async () => {
    // Dynamic imports: prevents SSR from evaluating WASM bundle
    const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
      import('@ffmpeg/ffmpeg'),
      import('@ffmpeg/util'),
    ]);

    // Serve core files from /public/ffmpeg to avoid remote CDNs in dev
    const base = '/ffmpeg';
    const coreURL   = await toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript');
    const wasmURL   = await toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm');
    
    // Worker file is optional (may not exist in all versions)
    let workerURL: string | undefined;
    try {
      workerURL = await toBlobURL(`${base}/ffmpeg-core.worker.js`, 'text/javascript');
    } catch {
      // Worker file not available, continue without it
      workerURL = undefined;
    }

    const ffmpeg = new FFmpeg();
    await ffmpeg.load({ coreURL, wasmURL, ...(workerURL && { workerURL }) });

    __ffmpegInstance = ffmpeg;
    __ffmpegLoading = null;
    return ffmpeg;
  })();

  return __ffmpegLoading;
}

/**
 * Optional helper to check if an instance is already loaded (client).
 */
export function hasFFmpegLoaded() {
  return !!__ffmpegInstance;
}
