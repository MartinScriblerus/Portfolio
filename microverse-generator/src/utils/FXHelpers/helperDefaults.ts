export const defaultNoteVals = {
    // master: ["whole/4"],
    // oscs: ["whole/4"],
    // stks: ["whole/4"],
    // samples: ["whole/4"],
    // linesIn: ["whole/4"]
    master: [4],
    osc1: [4],
    // osc2: [4],
    stks: [4],
    samples: [8],
    linesIn: [4]
}

export const lenMarks = [
    // {
    //     value: 0,
    //     label: '1/128',
    // },
    // {
    //     value: 0,
    //     label: '1/64',
    // },
    // {
    //     value: 1,
    //     label: '1/32',
    // },
    {
        value: 0,
        label: '1/16',
    },
    {
        value: 1,
        label: '1/8',
    },
    {
        value: 2,
        label: '1/4',
    },
    {
        value: 3,
        label: '1/2',
    },
    {
        value: 4,
        label: '1',
    },
    {
        value: 5,
        label: '2',
    },
    {
        value: 6,
        label: '4',
    },
    {
        value: 7,
        label: '8',
    },
    {
        value: 8,
        label: '16',
    }
];

export const winFuncEnvDefault = {
    osc1: {
        attackTime: 16,
        releaseTime: 16,
        envSetting: 0,
    },
    // osc2: {
    //     attackTime: 16,
    //     releaseTime: 16,
    //     envSetting: 0,
    // },
    stk1: {
        attackTime: 16,
        releaseTime: 16,
        envSetting: 0,
    },
    sampler: {
        attackTime: 16,
        releaseTime: 16,
        envSetting: 0,
    },
    audioin: {
        attackTime: 16,
        releaseTime: 16,
        envSetting: 0,
    },
};

export const powerADSRDefault = {
    osc1: {
        attackTime: 1000,
        attackCurve: 0.5,
        decayTime: 1000,
        decayCurve: 1.25,
        sustainLevel: 0.5,
        releaseTime: 1000,
        releaseCurve: 1.5,
    },
    // osc2: {
    //     attackTime: 1000,
    //     attackCurve: 0.5,
    //     decayTime: 1000,
    //     decayCurve: 1.25,
    //     sustainLevel: 0.5,
    //     releaseTime: 1000,
    //     releaseCurve: 1.5,
    // },
    stk1: {
        attackTime: 1000,
        attackCurve: 0.5,
        decayTime: 1000,
        decayCurve: 1.25,
        sustainLevel: 0.5,
        releaseTime: 1000,
        releaseCurve: 1.5,
    },
    sampler: {
        attackTime: 1000,
        attackCurve: 0.5,
        decayTime: 1000,
        decayCurve: 1.25,
        sustainLevel: 0.5,
        releaseTime: 1000,
        releaseCurve: 1.5,
    },
    audioin: {
        attackTime: 1000,
        attackCurve: 0.5,
        decayTime: 1000,
        decayCurve: 1.25,
        sustainLevel: 0.5,
        releaseTime: 1000,
        releaseCurve: 1.5,
    },
};

export const expEnvDefault = {
    osc1: {
        T60: 3,
        radius: 0.995,
        value: 0,
    },
    // osc2: {
    //     T60: 3,
    //     radius: 0.995,
    //     value: 0,
    // },
    stk1: {
        T60: 3,
        radius: 0.995,
        value: 0,
    },
    sampler: {
        T60: 3,
        radius: 0.995,
        value: 0,
    },
    audioin: {
        T60: 3,
        radius: 0.995,
        value: 0,
    },
};

export const wpDiodeDefault = {
    osc1: {
        cutoff: 1,
        resonance: 17,
        nlp_type: 1,
        nonlinear: 0,
        saturation: 0.1
    },
    // osc2: {
    //     cutoff: 1,
    //     resonance: 17,
    //     nlp_type: 1,
    //     nonlinear: 0,
    //     saturation: 0.1
    // },
    stk1: {
        cutoff: 1,
        resonance: 17,
        nlp_type: 1,
        nonlinear: 0,
        saturation: 0.1
    },
    sampler: {
        cutoff: 1,
        resonance: 17,
        nlp_type: 1,
        nonlinear: 0,
        saturation: 0.1
    },
    audioin: {
        cutoff: 1,
        resonance: 17,
        nlp_type: 1,
        nonlinear: 0,
        saturation: 0.1
    },
};

