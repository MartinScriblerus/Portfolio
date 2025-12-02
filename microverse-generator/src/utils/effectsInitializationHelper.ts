import { EffectsSettings, Sources } from '../interfaces/audioTypes';
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
} from './helperDefaults';

// Import all FX presets
import bitcrusherPresets, { stkVariableBitcrusher } from './FXPresets/bitcrusherPresets';
import delayPresets, { stkVariableDelay, stkVariableDelayA, stkVariableDelayL, stkVariableEcho } from './FXPresets/delayPresets';
import { delayAPresets, delayLPresets, echoPresets } from './FXPresets/delayPresets';
import ellipticPresets, { stkVariableElliptic } from './FXPresets/ellipticPresets';
import expDelayPresets, { stkVariableExpDelay } from './FXPresets/expDelayPresets';
import expEnvPresets, { stkVariableExpEnv } from './FXPresets/expEnvPresets';
import foldbackSaturatorPresets, { stkVariableFoldbackSaturator } from './FXPresets/foldbackSaturatorPresets';
import kasFilterPresets, { stkVariableKasFilter } from './FXPresets/kasFilterPresets';
import modulatePresets, { stkVariableModulate } from './FXPresets/modulatePresets';
import pitchShiftPresets, { stkVariablePitShift } from './FXPresets/pitchShiftPresets';
import chorusPresets, { stkVariableChorus } from './FXPresets/chorusModPitchPresets';
import pitchTrackPresets, { stkVariablePitchTrack } from './FXPresets/pitchTrackPresets';
import powerADSRPresets, { stkVariablePowerADSR } from './FXPresets/powerADSR';
import jcRevPresets, { nRevPresets, prcRevPresets, gVerbPresets, gainPresets, stkVariableJCRev, stkVariableNRev, stkVariablePRCRev, stkVariableGVerb, stkVariableGain } from './FXPresets/reverbGainPresets';
import sigmundPresets, { stkVariableSigmund } from './FXPresets/sigmundPresets';
import sndBufPresetsDefault, { lisaPresets, stkVariableSndBuf, stkVariableLisa } from './FXPresets/sndBufLisaPresets';
const sndBufPresets = sndBufPresetsDefault;
import spectaclePresets, { stkVariableSpectacle } from './FXPresets/spectaclePresets';
import winFuncEnvPresets, { stkVariableWinFuncEnv } from './FXPresets/winFuncEnv';
import wpDiodeLadderPresets, { stkVariableWPDiodeLadder } from './FXPresets/wpDiodeLadder';
import wpKorg35Presets, { stkVariableWPKorg35 } from './FXPresets/WPKorg35';
import ambPan3Presets, { stkVariableAmbPan3 } from './FXPresets/ambPanPresets';
import multicombPresets, { stkVariableMulticomb } from './FXPresets/MulticombPresets';

/**
 * Creates an EffectsSettings object from preset data
 */
function createEffectSettings(
  type: string,
  varName: string,
  presets: any,
  defaults: any,
  sourceName: keyof Sources
): EffectsSettings {
  // Safety check: ensure presets is an object
  if (!presets || typeof presets !== 'object' || Array.isArray(presets)) {
    console.warn(`⚠️ Presets for ${type} (${varName}) is invalid:`, presets);
    return {
      Type: type,
      VarName: varName,
      On: false,
      Declaration: '',
      presets: [],
      Visible: true,
    };
  }

  try {
    const presetValues = Object.values(presets);
    return {
      Type: type,
      VarName: varName,
      On: false,
      Declaration: '',
      presets: presetValues.map((preset: any) => ({
        ...preset,
        value: defaults?.[sourceName]?.[preset?.name] ?? preset?.value ?? 0
      })),
      Visible: true,
    };
  } catch (error) {
    console.error(`❌ Error creating effect settings for ${type}:`, error);
    return {
      Type: type,
      VarName: varName,
      On: false,
      Declaration: '',
      presets: [],
      Visible: true,
    };
  }
}

/**
 * Initialize universalSources with all available effects
 */
