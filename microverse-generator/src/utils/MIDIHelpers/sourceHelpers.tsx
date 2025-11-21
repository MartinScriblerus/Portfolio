import { Sources } from "@/types/audioTypes";

export const winFuncString = (source: string, attackDenom: number, releaseDenom: number, envSetting: string) => `winfuncenv_${source}.set${envSetting}(); for (int i; i < 250; i++) { spork ~ playWindow(winfuncenv_${source}, whole/${attackDenom}, whole/${releaseDenom}); }`;

export const powerADSRString = (source: string, attackTime: number, attackCurve: number, decayTime: number, decayCurve: number, sustainLevel: number, releaseTime: number, releaseCurve: number) => `

fun void playPowerADSRWindow(PowerADSR @ win, dur attackTime, float attackCurve, dur decayTime, float decayCurve, float sustainLevel, dur releaseTime, float releaseCurve) {
    win.set(attackTime, decayTime, sustainLevel, releaseTime);
    win.setCurves(attackCurve, decayCurve, releaseCurve);
  
    while (true) {
        win.keyOn();
        attackTime => now;
        win.keyOff();
        releaseTime => now;
    }
}
spork ~ playPowerADSRWindow(poweradsr_${source}, ${attackTime}::ms, ${attackCurve}, ${decayTime}::ms, ${decayCurve}, ${sustainLevel}, ${releaseTime}::ms, ${releaseCurve});

`;

export const expEnvString = (source: string, T60: number, radius: number, value: number) => `

    fun void playExpEnvWindow(ExpEnv @ win, dur T60, float radius, dur value) {
        radius => win.radius;    
        T60 => win.T60; 
        1 => win.keyOn; 
        
        value => now;
        while (true)  {
            1.0 => win.gain;
            1 => win.keyOn;
            value => now;
            0 => win.keyOn;
        }
    }
    spork ~ playExpEnvWindow(expenv_${source}, whole/${Math.pow(2, T60)}, ${radius}, whole/${Math.pow(2, value)});
`;

export const wpDiodeLadderString = (source: string, cutoff: number, resonance: number, nlp_type: number, nonlinear: number, saturation: number) => {
    // const nlp_str = nlp_type === 1 ? 'true' : 'false';
    const nlp_str = nlp_type;
    console.log("<><><><> ", nlp_str)
    const nonlinear_str = nonlinear === 1 ? 'true' : 'false';
    return `
    fun void playWpDiodeLadderWindow(WPDiodeLadder @ win, float cutoff, int resonance, int nlp_type, int nonlinear, float saturation) {
        saw2 => blackhole;
        SinOsc sinb => blackhole;
  
        0.04 => saw2.gain;
        40 => saw2.freq;
        cutoff => sinb.freq;
        // 0.0125 => sinb.freq;
        resonance => win.resonance;
        nonlinear => win.nonlinear;
        nlp_type => win.nlp_type;
        saturation => win.saturation;
        
        0.15 => win.gain;

        while(true){
           
            4 * sinb.last() => saw2.freq;
            40 + (Math.pow((sinb.last())/2.0,2) * (resonance * 1000)) => win.cutoff;
            1::samp => now;
        }
    }

    spork ~ playWpDiodeLadderWindow(wpdiodeladder_${source}, ${cutoff}, ${resonance}, ${nlp_str}, ${nonlinear_str}, ${saturation});
`};

export const wpKorg35String = (source: string, cutoff: number, resonance: number, nonlinear: number, saturation: number) => {
    const nonlinear_str = nonlinear === 1 ? 'true' : 'false';

    return `
    fun void playWpKorg35Window(WPKorg35 @ win, float cutoff, int resonance, int nonlinear, float saturation) {
        SawOsc saw2 => blackhole;
        SinOsc sinb => blackhole;
  
        0.004 => saw2.gain;
        40 => saw2.freq;
        cutoff => sinb.freq;
        // 0.0125 => sinb.freq;
        resonance => win.resonance;
        nonlinear => win.nonlinear;
        saturation => win.saturation;
        
        0.2 => win.gain;

        while(true){
            4 * sinb.last() => saw2.freq;
            40 + (Math.pow((sinb.last())/2.0,2) * (resonance * 1000)) => win.cutoff;
            1::samp => now;
        }
    }

    spork ~ playWpKorg35Window(wpkorg35_${source}, ${cutoff}, ${resonance}, ${nonlinear_str}, ${saturation});
    `
};

export const modulateString = (source: string, vibratoRate: number, vibratoGain: number, randomGain: number, currentNoteVals: any) => {

    return `

    fun void playModWindow(Modulate @ win, float vibratoRate, float vibratoGain, float randomGain) {

        // set rate in hz
        vibratoRate => win.vibratoRate;
        vibratoGain => win.vibratoGain;
        randomGain => win.randomGain;

        whole/${currentNoteVals.master[0]} - (now % whole/${currentNoteVals.master[0]}) => now;
  
    }
    spork ~ playModWindow(mod_${source}, ${vibratoRate}, ${vibratoGain}, ${randomGain});
    `;
};

export const ellipticString = (source: string, filterLow: number, filterMid: number, filterHigh: number, atten: number, ripple: number, filterMode: number, currentNoteVals: any) => {
    console.log('get elliptic vals: ', source, filterLow, filterMid, filterHigh, ripple, atten, filterMode);
    return `
    fun void playEllipticWindow(Elliptic @ win, dur beat, float lower, float middle, float upper, float atten, float ripple, int filterMode) {
        
        atten => win.atten;
        ripple => win.ripple;

        if (filterMode == 0) {
            win.bpf(upper,middle,lower);
        } else if (filterMode == 1) {
            win.lpf(lower, upper);
        } else if (filterMode == 2) {
            win.hpf(upper, lower);
        }
        whole/${currentNoteVals.master[0]} - (now % whole/${currentNoteVals.master[0]}) => now;
    }
    spork ~ playEllipticWindow(elliptic_${source}, beat, ${filterLow}, ${filterMid}, ${filterHigh}, ${atten}, ${ripple}, ${filterMode});
    `;
}