export const korg35Default = {
    osc1: {
        cutoff: 1,
        resonance: 2,
        nonlinear: 0,
        saturation: 0.1
    },
    // osc2: {
    //     cutoff: 1,
    //     resonance: 2,
    //     nonlinear: 0,
    //     saturation: 0.1
    // },
    stk1: {
        cutoff: 1,
        resonance: 2,
        nonlinear: 0,
        saturation: 0.1
    },
    sampler: {
        cutoff: 1,
        resonance: 2,
        nonlinear: 0,
        saturation: 0.1
    },
    audioin: {
        cutoff: 1,
        resonance: 2,
        nonlinear: 0,
        saturation: 0.1
    },
};

export const modulateDefault = {
    osc1: {
        vibratoRate: 6.0,
        vibratoGain: 0.2,
        randomGain: 0.2,
    },
    // osc2: {
    //     vibratoRate: 6.0,
    //     vibratoGain: 0.2,
    //     randomGain: 0.2,
    // },
    stk1: {
        vibratoRate: 6.0,
        vibratoGain: 0.2,
        randomGain: 0.2,
    },
    sampler: {
        vibratoRate: 6.0,
        vibratoGain: 0.2,
        randomGain: 0.2,
    },
    audioin: {
        vibratoRate: 6.0,
        vibratoGain: 0.2,
        randomGain: 0.2,
    },
};

export const delayDefault = {
    osc1: {
        delay: 500,
        syncDelay: 1,
        lines: 3,
        zero: 0.5,
        b0: 0.5,
        b1: 0.2,
    },
    // osc2: {
    //     delay: 500,
    //     syncDelay: 1,
    //     lines: 3,
    //     zero: 0.5,
    //     b0: 0.5,
    //     b1: 0.2,
    // },
    stk1: {
        delay: 500,
        syncDelay: 1,
        lines: 3,
        zero: 0.5,
        b0: 0.5,
        b1: 0.2,
    },
    sampler: {
        delay: 500,
        syncDelay: 1,
        lines: 3,
        zero: 0.5,
        b0: 0.5,
        b1: 0.2,
    },
    audioin: {
        delay: 500,
        syncDelay: 1,
        lines: 3,
        zero: 0.5,
        b0: 0.5,
        b1: 0.2,
    },
};

export const delayADefault = {
    osc1: {
        delay: 500,
        syncDelay: 1,
        lines: 3,
        zero: 0.5,
        b0: 0.5,
        b1: 0.2,
    },
    // osc2: {
    //     delay: 500,
    //     syncDelay: 1,
    //     lines: 3,
    //     zero: 0.5,
    //     b0: 0.5,
    //     b1: 0.2,
    // },
    stk1: {
        delay: 500,
        syncDelay: 1,
        lines: 3,
        zero: 0.5,
        b0: 0.5,
        b1: 0.2,
    },
    sampler: {
        delay: 500,
        syncDelay: 1,
        lines: 3,
        zero: 0.5,
        b0: 0.5,
        b1: 0.2,
    },
    audioin: {
        delay: 500,
        syncDelay: 1,
        lines: 3,
        zero: 0.5,
        b0: 0.5,
        b1: 0.2,
    },
};

export const delayLDefault = {
    osc1: {
        delay: 500,
        syncDelay: 1,
        lines: 3,
        zero: 0.5,
        b0: 0.5,
        b1: 0.2,
    },
    // osc2: {
    //     delay: 500,
    //     syncDelay: 1,
    //     lines: 3,
    //     zero: 0.5,
    //     b0: 0.5,
    //     b1: 0.2,
    // },
    stk1: {
        delay: 500,
        syncDelay: 1,
        lines: 3,
        zero: 0.5,
        b0: 0.5,
        b1: 0.2,
    },
    sampler: {
        delay: 500,
        syncDelay: 1,
        lines: 3,
        zero: 0.5,
        b0: 0.5,
        b1: 0.2,
    },
    audioin: {
        delay: 500,
        syncDelay: 1,
        lines: 3,
        zero: 0.5,
        b0: 0.5,
        b1: 0.2,
    },
};