export function initializeUniversalSources(): Sources {
  const sources: Sources = {
    osc1: {
      masterVolume: 0.5,
      masterPan: 0,
      detune: 0,
      effects: {
        WinFuncEnv: createEffectSettings('WinFuncEnv', stkVariableWinFuncEnv, winFuncEnvPresets, winFuncEnvDefault, 'osc1'),
        ExpEnv: createEffectSettings('ExpEnv', stkVariableExpEnv, expEnvPresets, expEnvDefault, 'osc1'),
        WPDiodeLadder: createEffectSettings('WPDiodeLadder', stkVariableWPDiodeLadder, wpDiodeLadderPresets, wpDiodeDefault, 'osc1'),
        WPKorg35: createEffectSettings('WPKorg35', stkVariableWPKorg35, wpKorg35Presets, korg35Default, 'osc1'),
        Modulate: createEffectSettings('Modulate', stkVariableModulate, modulatePresets, modulateDefault, 'osc1'),
        Delay: createEffectSettings('Delay', stkVariableDelay, delayPresets, delayDefault, 'osc1'),
        DelayA: createEffectSettings('DelayA', stkVariableDelayA, delayAPresets, delayADefault, 'osc1'),
        DelayL: createEffectSettings('DelayL', stkVariableDelayL, delayLPresets, delayLDefault, 'osc1'),
        Echo: createEffectSettings('Echo', stkVariableEcho, echoPresets, delayDefault, 'osc1'),
        ExpDelay: createEffectSettings('ExpDelay', stkVariableExpDelay, expDelayPresets, expDelayDefault, 'osc1'),
        Elliptic: createEffectSettings('Elliptic', stkVariableElliptic, ellipticPresets, ellipticDefault, 'osc1'),
        Spectacle: createEffectSettings('Spectacle', stkVariableSpectacle, spectaclePresets, spectacleDefault, 'osc1'),
        Gain: createEffectSettings('Gain', stkVariableGain, gainPresets, {}, 'osc1'),
        Bitcrusher: createEffectSettings('Bitcrusher', stkVariableBitcrusher, bitcrusherPresets, {}, 'osc1'),
        FoldbackSaturator: createEffectSettings('FoldbackSaturator', stkVariableFoldbackSaturator, foldbackSaturatorPresets, {}, 'osc1'),
        Chorus: createEffectSettings('Chorus', stkVariableChorus, chorusPresets, {}, 'osc1'),
        PitShift: createEffectSettings('PitShift', stkVariablePitShift, pitchShiftPresets, {}, 'osc1'),
        AmbPan3: createEffectSettings('AmbPan3', stkVariableAmbPan3, ambPan3Presets, {}, 'osc1'),
        JCRev: createEffectSettings('JCRev', stkVariableJCRev, jcRevPresets, {}, 'osc1'),
        NRev: createEffectSettings('NRev', stkVariableNRev, nRevPresets, {}, 'osc1'),
        PRCRev: createEffectSettings('PRCRev', stkVariablePRCRev, prcRevPresets, {}, 'osc1'),
        GVerb: createEffectSettings('GVerb', stkVariableGVerb, gVerbPresets, {}, 'osc1'),
        PowerADSR: createEffectSettings('PowerADSR', stkVariablePowerADSR, powerADSRPresets, powerADSRDefault, 'osc1'),
        KasFilter: createEffectSettings('KasFilter', stkVariableKasFilter, kasFilterPresets, {}, 'osc1'),
        Multicomb: createEffectSettings('Multicomb', stkVariableMulticomb, multicombPresets, {}, 'osc1'),
        PitchTrack: createEffectSettings('PitchTrack', stkVariablePitchTrack, pitchTrackPresets, {}, 'osc1'),
        Sigmund: createEffectSettings('Sigmund', stkVariableSigmund, sigmundPresets, {}, 'osc1'),
        SndBuf: createEffectSettings('SndBuf', stkVariableSndBuf, sndBufPresets, {}, 'osc1'),
        LiSa: createEffectSettings('LiSa', stkVariableLisa, lisaPresets, {}, 'osc1'),
      },
      effectsString: '',
      pattern: [],
      arpeggiateOn: false,
      active: true,
      isEditing: false,
      isMuted: false,
      isSolo: false,
    },
    sampler: {
      masterVolume: 0.5,
      masterPan: 0,
      detune: 0,
      effects: {
        WinFuncEnv: createEffectSettings('WinFuncEnv', stkVariableWinFuncEnv, winFuncEnvPresets, winFuncEnvDefault, 'sampler'),
        ExpEnv: createEffectSettings('ExpEnv', stkVariableExpEnv, expEnvPresets, expEnvDefault, 'sampler'),
        WPDiodeLadder: createEffectSettings('WPDiodeLadder', stkVariableWPDiodeLadder, wpDiodeLadderPresets, wpDiodeDefault, 'sampler'),
        WPKorg35: createEffectSettings('WPKorg35', stkVariableWPKorg35, wpKorg35Presets, korg35Default, 'sampler'),
        Modulate: createEffectSettings('Modulate', stkVariableModulate, modulatePresets, modulateDefault, 'sampler'),
        Delay: createEffectSettings('Delay', stkVariableDelay, delayPresets, delayDefault, 'sampler'),
        DelayA: createEffectSettings('DelayA', stkVariableDelayA, delayAPresets, delayADefault, 'sampler'),
        DelayL: createEffectSettings('DelayL', stkVariableDelayL, delayLPresets, delayLDefault, 'sampler'),
        Echo: createEffectSettings('Echo', stkVariableEcho, echoPresets, delayDefault, 'sampler'),
        ExpDelay: createEffectSettings('ExpDelay', stkVariableExpDelay, expDelayPresets, expDelayDefault, 'sampler'),
        Elliptic: createEffectSettings('Elliptic', stkVariableElliptic, ellipticPresets, ellipticDefault, 'sampler'),
        Spectacle: createEffectSettings('Spectacle', stkVariableSpectacle, spectaclePresets, spectacleDefault, 'sampler'),
        Gain: createEffectSettings('Gain', stkVariableGain, gainPresets, {}, 'sampler'),
        Bitcrusher: createEffectSettings('Bitcrusher', stkVariableBitcrusher, bitcrusherPresets, {}, 'sampler'),
        FoldbackSaturator: createEffectSettings('FoldbackSaturator', stkVariableFoldbackSaturator, foldbackSaturatorPresets, {}, 'sampler'),
        Chorus: createEffectSettings('Chorus', stkVariableChorus, chorusPresets, {}, 'sampler'),
        PitShift: createEffectSettings('PitShift', stkVariablePitShift, pitchShiftPresets, {}, 'sampler'),
        AmbPan3: createEffectSettings('AmbPan3', stkVariableAmbPan3, ambPan3Presets, {}, 'sampler'),
        JCRev: createEffectSettings('JCRev', stkVariableJCRev, jcRevPresets, {}, 'sampler'),
        NRev: createEffectSettings('NRev', stkVariableNRev, nRevPresets, {}, 'sampler'),
        PRCRev: createEffectSettings('PRCRev', stkVariablePRCRev, prcRevPresets, {}, 'sampler'),
        GVerb: createEffectSettings('GVerb', stkVariableGVerb, gVerbPresets, {}, 'sampler'),
        PowerADSR: createEffectSettings('PowerADSR', stkVariablePowerADSR, powerADSRPresets, powerADSRDefault, 'sampler'),
        KasFilter: createEffectSettings('KasFilter', stkVariableKasFilter, kasFilterPresets, {}, 'sampler'),
        Multicomb: createEffectSettings('Multicomb', stkVariableMulticomb, multicombPresets, {}, 'sampler'),
        PitchTrack: createEffectSettings('PitchTrack', stkVariablePitchTrack, pitchTrackPresets, {}, 'sampler'),
        Sigmund: createEffectSettings('Sigmund', stkVariableSigmund, sigmundPresets, {}, 'sampler'),
        SndBuf: createEffectSettings('SndBuf', stkVariableSndBuf, sndBufPresets, {}, 'sampler'),
        LiSa: createEffectSettings('LiSa', stkVariableLisa, lisaPresets, {}, 'sampler'),
      },
      effectsString: '',
      pattern: [],
      arpeggiateOn: false,
      active: true,
      isEditing: false,
      isMuted: false,
      isSolo: false,
    },
    stk1: {
      masterVolume: 0.5,
      masterPan: 0,
      detune: 0,
      effects: {
        WinFuncEnv: createEffectSettings('WinFuncEnv', stkVariableWinFuncEnv, winFuncEnvPresets, winFuncEnvDefault, 'stk1'),
        ExpEnv: createEffectSettings('ExpEnv', stkVariableExpEnv, expEnvPresets, expEnvDefault, 'stk1'),
        WPDiodeLadder: createEffectSettings('WPDiodeLadder', stkVariableWPDiodeLadder, wpDiodeLadderPresets, wpDiodeDefault, 'stk1'),
        WPKorg35: createEffectSettings('WPKorg35', stkVariableWPKorg35, wpKorg35Presets, korg35Default, 'stk1'),
        Modulate: createEffectSettings('Modulate', stkVariableModulate, modulatePresets, modulateDefault, 'stk1'),
        Delay: createEffectSettings('Delay', stkVariableDelay, delayPresets, delayDefault, 'stk1'),
        DelayA: createEffectSettings('DelayA', stkVariableDelayA, delayAPresets, delayADefault, 'stk1'),
        DelayL: createEffectSettings('DelayL', stkVariableDelayL, delayLPresets, delayLDefault, 'stk1'),
        Echo: createEffectSettings('Echo', stkVariableEcho, echoPresets, delayDefault, 'stk1'),
        ExpDelay: createEffectSettings('ExpDelay', stkVariableExpDelay, expDelayPresets, expDelayDefault, 'stk1'),
        Elliptic: createEffectSettings('Elliptic', stkVariableElliptic, ellipticPresets, ellipticDefault, 'stk1'),
        Spectacle: createEffectSettings('Spectacle', stkVariableSpectacle, spectaclePresets, spectacleDefault, 'stk1'),
        Gain: createEffectSettings('Gain', stkVariableGain, gainPresets, {}, 'stk1'),
        Bitcrusher: createEffectSettings('Bitcrusher', stkVariableBitcrusher, bitcrusherPresets, {}, 'stk1'),
        FoldbackSaturator: createEffectSettings('FoldbackSaturator', stkVariableFoldbackSaturator, foldbackSaturatorPresets, {}, 'stk1'),
        Chorus: createEffectSettings('Chorus', stkVariableChorus, chorusPresets, {}, 'stk1'),
        PitShift: createEffectSettings('PitShift', stkVariablePitShift, pitchShiftPresets, {}, 'stk1'),
        AmbPan3: createEffectSettings('AmbPan3', stkVariableAmbPan3, ambPan3Presets, {}, 'stk1'),
        JCRev: createEffectSettings('JCRev', stkVariableJCRev, jcRevPresets, {}, 'stk1'),
        NRev: createEffectSettings('NRev', stkVariableNRev, nRevPresets, {}, 'stk1'),
        PRCRev: createEffectSettings('PRCRev', stkVariablePRCRev, prcRevPresets, {}, 'stk1'),
        GVerb: createEffectSettings('GVerb', stkVariableGVerb, gVerbPresets, {}, 'stk1'),
        PowerADSR: createEffectSettings('PowerADSR', stkVariablePowerADSR, powerADSRPresets, powerADSRDefault, 'stk1'),
        KasFilter: createEffectSettings('KasFilter', stkVariableKasFilter, kasFilterPresets, {}, 'stk1'),
        Multicomb: createEffectSettings('Multicomb', stkVariableMulticomb, multicombPresets, {}, 'stk1'),
        PitchTrack: createEffectSettings('PitchTrack', stkVariablePitchTrack, pitchTrackPresets, {}, 'stk1'),
        Sigmund: createEffectSettings('Sigmund', stkVariableSigmund, sigmundPresets, {}, 'stk1'),
        SndBuf: createEffectSettings('SndBuf', stkVariableSndBuf, sndBufPresets, {}, 'stk1'),
        LiSa: createEffectSettings('LiSa', stkVariableLisa, lisaPresets, {}, 'stk1'),
      },
      effectsString: '',
      pattern: [],
      arpeggiateOn: false,
      active: true,
      isEditing: false,
      isMuted: false,
      isSolo: false,
    },
    audioin: {
      masterVolume: 0.5,
      masterPan: 0,
      detune: 0,
      effects: {},
      effectsString: '',
      pattern: [],
      arpeggiateOn: false,
      active: true,
      isEditing: false,
      isMuted: false,
      isSolo: false,
    },
  };

  return sources;
}