export const delayString = (source: string, delay: number, lines: number, syncDelay: number, zero: number, b0: number, b1: number, currentNoteVals: any) => {
    const convertedSyncDelay = Math.pow(2, syncDelay);
    return `
    fun void playDelayWindow(Delay @ win[], float delay, int lines, float syncDelay, float zero, float b0, float b1) {
        for (0 => int i; i < ${lines}; i++) 
        { 
            win[i] => OneZero filter_delay_${source} => win[i]; 
            zero => filter_delay_${source}.zero;
            b0 => filter_delay_${source}.b0;
            b1 => filter_delay_${source}.b1;
            0.2 => win[i].gain; 
            // (((1 + i*0.3) * 1000)) :: ms => win[i].max => win[i].delay;
            ((whole)/((syncDelay/${currentNoteVals.master[0]}) * (1/(1 + i*0.7)))) => win[i].max => win[i].delay;
            me.yield();
        }
        me.exit();
    }
    spork ~ playDelayWindow(delay_${source}, ${delay}, ${lines}, ${convertedSyncDelay}, ${zero}, ${b0}, ${b1});
    `;
};

export const delayAString = (source: string, delay: number, lines: number, syncDelay: number, zero: number, b0: number, b1: number, currentNoteVals: any) => {
    const convertedSyncDelay = Math.pow(2, syncDelay);
    return `
    fun void playDelayAWindow(DelayA @ win[], float delay, int lines, float syncDelay, float zero, float b0, float b1) {
        for (0 => int i; i < ${lines}; i++) 
        { 
            win[i] => OneZero filter_delayA_${source} => win[i]; 
            zero => filter_delayA_${source}.zero;
            b0 => filter_delayA_${source}.b0;
            b1 => filter_delayA_${source}.b1;
            0.6 => win[i].gain; 
            (whole/${currentNoteVals.master[0]})/((syncDelay) * (1 + i*0.3)) => win[i].max => win[i].delay;
            me.yield();
        }
        me.exit();
    }
    spork ~ playDelayAWindow(delayA_${source}, ${delay}, ${lines}, ${convertedSyncDelay}, ${zero}, ${b0}, ${b1});
    `;
};

export const delayLString = (source: string, delay: number, lines: number, syncDelay: number, zero: number, b0: number, b1: number, currentNoteVals: any) => {
    const convertedSyncDelay = Math.pow(2, syncDelay);
    console.log("sanity check delayL source: ", source);
    return `
    fun void playDelayLWindow(DelayL @ win[], float delay, int lines, float syncDelay, float zero, float b0, float b1) {
        // while (true) {
                for (0 => int i; i < ${lines}; i++) 
                { 

                    win[i] => OneZero filter_delayL_${source} => win[i];
                    zero => filter_delayL_${source}.zero;
                    b0 => filter_delayL_${source}.b0;
                    b1 => filter_delayL_${source}.b1;
                    0.6 => win[i].gain; 
                    whole /((syncDelay) * (1/(1 + i*0.7))) => win[i].max => win[i].delay;

                    // me.yield();
                }

            me.exit();
    }
    spork ~ playDelayLWindow(delayL_${source}, ${delay}, ${lines}, ${convertedSyncDelay}, ${zero}, ${b0}, ${b1});
    `;
};

export const expDelayString = (source: string, ampcurve: number, durcurve: number, delay: number, mix: number, reps: number, gain: number, currentNoteVals: any) => {
    const convertedSyncDelay = Math.pow(2, delay);

    return `
    fun void playExpDelayWindow(ExpDelay @ win, float ampcurve, float durcurve, float delay, float mix, int reps, float gain) {

        while (true)
        {
           (whole/(${currentNoteVals.master[0]}))/delay => win.max => win.delay;

            reps * 0.7 => win.gain;
            durcurve => win.durcurve;
            ampcurve => win.ampcurve;
            reps => win.reps;
            
            (whole/(${currentNoteVals.master[0]}))/delay => now;
            // me.yield();
        }
        me.exit();
    }
    spork ~ playExpDelayWindow(expDelay_${source}, ${ampcurve}, ${durcurve}, ${convertedSyncDelay}, ${mix}, ${reps}, ${gain});
    `;
};

export const spectacleString = (source: string, bands: number, delay: number, eq: number, feedback: number, fftlen: number, freqMax: number, freqMin: number, mix: number, overlap: number, table: number) => {
    const convertedFFT = Math.pow(2, fftlen);
    const convertedBands = Math.pow(2, bands);
    const convertedDelay = Math.pow(2, bands);
    return `
    fun void playSpectacleWindow(Spectacle @ win, int bands, float delay, float eq, float feedback, int fft, float freqMax, float freqMin, float mix, int overlap, int table) {
        
        0.8 => win.mix;
        win.range(freqMin,freqMax);
        bands => win.bands; 

        1.3 => win.gain;

        if (table == 0) {
            win.table("delay", "descending");
        } else if (table == 1) {
            win.table("eq", "descending");
        } else if (table == 2) {
            win.table("feedback", "descending");
        } else if (table == 3) {
            win.table("delay", "random");
        } else if (table == 4) {
            win.table("eq", "random");
        } else if (table == 5) {
            win.table("feedback", "random");
        } else if (table == 6) {
            win.table("delay", "ascending");
        } else if (table == 7) {
            win.table("eq", "ascending");
        } else if (table == 8) {
            win.table("feedback", "ascending");
        }

        whole * delay => now;
        eq => win.eq;
        feedback => win.feedback;
    }
    spork ~ playSpectacleWindow(spectacle_${source}, ${convertedBands}, ${convertedDelay}, ${eq}, ${feedback}, ${convertedFFT}, ${freqMax}, ${freqMin}, ${mix}, ${overlap}, ${table});
    `;

};

