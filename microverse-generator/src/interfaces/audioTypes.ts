import { Chuck } from "webchuck";

// INPUTs ***********************************
// ******************************************

export type KeyboardProps = {
    selectRef: any; // what is this???
    tune: any;
    currentMicroTonalScale: any;
    chuckHook: Chuck | undefined;
    updateStkKnobs: any;
    stkValues: any;
    setStkValues: any;
    handleChange: (msg: any) => void;
    handleCheckedFXToShow: (msg: any) => void;
    checkedEffectsListHook: any[];
    handleMingusKeyboardData: (x: any) => void,
    handleMingusChordsData: (x: any) => void,
}

// AUTOMATION *******************************
// ******************************************

export type RampEffects = {
    effectName: string;
    value: number[];
    times: number[];
} 

export type AutomationParams = {
    fadeInVolume: number;
    fadeOutVolume: number;
    fadeInType: string[];
    fadeOutType: string[];
    rampEffects: RampEffects[];
}

// PATTERNS ******************************
// ***************************************

export type PatternCell = {
    notes: string[] | number[];
    duration: number;
    volume: number;
    effects: string[];
    files?: File[];
    automationParams: AutomationParams[];
    subpattern: PatternCell[];
}

export type Pattern = {
    time: {
        bpm: number;
        numerator: number;
        denominator: number;
        sequencerRate: number;
        listenToMidiClock: boolean;
    },
    patternArr: PatternCell[]; 
    patternArrName: string;
    scaleIntervalName?: string;
    microtoneIntervalName?: string; 
    intervalArr?: string[];
    microtoneArr?: string[]; 
}

// INSTRUMENTS ****************************
// ****************************************

export type InstrumentNameVal = {
    name: string; 
    value: any;
    type: string;
    effectsString: string;
    effectsHelper: any;

}

export type STKInstruments = {
    Clarinet: EffectsSettings;
    StifKarp: EffectsSettings;
    Sitar: EffectsSettings;
    FrencHrn: EffectsSettings;
    Moog: EffectsSettings;
    Rhodey: EffectsSettings;
    Saxofony: EffectsSettings;
    Mandolin: EffectsSettings;
    BandedWg: EffectsSettings;
    BlowBtl: EffectsSettings;
    BlowHole: EffectsSettings;
    Bowed: EffectsSettings;
    Brass: EffectsSettings;
    Flute: EffectsSettings;
    ModalBar: EffectsSettings;
    Shakers: EffectsSettings;
    VoicForm: EffectsSettings;
    B3: EffectsSettings;
    HevyMetl:EffectsSettings;
    HonkeyTonk:EffectsSettings;
    FMVoices:EffectsSettings;
    KrstlChr:EffectsSettings;
    PercFlut:EffectsSettings;
    TubeBell:EffectsSettings;
    Wurley:EffectsSettings;
}


// SOURCES *********************************
// *****************************************

export type Source = {
    masterVolume: number;
    masterPan: number;
    detune: number;
    effects: Effects;
    effectsString: string;
    pattern: Pattern[];
    arpeggiateOn: boolean;
    instruments?: STKInstruments;
    files?: File[];
    active: boolean;
    isEditing: boolean;
    isMuted: boolean;
    isSolo: boolean;
    // samplerRate: number;
}


export type Sources = {
    osc1: Source;
    // osc2: Source;
    stk1: Source;
    sampler: Source;
    audioin: Source;
}

// EFFECTS ***********************************
// *******************************************

export type Preset = {
    fxType?: string; 
    group?: number | string;
    label: string;
    max: number; 
    min: number;
    name: string;
    screenInterface: string;
    type?: string;
    value: number;
}

export type EffectsSettings = {
    VarName: string;
    On: boolean;
    Declaration: string | any;
    presets: Preset[];
    Type: string;
    Visible: boolean;
    Code?: string | any;
    EnvSetting?: number | string;
    blackholeString?: string;
    windowFunctionString?: string;
    ConnectionIn?: string[];
    ConnectionOut?: string[];
    Instrument?: string;
    finalHelper?: string;
    src?: string;
}

export type Effects = {
    WinFuncEnv: EffectsSettings;
    // WinFunc: EffectsSettings;
    ExpEnv: EffectsSettings;
    WPDiodeLadder: EffectsSettings;
    WPKorg35: EffectsSettings;
    Modulate: EffectsSettings;
    Delay: EffectsSettings;
    DelayA: EffectsSettings;
    DelayL: EffectsSettings;
    ExpDelay: EffectsSettings;
    Elliptic: EffectsSettings;
    Spectacle: EffectsSettings;
    Gain: EffectsSettings;
    Bitcrusher: EffectsSettings;
    FoldbackSaturator: EffectsSettings;
    Echo: EffectsSettings;
    Chorus: EffectsSettings;
    PitShift: EffectsSettings;
    AmbPan3: EffectsSettings;
    JCRev: EffectsSettings;
    NRev: EffectsSettings;
    PRCRev: EffectsSettings;
    GVerb: EffectsSettings;
    // ADSR: EffectsSettings;
    PowerADSR: EffectsSettings;
    KasFilter: EffectsSettings;
    Multicomb: EffectsSettings;
    PitchTrack: EffectsSettings;
    Sigmund: EffectsSettings;
    SndBuf: EffectsSettings;
    LiSa: EffectsSettings;
}


// ANALYSIS *********************************
// ******************************************

export type TimeDomainNode = {
    time: number;
    value: number;
}

export type ChaiFeatures = {
    RMS: TimeDomainNode;
    ZCR: TimeDomainNode;
    Energy: TimeDomainNode;
    Chroma: number[];
    MFCC: number[];
    AmplitudeSpectrum: number;
    PowerSpectrum: number;
    SpectralCentroid: number;
    SpectralFlatness: number;
    SpectralFlux: number;
    SpectralScope: number;
    SpectralRollOff: number;
    SpectralSpread: number;
    SpectralSkewness: number;
    SpectralCrest: number;
}