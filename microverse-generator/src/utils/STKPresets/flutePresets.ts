export const stkVariableFlute = "flut";
export const stkIdentifierFlute = "Flute";

const flutePresets = {
    jetDelay: {
        name: "jetDelay", // if this does not work, try controlChange 2
        label: "Jet Delay",
        value: 0.1,
        min: 0.01,
        max: 1.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
    jetReflection: {
        name: "jetReflection", // if this does not work, try controlChange 2
        label: "Jet Reflection",
        value: 0.35,
        min: 0.32,
        max: 1.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
    endReflection: {
        name: "endReflection", // if this does not work, try controlChange 2
        label: "End Reflection",
        value: 0.5,
        min: 0.5,
        max: 0.8,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
    noiseGain: {
        name: "noiseGain", // if this does not work, try controlChange 2
        label: "Noise Gain",
        value: 0.6,
        min: 0.01,
        max: 1.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
    vibratoFreq: {
        name: "vibratoFreq",
        label: "Vibr Freq",
        value: 1,
        min: 0,
        max: 11,
        screenInterface: "knob",
        fxType: "stk",
        type: "int",
    },
    vibratoGain: {
        name: "vibratoGain",
        label: "Vibr Gain",
        value: 0.01,
        min: 0.01,
        max: 1.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    }, // freq in hZ
    pressure: {
        name: "pressure",
        label: "Pressure",
        value: 0.9,
        min: 0.88,
        max: 1.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
    startBlowing: {
        name: "startBlowing",
        label: "Strt Blow",
        value: 0.9,
        min: 0.88,
        max: 1.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
    stopBlowing: {
        name: "stopBlowing",
        label: "Stp Blow",
        value: 0.5,
        min: 0.01,
        max: 1.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
    rate: {
        name: "rate",
        label: "Rate",
        value: 1.0,
        min: 0.01,
        max: 2.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    }, // rate in seconds
    gain: {
        name: "gain",
        label: "Gain",
        value: 0.3,
        min: 0.01,
        max: 2.0,
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

export default flutePresets;