export const defaultSources: Sources = {
    osc1: {
        masterVolume: 50,
        masterPan: 0,
        detune: 0,
        effects: {
            WinFuncEnv: {
                VarName: '',
                On: false,
                Declaration: ' WinFuncEnv winfuncenv_osc1 =>',
                presets: [],
                Type: '',
                Visible: false,
                Code: (helper: any) => winFuncString('osc1', helper.osc1.attackTime, helper.osc1.releaseTime, helper.osc1.envSetting),
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            PowerADSR: {
                VarName: '',
                On: false,
                Declaration: ' PowerADSR poweradsr_osc1 =>',
                presets: [],
                Type: '',
                Visible: false,
                Code: (helper: any) => powerADSRString('osc1', helper.osc1.attackTime, helper.osc1.attackCurve, helper.osc1.decayTime, helper.osc1.decayCurve, helper.osc1.sustainLevel, helper.osc1.releaseTime, helper.osc1.releaseCurve),
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            ExpEnv: {
                VarName: '',
                On: false,
                Declaration: ' ExpEnv expenv_osc1 =>',
                presets: [],
                Type: '',
                Visible: false,
                Code: (helper: any) => expEnvString('osc1', helper.osc1.T60, helper.osc1.radius, helper.osc1.value),
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            WPDiodeLadder: {
                VarName: '',
                On: false,
                Declaration: ' WPDiodeLadder wpdiodeladder_osc1 =>',
                presets: [],
                Type: '',
                Visible: false,
                Code: (helper: any) => wpDiodeLadderString('osc1', helper.osc1.cutoff, helper.osc1.resonance, helper.osc1.nlp_type, helper.osc1.nonlinear, helper.osc1.saturation),
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            WPKorg35: {
                VarName: '',
                On: false,
                Declaration: 'saw2 => WPKorg35 wpkorg35_osc1 => dac;',
                presets: [],
                Type: '',
                Visible: false,
                Code: (helper: any) => wpKorg35String('osc1', helper.osc1.cutoff, helper.osc1.resonance,helper.osc1.nonlinear, helper.osc1.saturation),
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            Modulate: {
                VarName: '',
                On: false,
                Declaration: 'hpf => Modulate mod_osc1 => dac;',
                presets: [],
                Type: '',
                Visible: false,
                Code: (helper: any, currentNoteVals: any) => modulateString('osc1', helper.osc1.vibratoRate, helper.osc1.vibratoGain, helper.osc1.randomGain, currentNoteVals),
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            Delay: {
                VarName: '',
                On: false,
                Declaration: (lines: any) => `Delay delay_osc1[${lines}];`,
                presets: [],
                Type: '',
                Visible: false,
                Code: (helper: any, currentNoteVals: any) => delayString('osc1', helper.osc1.delay, helper.osc1.lines, helper.osc1.syncDelay, helper.osc1.zero, helper.osc1.b0, helper.osc1.b1, currentNoteVals),
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            DelayA: {
                VarName: '',
                On: false,
                Declaration: (lines: any) => `DelayA delayA_osc1[${lines}];`,
                presets: [],
                Type: '',
                Visible: false,
                Code: (helper: any, currentNoteVals: any) => delayAString('osc1', helper.osc1.delay, helper.osc1.lines, helper.osc1.syncDelay, helper.osc1.zero, helper.osc1.b0, helper.osc1.b1, currentNoteVals),
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            DelayL: {
                VarName: '',
                On: false,
                Declaration: (lines: any) => `DelayL delayL_osc1[${lines}];`,
                presets: [],
                Type: '',
                Visible: false,
                Code: (helper: any, currentNoteVals: any, numeratorSignature: any) => delayLString('osc1', helper.osc1.delay, helper.osc1.lines, helper.osc1.syncDelay, helper.osc1.zero, helper.osc1.b0, helper.osc1.b1, currentNoteVals),
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            ExpDelay: {
                VarName: '',
                On: false,
                Declaration: ' ExpDelay expDelay_osc1 =>',
                presets: [],
                Type: '',
                Visible: false,
                Code: (helper:any, currentNoteVals: any) => expDelayString('osc1', helper.osc1.ampcurve, helper.osc1.durcurve, helper.osc1.delay, helper.osc1.mix, helper.osc1.reps, helper.osc1.gain, currentNoteVals),
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            Elliptic: {
                VarName: '',
                On: false,
                Declaration: ' Elliptic elliptic_osc1 =>',
                presets: [],
                Type: '',
                Visible: false,
                Code: (helper: any, currentNoteVals: any) =>  ellipticString('osc1', helper.osc1.filterLow, helper.osc1.filterMid, helper.osc1.filterHigh, helper.osc1.atten, helper.osc1.ripple, helper.osc1.filterMode, currentNoteVals),
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            Spectacle: {
                VarName: '',
                On: false,
                Declaration: ' => Spectacle spectacle_osc1 ',
                presets: [],
                Type: '',
                Visible: false,
                Code: (helper: any) => spectacleString('osc1', helper.osc1.bands, helper.osc1.delay, helper.osc1.eq, helper.osc1.feedback, helper.osc1.fftlen, helper.osc1.freqMax, helper.osc1.freqMin, helper.osc1.mix, helper.osc1.overlap, helper.osc1.table),
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            Gain: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            Bitcrusher: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            FoldbackSaturator: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            Echo: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            Chorus: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            PitShift: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            AmbPan3: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            JCRev: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            NRev: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            PRCRev: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            GVerb: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            KasFilter: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            Multicomb: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            PitchTrack: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            Sigmund: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            SndBuf: {
                src: '',
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            LiSa: {
                src: '',
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
        },
        effectsString: '',
        pattern: [{
            time: {
                bpm: 120,
                numerator: 4,
                denominator: 4,
                sequencerRate: 8,
                listenToMidiClock: true,
            },
            patternArr: [

            ],
            patternArrName: ''
        }],
        arpeggiateOn: false,
        active: true,
        isEditing: true,
        isMuted: false,
        isSolo: false,
        // Oscillator specific
    },
    stk1: {
        masterVolume: 50,
        masterPan: 0,
        detune: 0,
        effects: 
            {

                    WinFuncEnv: {
                        VarName: '',
                        On: false,
                        Declaration: ' WinFuncEnv winfuncenv_stk1 =>',
                        presets: [],
                        Type: '',
                        Visible: false,
                        Code: (helper:any) => winFuncString('stk1', helper.stk1.attackTime, helper.stk1.releaseTime, helper.stk1.envSetting),
                        EnvSetting: '',
                        ConnectionIn: [],
                        ConnectionOut: []
                    },
                    PowerADSR: {
                        VarName: '',
                        On: false,
                        Declaration: ' PowerADSR poweradsr_stk1 =>',
                        presets: [],
                        Type: '',
                        Visible: false,
                        Code: (helper: any) => powerADSRString('stk1', helper.stk1.attackTime, helper.stk1.attackCurve, helper.stk1.decayTime, helper.stk1.decayCurve, helper.stk1.sustainLevel, helper.stk1.releaseTime, helper.stk1.releaseCurve),
                        EnvSetting: '',
                        ConnectionIn: [],
                        ConnectionOut: []
                    },
                    ExpEnv: {
                        VarName: '',
                        On: false,
                        Declaration: ' ExpEnv expenv_stk1 =>',
                        presets: [],
                        Type: '',
                        Visible: false,
                        Code: (helper:any) => expEnvString('stk1', helper.stk1.T60, helper.stk1.radius, helper.stk1.value) ,
                        EnvSetting: '',
                        ConnectionIn: [],
                        ConnectionOut: []
                    },
                    WPDiodeLadder: {
                        VarName: '',
                        On: false,
                        Declaration: ' WPDiodeLadder wpdiodeladder_stk1 =>',
                        presets: [],
                        Type: '',
                        Visible: false,
                        Code: (helper: any) => wpDiodeLadderString('stk1', helper.stk1.cutoff, helper.stk1.resonance, helper.stk1.nlp_type, helper.stk1.nonlinear, helper.stk1.saturation),
                        EnvSetting: '',
                        ConnectionIn: [],
                        ConnectionOut: []
                    },
                    WPKorg35: {
                        VarName: '',
                        On: false,
                        Declaration: 'limiter_STK => WPKorg35 wpkorg35_stk1 => dac;',
                        presets: [],
                        Type: '',
                        Visible: false,
                        Code: (helper:any) => wpKorg35String('stk1', helper.stk1.cutoff, helper.stk1.resonance, helper.stk1.nonlinear, helper.stk1.saturation),
                        EnvSetting: '',
                        ConnectionIn: [],
                        ConnectionOut: []
                    },
                    Modulate: {
                        VarName: '',
                        On: false,
                        Declaration: ' Modulate mod_stk1 =>',
                        presets: [],
                        Type: '',
                        Visible: false,
                        Code: (helper:any, currentNoteVals: any) =>  modulateString('stk1', helper.stk1.vibratoRate, helper.stk1.vibratoGain, helper.stk1.randomGain, currentNoteVals),
                        EnvSetting: '',
                        ConnectionIn: [],
                        ConnectionOut: []
                    },
                    Delay: {
                        VarName: '',
                        On: false,
                        Declaration: (helper:any) => `Delay delay_stk1[${helper.stk1.lines}];`,
                        presets: [],
                        Type: '',
                        Visible: false,
                    
                        Code: (helper: any, currentNoteVals: any) => delayString('stk1', helper.stk1.delay, helper.stk1.lines, helper.stk1.syncDelay, helper.stk1.zero, helper.stk1.b0, helper.stk1.b1, currentNoteVals),
                        EnvSetting: '',
                        ConnectionIn: [],
                        ConnectionOut: []
                    },
                    DelayA: {
                        VarName: '',
                        On: false,
                        Declaration: (helper:any) => `DelayA delayA_stk1[${helper.stk1.lines}];`,
                        presets: [],
                        Type: '',
                        Visible: false,
                        Code: (helper: any, currentNoteVals: any) => delayAString('stk1', helper.stk1.delay, helper.stk1.lines, helper.stk1.syncDelay, helper.stk1.zero, helper.stk1.b0, helper.stk1.b1, currentNoteVals),
                        EnvSetting: '',
                        ConnectionIn: [],
                        ConnectionOut: []
                    },
                    DelayL: {
                        VarName: '',
                        On: false,
                        Declaration: (helper:any) => `DelayL delayL_stk1[${helper.stk1.lines}];`,
                        presets: [],
                        Type: '',
                        Visible: false,
                        Code: (helper: any, currentNoteVals: any, numeratorSignature: number) => delayLString('stk1', helper.stk1.delay, helper.stk1.lines, helper.stk1.syncDelay, helper.stk1.zero, helper.stk1.b0, helper.stk1.b1, currentNoteVals),
                        EnvSetting: '',
                        ConnectionIn: [],
                        ConnectionOut: []
                    },
                    ExpDelay: {
                        VarName: '',
                        On: false,
                        Declaration: ' ExpDelay expDelay_stk1 =>',
                        presets: [],
                        Type: '',
                        Visible: false,
                        Code: (helper: any, currentNoteVals: any) => expDelayString('stk1', helper.stk1.ampcurve, helper.stk1.durcurve, helper.stk1.delay, helper.stk1.mix, helper.stk1.reps, helper.stk1.gain, currentNoteVals),
                        EnvSetting: '',
                        ConnectionIn: [],
                        ConnectionOut: []
                    },
                    Elliptic: {
                        VarName: '',
                        On: false,
                        Declaration: ' Elliptic elliptic_stk1 =>',
                        presets: [],
                        Type: '',
                        Visible: false,
                        Code: (helper:any, currentNoteVals:any) => ellipticString('stk1', helper.stk1.filterLow, helper.stk1.filterMid, helper.stk1.filterHigh, helper.stk1.atten, helper.stk1.ripple, helper.stk1.filterMode, currentNoteVals),
                        EnvSetting: '',
                        ConnectionIn: [],
                        ConnectionOut: []
                    },
                    Spectacle: {
                        VarName: '',
                        On: false,
                
                        presets: [],
                        Type: '',
                        Visible: false,
                        Declaration: 'Spectacle spectacle_stk1 =>',
                        Code: (helper: any) => spectacleString('stk1', helper.stk1.bands, helper.stk1.delay, helper.stk1.eq, helper.stk1.feedback, helper.stk1.fftlen, helper.stk1.freqMax, helper.stk1.freqMin, helper.stk1.mix, helper.stk1.overlap, helper.stk1.table),
                        EnvSetting: '',
                        ConnectionIn: [],
                        ConnectionOut: []
                    },
                    Gain: {
                        VarName: '',
                        On: false,
                        Declaration: '',
                        presets: [],
                        Type: '',
                        Visible: false,
                        Code: '',
                        EnvSetting: '',
                        ConnectionIn: [],
                        ConnectionOut: []
                    },
                    Bitcrusher: {
                        VarName: '',
                        On: false,
                        Declaration: '',
                        presets: [],
                        Type: '',
                        Visible: false,
                        Code: '',
                        EnvSetting: '',
                        ConnectionIn: [],
                        ConnectionOut: []
                    },
                    FoldbackSaturator: {
                        VarName: '',
                        On: false,
                        Declaration: '',
                        presets: [],
                        Type: '',
                        Visible: false,
                        Code: '',
                        EnvSetting: '',
                        ConnectionIn: [],
                        ConnectionOut: []
                    },
                    Echo: {
                        VarName: '',
                        On: false,
                        Declaration: '',
                        presets: [],
                        Type: '',
                        Visible: false,
                        Code: '',
                        EnvSetting: '',
                        ConnectionIn: [],
                        ConnectionOut: []
                    },
                    Chorus: {
                        VarName: '',
                        On: false,
                        Declaration: '',
                        presets: [],
                        Type: '',
                        Visible: false,
                        Code: '',
                        EnvSetting: '',
                        ConnectionIn: [],
                        ConnectionOut: []
                    },
                    PitShift: {
                        VarName: '',
                        On: false,
                        Declaration: '',
                        presets: [],
                        Type: '',
                        Visible: false,
                        Code: '',
                        EnvSetting: '',
                        ConnectionIn: [],
                        ConnectionOut: []
                    },
                    AmbPan3: {
                        VarName: '',
                        On: false,
                        Declaration: '',
                        presets: [],
                        Type: '',
                        Visible: false,
                        Code: '',
                        EnvSetting: '',
                        ConnectionIn: [],
                        ConnectionOut: []
                    },
                    JCRev: {
                        VarName: '',
                        On: false,
                        Declaration: '',
                        presets: [],
                        Type: '',
                        Visible: false,
                        Code: '',
                        EnvSetting: '',
                        ConnectionIn: [],
                        ConnectionOut: []
                    },
                    NRev: {
                        VarName: '',
                        On: false,
                        Declaration: '',
                        presets: [],
                        Type: '',
                        Visible: false,
                        Code: '',
                        EnvSetting: '',
                        ConnectionIn: [],
                        ConnectionOut: []
                    },
                    PRCRev: {
                        VarName: '',
                        On: false,
                        Declaration: '',
                        presets: [],
                        Type: '',
                        Visible: false,
                        Code: '',
                        EnvSetting: '',
                        ConnectionIn: [],
                        ConnectionOut: []
                    },
                    GVerb: {
                        VarName: '',
                        On: false,
                        Declaration: '',
                        presets: [],
                        Type: '',
                        Visible: false,
                        Code: '',
                        EnvSetting: '',
                        ConnectionIn: [],
                        ConnectionOut: []
                    },
                    // ADSR: {
                    //     VarName: '',
                    //     On: false,
                    //     Declaration: '',
                    //     presets: [],
                    //     Type: '',
                    //     Visible: false,
                    //     Code: '',
                    //     EnvSetting: '',
                    //     ConnectionIn: [],
                    //     ConnectionOut: []
                    // },
                    KasFilter: {
                        VarName: '',
                        On: false,
                        Declaration: '',
                        presets: [],
                        Type: '',
                        Visible: false,
                        Code: '',
                        EnvSetting: '',
                        ConnectionIn: [],
                        ConnectionOut: []
                    },
                    Multicomb: {
                        VarName: '',
                        On: false,
                        Declaration: '',
                        presets: [],
                        Type: '',
                        Visible: false,
                        Code: '',
                        EnvSetting: '',
                        ConnectionIn: [],
                        ConnectionOut: []
                    },
                    PitchTrack: {
                        VarName: '',
                        On: false,
                        Declaration: '',
                        presets: [],
                        Type: '',
                        Visible: false,
                        Code: '',
                        EnvSetting: '',
                        ConnectionIn: [],
                        ConnectionOut: []
                    },
                    Sigmund: {
                        VarName: '',
                        On: false,
                        Declaration: '',
                        presets: [],
                        Type: '',
                        Visible: false,
                        Code: '',
                        EnvSetting: '',
                        ConnectionIn: [],
                        ConnectionOut: []
                    },
                    SndBuf: {
                        src: '',
                        VarName: '',
                        On: false,
                        Declaration: '',
                        presets: [],
                        Type: '',
                        Visible: false,
                        Code: '',
                        EnvSetting: '',
                        ConnectionIn: [],
                        ConnectionOut: []
                    },
                    LiSa: {
                        src: '',
                        VarName: '',
                        On: false,
                        Declaration: '',
                        presets: [],
                        Type: '',
                        Visible: false,
                        Code: '',
                        EnvSetting: '',
                        ConnectionIn: [],
                        ConnectionOut: []
                    },
                },
        effectsString: '',
        pattern: [{
            time: {
                bpm: 120,
                numerator: 4,
                denominator: 4,
                sequencerRate: 8,
                listenToMidiClock: true,
            },
            patternArr: [

            ],
            patternArrName: ''
        }],
        instruments: {
            Clarinet: {
                VarName: '',
                Type: '',
                On: false,
                Visible: false,
                presets: [],
                Declaration: '', 
            },
            StifKarp: {
                VarName: '',
                Type: '',
                On: false,
                Visible: false,
                presets: [],
                Declaration: '' 
            },
            Sitar: {
                VarName: '',
                Type: '',
                On: false,
                Visible: false,
                presets: [],
                Declaration: '',
            },
            FrencHrn: {
                VarName: '',
                Type: '',
                On: false,
                Visible: false,
                presets: [],
                Declaration: '', 
            },
            Moog: {
                VarName: '',
                Type: '',
                On: false,
                Visible: false,
                presets: [],
                Declaration: '', 
            },
            Rhodey: {
                VarName: '',
                Type: '',
                On: false,
                Visible: false,
                presets: [],
                Declaration: '',
            },
            Saxofony: {
                VarName: '',
                Type: '',
                On: false,
                Visible: false,
                presets: [],
                Declaration: '', 
            },
            Mandolin: {
                VarName: '',
                Type: '',
                On: false,
                Visible: false,
                presets: [],
                Declaration: '',  
            },
            BandedWg: {
                VarName: '',
                Type: '',
                On: false,
                Visible: false,
                presets: [],
                Declaration: '', 
            },
            BlowBtl: {
                VarName: '',
                Type: '',
                On: false,
                Visible: false,
                presets: [],
                Declaration: '', 
            },
            BlowHole: {
                VarName: '',
                Type: '',
                On: false,
                Visible: false,
                presets: [],
                Declaration: '', 
            },
            Bowed: {
                VarName: '',
                Type: '',
                On: false,
                Visible: false,
                presets: [],
                Declaration: '', 
            },
            Brass: {
                VarName: '',
                Type: '',
                On: false,
                Visible: false,
                presets: [],
                Declaration: '',  
            },
            Flute: {
                VarName: '',
                Type: '',
                On: false,
                Visible: false,
                presets: [],
                Declaration: '',  
            },
            ModalBar: {
                VarName: '',
                Type: '',
                On: false,
                Visible: false,
                presets: [],
                Declaration: '',  
            },
            Shakers: {
                VarName: '',
                Type: '',
                On: false,
                Visible: false,
                presets: [],
                Declaration: '',  
            },
            VoicForm: {
                VarName: '',
                Type: '',
                On: false,
                Visible: false,
                presets: [],
                Declaration: ''  
            },
            B3: {
                VarName: '',
                Type: '',
                On: false,
                Visible: false,
                presets: [],
                Declaration: ''  
            },
            HevyMetl: {
                VarName: '',
                Type: '',
                On: false,
                Visible: false,
                presets: [],
                Declaration: ''  
            },
            HonkeyTonk: {
                VarName: '',
                Type: '',
                On: false,
                Visible: false,
                presets: [],
                Declaration: '',  
            },
            FMVoices: {
                VarName: '',
                Type: '',
                On: false,
                Visible: false,
                presets: [],
                Declaration: '',  
            },
            KrstlChr: {
                VarName: '',
                Type: '',
                On: false,
                Visible: false,
                presets: [],
                Declaration: ''  
            },
            PercFlut: {
                VarName: '',
                Type: '',
                On: false,
                Visible: false,
                presets: [],
                Declaration: ''  
            },
            TubeBell: {
                VarName: '',
                Type: '',
                On: false,
                Visible: false,
                presets: [],
                Declaration: ''  
            },
            Wurley: {
                VarName: '',
                Type: '',
                On: false,
                Visible: false,
                presets: [],
                Declaration: ''  
            },
        },
        arpeggiateOn: false,
        active: false,
        isEditing: false,
        isMuted: false,
        isSolo: false,
        // Stk specific TODO!!!
    },
    sampler: {
        masterVolume: 50,
        masterPan: 0,
        detune: 0,
        effects: {
            WinFuncEnv: {
                VarName: '',
                On: false,
                Declaration: ' WinFuncEnv winfuncenv_sampler =>',
                presets: [],
                Type: '',
                Visible: false,
                Code: (helper:any) => winFuncString('sampler', helper.sampler.attackTime, helper.sampler.releaseTime, helper.sampler.envSetting),
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            PowerADSR: {
                VarName: '',
                On: false,
                Declaration: ' PowerADSR poweradsr_sampler =>',
                presets: [],
                Type: '',
                Visible: false,
                Code: (helper:any) => powerADSRString('sampler', helper.sampler.attackTime, helper.sampler.attackCurve, helper.sampler.decayTime, helper.sampler.decayCurve, helper.sampler.sustainLevel, helper.sampler.releaseTime, helper.sampler.releaseCurve),
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            ExpEnv: {
                VarName: '',
                On: false,
                Declaration: ' ExpEnv expenv_sampler =>',
                presets: [],
                Type: '',
                Visible: false,
                Code: (helper:any) => expEnvString('sampler', helper.sampler.T60, helper.sampler.radius, helper.sampler.value),
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            WPDiodeLadder: {
                VarName: '',
                On: false,
                Declaration: ' WPDiodeLadder wpdiodeladder_sampler =>',
                presets: [],
                Type: '',
                Visible: false,
                Code: (helper:any) => wpDiodeLadderString('sampler', helper.sampler.cutoff, helper.sampler.resonance, helper.sampler.nlp_type, helper.sampler.nonlinear, helper.sampler.saturation),
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            WPKorg35: {
                VarName: '',
                On: false,
                Declaration: 'limiter_Sampler => WPKorg35 wpkorg35_sampler => dac;',
                presets: [],
                Type: '',
                Visible: false,
                Code: (helper:any) => wpKorg35String('sampler', helper.sampler.cutoff, helper.sampler.resonance, helper.sampler.nonlinear, helper.sampler.saturation) ,
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            Modulate: {
                VarName: '',
                On: false,
                Declaration: ' Modulate mod_sampler =>',
                presets: [],
                Type: '',
                Visible: false,
                Code: (helper:any, currentNoteVals:any) => modulateString('sampler', helper.sampler.vibratoRate, helper.sampler.vibratoGain, helper.sampler.randomGain, currentNoteVals),
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            Delay: {
                VarName: '',
                On: false,
                Declaration: (helper: any) => `Delay delay_sampler[${helper.sampler.lines}];`,
                presets: [],
                Type: '',
                Visible: false,
                Code: (helper:any, currentNoteVals: any) => delayString('sampler', helper.sampler.delay, helper.sampler.lines, helper.sampler.syncDelay, helper.sampler.zero, helper.sampler.b0, helper.sampler.b1, currentNoteVals),
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            DelayA: {
                VarName: '',
                On: false,
                Declaration: (helper:any) => `DelayA delayA_sampler[${helper.sampler.lines}];`,
                presets: [],
                Type: '',
                Visible: false,
                Code: (helper:any, currentNoteVals: any) => delayAString('sampler', helper.sampler.delay, helper.sampler.lines, helper.sampler.syncDelay, helper.sampler.zero, helper.sampler.b0, helper.sampler.b1, currentNoteVals) ,
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            DelayL: {
                VarName: '',
                On: false,
                Declaration: (helper:any) => `DelayL delayL_sampler[${helper.sampler.lines}];`,
                presets: [],
                Type: '',
                Visible: false,
                Code: (helper:any, currentNoteVals: any, numeratorSignature: number) => delayLString('sampler', helper.sampler.delay, helper.sampler.lines, helper.sampler.syncDelay, helper.sampler.zero, helper.sampler.b0, helper.sampler.b1, currentNoteVals),
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            ExpDelay: {
                VarName: '',
                On: false,
                Declaration: ' ExpDelay expDelay_sampler =>',
                presets: [],
                Type: '',
                Visible: false,
                Code: (helper:any, currentNoteVals:any) => expDelayString('sampler', helper.sampler.ampcurve, helper.sampler.durcurve, helper.sampler.delay, helper.sampler.mix, helper.sampler.reps, helper.sampler.gain, currentNoteVals),
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            Elliptic: {
                VarName: '',
                On: false,
                Declaration: ' Elliptic elliptic_sampler =>',
                presets: [],
                Type: '',
                Visible: false,
                Code: (helper:any, currentNoteVals:any) => ellipticString('sampler', helper.sampler.filterLow, helper.sampler.filterMid, helper.sampler.filterHigh, helper.sampler.atten, helper.sampler.ripple, helper.sampler.filterMode, currentNoteVals),
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            Spectacle: {
                VarName: '',
                On: false,
                Declaration: 'Spectacle spectacle_sampler =>',
                presets: [],
                Type: '',
                Visible: false,
                Code: (helper:any) => spectacleString('sampler', helper.sampler.bands, helper.sampler.delay, helper.sampler.eq, helper.sampler.feedback, helper.sampler.fftlen, helper.sampler.freqMax, helper.sampler.freqMin, helper.sampler.mix, helper.sampler.overlap, helper.sampler.table),
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            Gain: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            Bitcrusher: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            FoldbackSaturator: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            Echo: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            Chorus: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            PitShift: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            AmbPan3: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            JCRev: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            NRev: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            PRCRev: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            GVerb: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            KasFilter: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            Multicomb: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            PitchTrack: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            Sigmund: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            SndBuf: {
                src: '',
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            LiSa: {
                src: '',
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
        },
        effectsString: '',
        pattern: [{
            time: {
                bpm: 120,
                numerator: 4,
                denominator: 4,
                sequencerRate: 8,
                listenToMidiClock: true,
            },
            patternArr: [

            ],
            patternArrName: ''
        }],
        arpeggiateOn: false,
        active: false,
        isEditing: false,
        isMuted: false,
        isSolo: false,
        // Sampler specific TODO!!!
    },
    audioin: {
        masterVolume: 50,
        masterPan: 0,
        detune: 0,
        effects: {
            WinFuncEnv: {
                VarName: '',
                On: false,
                Declaration: ' WinFuncEnv winfuncenv_audioin =>',
                presets: [],
                Type: '',
                Visible: false,
                Code: (helper:any) => winFuncString('audioin', helper.audioin.attackTime, helper.audioin.releaseTime, helper.audioin.envSetting),
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            PowerADSR: {
                VarName: '',
                On: false,
                Declaration: ' PowerADSR poweradsr_audioin =>',
                presets: [],
                Type: '',
                Visible: false,
                Code: (helper:any) => powerADSRString('audioin', helper.audioin.attackTime, helper.audioin.attackCurve, helper.audioin.decayTime, helper.audioin.decayCurve, helper.audioin.sustainLevel, helper.audioin.releaseTime, helper.audioin.releaseCurve),
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            ExpEnv: {
                VarName: '',
                On: false,
                Declaration: ' ExpEnv expenv_audioin =>',
                presets: [],
                Type: '',
                Visible: false,
                Code: (helper:any) => expEnvString('audioin', helper.audioin.T60, helper.audioin.radius, helper.audioin.value),
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            WPDiodeLadder: {
                VarName: '',
                On: false,
                Declaration: ' WPDiodeLadder wpdiodeladder_audioin =>',
                presets: [],
                Type: '',
                Visible: false,
                Code: (helper:any) => wpDiodeLadderString('audioin', helper.audioin.cutoff, helper.audioin.resonance, helper.audioin.nlp_type, helper.audioin.nonlinear, helper.audioin.saturation),
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            WPKorg35: {
                VarName: '',
                On: false,
                Declaration: 'limiter_audioin => WPKorg35 wpkorg35_audioin => dac;',
                presets: [],
                Type: '',
                Visible: false,
                Code: (helper:any) => wpKorg35String('audioin', helper.audioin.cutoff, helper.audioin.resonance, helper.audioin.nonlinear, helper.audioin.saturation) ,
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            Modulate: {
                VarName: '',
                On: false,
                Declaration: ' Modulate mod_audioin =>',
                presets: [],
                Type: '',
                Visible: false,
                Code: (helper:any, currentNoteVals:any) => modulateString('audioin', helper.audioin.vibratoRate, helper.audioin.vibratoGain, helper.audioin.randomGain, currentNoteVals),
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            Delay: {
                VarName: '',
                On: false,
                Declaration: (helper: any) => `Delay delay_audioin[${helper.audioin.lines}];`,
                presets: [],
                Type: '',
                Visible: false,
                Code: (helper:any, currentNoteVals: any) => delayString('audioin', helper.audioin.delay, helper.audioin.lines, helper.audioin.syncDelay, helper.audioin.zero, helper.audioin.b0, helper.audioin.b1, currentNoteVals),
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            DelayA: {
                VarName: '',
                On: false,
                Declaration: (helper:any) => `DelayA delayA_audioin[${helper.audioin.lines}];`,
                presets: [],
                Type: '',
                Visible: false,
                Code: (helper:any, currentNoteVals: any) => delayAString('audioin', helper.audioin.delay, helper.audioin.lines, helper.audioin.syncDelay, helper.audioin.zero, helper.audioin.b0, helper.audioin.b1, currentNoteVals) ,
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            DelayL: {
                VarName: '',
                On: false,
                Declaration: (helper:any) => `DelayL delayL_audioin[${helper.audioin.lines}];`,
                presets: [],
                Type: '',
                Visible: false,
                Code: (helper:any, currentNoteVals: any, numeratorSignature: number) => delayLString('audioin', helper.audioin.delay, helper.audioin.lines, helper.audioin.syncDelay, helper.audioin.zero, helper.audioin.b0, helper.audioin.b1, currentNoteVals),
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            ExpDelay: {
                VarName: '',
                On: false,
                Declaration: ' ExpDelay expDelay_audioin =>',
                presets: [],
                Type: '',
                Visible: false,
                Code: (helper:any, currentNoteVals:any) => expDelayString('audioin', helper.audioin.ampcurve, helper.audioin.durcurve, helper.audioin.delay, helper.audioin.mix, helper.audioin.reps, helper.audioin.gain, currentNoteVals),
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            Elliptic: {
                VarName: '',
                On: false,
                Declaration: ' Elliptic elliptic_audioin =>',
                presets: [],
                Type: '',
                Visible: false,
                Code: (helper:any, currentNoteVals:any) => ellipticString('audioin', helper.audioin.filterLow, helper.audioin.filterMid, helper.audioin.filterHigh, helper.audioin.atten, helper.audioin.ripple, helper.audioin.filterMode, currentNoteVals),
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            Spectacle: {
                VarName: '',
                On: false,
                Declaration: 'Spectacle spectacle_audioin =>',
                presets: [],
                Type: '',
                Visible: false,
                Code: (helper:any) => spectacleString('audioin', helper.audioin.bands, helper.audioin.delay, helper.audioin.eq, helper.audioin.feedback, helper.audioin.fftlen, helper.audioin.freqMax, helper.audioin.freqMin, helper.audioin.mix, helper.audioin.overlap, helper.audioin.table),
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            Gain: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            Bitcrusher: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            FoldbackSaturator: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            Echo: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            Chorus: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            PitShift: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            AmbPan3: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            JCRev: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            NRev: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            PRCRev: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            GVerb: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            // ADSR: {
            //     VarName: '',
            //     On: false,
            //     Declaration: '',
            //     presets: [],
            //     Type: '',
            //     Visible: false,
            //     Code: '',
            //     EnvSetting: '',
            //     ConnectionIn: [],
            //     ConnectionOut: []
            // },
            KasFilter: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            Multicomb: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            PitchTrack: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            Sigmund: {
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            SndBuf: {
                src: '',
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
            LiSa: {
                src: '',
                VarName: '',
                On: false,
                Declaration: '',
                presets: [],
                Type: '',
                Visible: false,
                Code: '',
                EnvSetting: '',
                ConnectionIn: [],
                ConnectionOut: []
            },
        },
        effectsString: '',
        pattern: [{
            time: {
                bpm: 120,
                numerator: 4,
                denominator: 4,
                sequencerRate: 8,
                listenToMidiClock: true,
            },
            patternArr: [

            ],
            patternArrName: ''
        }],
        arpeggiateOn: false,
        active: false,
        isEditing: false,
        isMuted: false,
        isSolo: false,
        // MULTICHANNEL IN TODO
    },
}