export const expDelayDefault = {
    osc1: {
        ampcurve: 2.0,
        durcurve: 2.0,
        delay: 0,
        mix: 0.5,
        reps: 4,
        gain: 1.0,
    },
    // osc2: {
    //     ampcurve: 2.0,
    //     durcurve: 2.0,
    //     delay: 0,
    //     mix: 0.5,
    //     reps: 4,
    //     gain: 1.0,
    // },
    stk1: {
        ampcurve: 2.0,
        durcurve: 2.0,
        delay: 0,
        mix: 0.5,
        reps: 4,
        gain: 1.0,
    },
    sampler: {
        ampcurve: 2.0,
        durcurve: 2.0,
        delay: 0,
        mix: 0.5,
        reps: 4,
        gain: 1.0,
    },
    audioin: {
        ampcurve: 2.0,
        durcurve: 2.0,
        delay: 0,
        mix: 0.5,
        reps: 4,
        gain: 1.0,
    },
};

export const ellipticDefault = {
    osc1: {
        filterLow: 500,
        filterMid: 600,
        filterHigh: 650,
        atten: 80.0,
        ripple: 10.0,
        filterMode: 0
    },
    // osc2: {
    //     filterLow: 500,
    //     filterMid: 600,
    //     filterHigh: 650,
    //     atten: 80.0,
    //     ripple: 10.0,
    //     filterMode: 0
    // },
    stk1: {
        filterLow: 500,
        filterMid: 600,
        filterHigh: 650,
        atten: 80.0,
        ripple: 10.0,
        filterMode: 0
    },
    sampler: {
        filterLow: 500,
        filterMid: 600,
        filterHigh: 650,
        atten: 80.0,
        ripple: 10.0,
        filterMode: 0
    },
    audioin: {
        filterLow: 500,
        filterMid: 600,
        filterHigh: 650,
        atten: 80.0,
        ripple: 10.0,
        filterMode: 0
    },
};

export const spectacleDefault = {
    osc1: {
        bands: 5,
        delay: 3,
        eq: 0,
        feedback: 0,
        fftlen: 3,
        freqMax: 4100,
        freqMin: 100,
        mix: 0.8,
        overlap: 3,
        table: 2,
    },
    // osc2: {
    //     bands: 5,
    //     delay: 3,
    //     eq: 0,
    //     feedback: 0,
    //     fftlen: 3,
    //     freqMax: 4100,
    //     freqMin: 100,
    //     mix: 0.8,
    //     overlap: 3,
    //     table: 2,
    // },
    stk1: {
        bands: 5,
        delay: 3,
        eq: 0,
        feedback: 0,
        fftlen: 3,
        freqMax: 4100,
        freqMin: 100,
        mix: 0.8,
        overlap: 3,
        table: 2,
    },
    sampler: {
        bands: 5,
        delay: 3,
        eq: 0,
        feedback: 0,
        fftlen: 3,
        freqMax: 4100,
        freqMin: 100,
        mix: 0.8,
        overlap: 3,
        table: 2,
    },
    audioin: {
        bands: 5,
        delay: 3,
        eq: 0,
        feedback: 0,
        fftlen: 3,
        freqMax: 4100,
        freqMin: 100,
        mix: 0.8,
        overlap: 3,
        table: 2,
    },
};

