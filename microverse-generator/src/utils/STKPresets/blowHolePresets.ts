export const stkVariableBlowHole = "blwhl";
export const stkIdentifierBlowHole = "BlowHole";

const blowHolePresets = {
    reed: { // if this does not work, try controlChange 1
        name: "reed",
        label: "Reed",
        value: 0.50,
        min: 0.01,
        max: 1.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
    noiseGain: {
        name: "noiseGain", // if this does not work, try controlChange 2
        label: "Noise Gain",
        value: 0.5,
        min: 0.01,
        max: 1.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
    tonehole: {
        name: "tonehole",
        label: "Tonehole",
        value: 0.2,
        min: 0.01,
        max: 1.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
    vent: {
        name: "vent",
        label: "Vent",
        value: 0.01,
        min: 0.01,
        max: 0.05,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    }, // freq in hZ
    pressure: {
        name: "pressure",
        label: "Pressure",
        value: 0.01,
        min: 0.01,
        max: 1.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
    // startBlowing: {
    //     name: "startBlowing",
    //     label: "Strt Blow",
    //     value: 1.0,
    //     min: 0,
    //     max: 1,
    //     screenInterface: "knob",
    //     fxType: "stk",
    // },
    // stopBlowing: {
    //     name: "stopBlowing",
    //     label: "Stp Blow",
    //     value: 0.5,
    //     min: 0,
    //     max: 1,
    //     screenInterface: "knob",
    //     fxType: "stk",
    // },
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
        value: 0.35,
        min: 0.01,
        max: 2.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
};

export default blowHolePresets;