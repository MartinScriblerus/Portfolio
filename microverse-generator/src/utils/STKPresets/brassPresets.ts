export const stkVariableBrass = "brs";
export const stkIdentifierBrass = "Brass";

const brassPresets = {
    lip: { // if this does not work, try controlChange 1
        name: "lip",
        label: "Lip",
        value: 0.20,
        min: 0.0,
        max: 1.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
    slide: {
        name: "slide", // if this does not work, try controlChange 2
        label: "Slide",
        value: 0.01,
        min: 0.01,
        max: 1.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
    vibratoFreq: {
        name: "vibratoFreq",
        label: "Vibr Freq",
        value: 0.01,
        min: 0.01,
        max: 12.0,
        screenInterface: "intspinner",
        fxType: "stk",
        type: "float",
    }, // freq in hZ
    vibratoGain: {
        name: "vibratoGain",
        label: "Vibr Gain",
        value: 0.6,
        min: 0.0,
        max: 1.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
    volume: {
        name: "volume",
        label: "Vol Release",
        value: 0.01,
        min: 0.01,
        max: 1.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
    
    startBlowing: {
        name: "startBlowing",
        label: "Strt Blow",
        value: 1.0,
        min: 0.01,
        max: 1.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
    stopBlowing: {
        name: "stopBlowing",
        label: "Stp Blow",
        value: 1.0,
        min: 0.01,
        max: 1.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",  
    },
    rate: {
        name: "rate",
        label: "Rate",
        value: 0.02,
        min: 0.01,
        max: 2.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    }, // rate in seconds
    gain: {
        name: "gain",
        label: "Gain",
        value: 3.0,
        min: 0.01,
        max: 6.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
    // reverb: {
    //     name: "reverb",
    //     label: "Reverb",
    //     value: 5,
    //     min: 0,
    //     max: 100,
    //     screenInterface: "knob",
    // }, // reverb amount (0-100)
};

export default brassPresets;