export const getChord = (label: string, chords: any) => {
    console.log("label?? ", label);
    console.log("chords?? ", chords);
    const theChord = [];
    if (label === 'Major Triad') {
        theChord.push(...chords.I.MAJOR[0]);
    } else if (label === 'Minor Triad') {
        theChord.push(...chords.I.MINOR);
    } else if (label === 'Augmented Triad') {
        theChord.push(...chords.I.AUGMENTED);
    } else if (label === 'Diminished Triad') {
        theChord.push(...chords.I.DIMINISHED);
    } 
    else if (label === 'Hendrix Chord') {
        theChord.push(...chords.I.CHORD_HENDRIX);
    }

    // else if (label === 'Inversion 1') {
    //     theChord.push(...chords.I.INVERSION_1[0]);
    // } else if (label === 'Inversion 2') {
    //     theChord.push(...chords.I.INVERSION_2[0]);
    // } else if (label === 'Inversion 3') {
    //     theChord.push(...chords.I.INVERSION_3[0]);
    // }

    // else if (label === 'Suspended Triad') {
    //     theChord.push(...chords.I.SUSPENDED_TRIAD[0]);
    // } 
    else if (label === 'Suspended Second Triad') {
        theChord.push(...chords.I.SUSPENDED_SECOND_TRIAD);
    } else if (label === 'Suspended Fourth Triad') {
        theChord.push(...chords.I.SUSPENDED_FOURTH_TRIAD);
    } else if (label === 'Suspended Fourth Ninth') {
        theChord.push(...chords.I.SUSPENDED_FOURTH_NINTH);
    } else if (label === 'Suspended Seventh') {
        theChord.push(...chords.I.SUSPENDED_SEVENTH);
    } else if (label === 'Minor Second') {
        theChord.push(...chords.I.MIN_SECOND);
    } else if (label === 'Minor Third') {
        theChord.push(...chords.I.MIN_THIRD);
    } else if (label === 'Major Fourth') {
        theChord.push(...chords.I.MAJ_FOURTH);
    } else if (label === 'Perfect Fourth') {
        theChord.push(...chords.I.PERFECT_FOURTH);
    } else if (label === 'Major Fifth') {
        theChord.push(...chords.I.MAJ_FIFTH);
    } else if (label === 'Minor Fifth') {
        theChord.push(...chords.I.MIN_FIFTH);
    } else if (label === 'Perfect Fifth') {
        theChord.push(...chords.I.PERFECT_FIFTH);
    } else if (label === 'Major Sixth') {
        theChord.push(...chords.I.MAJ_SIXTH);
    } else if (label === 'Dominant Sixth') {
        theChord.push(...chords.I.DOMINANT_SIXTH);
    } else if (label === 'Sixth Ninth') {
        theChord.push(...chords.I.SIXTH_NINTH);
    } else if (label === 'Minor Sixth') {
        theChord.push(...chords.I.MIN_SIXTH);
    } else if (label === 'Major Seventh') {
        theChord.push(...chords.I.MAJ_SEVENTH);
    } else if (label === 'Minor Seventh') {
        theChord.push(...chords.I.MIN_SEVENTH);
    } else if (label === 'Augmented Major Seventh') {
        theChord.push(...chords.I.AUGMENTED_MAJ_SEVENTH);
    } else if (label === 'Augmented Minor Seventh') {
        theChord.push(...chords.I.AUGMENTED_MIN_SEVENTH);
    } else if (label === 'Half Diminished Seventh') {
        theChord.push(...chords.I.HALF_DIMINISHED_SEVENTH);
    } else if (label === 'Dominant Sixth') {  
        theChord.push(...chords.I.DOMINANT_SIXTH);
    } else if (label === 'Augmented Major Seventh') {
        theChord.push(...chords.I.AUGMENTED_MAJ_SEVENTH);
    } else if (label === 'Augmented Minor Seventh') {
        theChord.push(...chords.I.AUGMENTED_MIN_SEVENTH);
    } else if (label === 'Lydian Dominant Seventh') {
        theChord.push(...chords.I.LYDIAN_DOMINANT_SEVENTH);
    // } else if (label === 'Sixth Ninth') {
    //     theChord.push(...chords.I.SIXTH_NINTH[0]);
    } else if (label === 'Major Ninth') {
        theChord.push(...chords.I.MAJOR_NINTH);
    } else if (label === 'Minor Ninth') {
        theChord.push(...chords.I.MINOR_NINTH);
    } else if (label === 'Dominant Ninth') {
        theChord.push(...chords.I.DOMINANT_NINTH);
    } else if (label === 'Dominant Sharp Ninth') {
        theChord.push(...chords.I.DOMINANT_SHARP_NINTH);
    } else if (label === 'Dominant Flat Ninth') {
        theChord.push(...chords.I.DOMINANT_FLAT_NINTH);
    } else if (label === 'Major Eleventh') {
        theChord.push(...chords.I.MAJOR_ELEVENTH);
    } else if (label === 'Major Thirteenth') {
        theChord.push(...chords.I.MAJOR_THIRTEENTH);
    } else if (label === 'Minor Thirteenth') {
        theChord.push(...chords.I.MINOR_THIRTEENTH);
    } else if (label === 'Dominant Thirteenth') {
        theChord.push(...chords.I.DOMINANT_THIRTEENTH);
    } 
    else {}
    return theChord;
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

