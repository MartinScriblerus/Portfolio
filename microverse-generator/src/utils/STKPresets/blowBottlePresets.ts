export const stkVariableBlowBotl = "blwbtl";
export const stkIdentifierBlowBotl = "BlowBtl";

const blowBotlPresets = {
    noiseGain: {
        name: "noiseGain", // if this does not work, try controlChange 2
        label: "Noise Gain",
        value: 0.2,
        min: 0.01,
        max: 1.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
    vibratoFreq: {
        name: "vibratoFreq",
        label: "Vibr Freq",
        value: 11,
        min: 0,
        max: 2000,
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
    rate: {
        name: "rate",
        label: "Rate",
        value: 0.2,
        min: 0.01,
        max: 2.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    }, // rate in seconds
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
        value: 0.5,
        min: 0.01,
        max: 1.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
    gain: {
        name: "gain",
        label: "Gain",
        value: 3.0,
        min: 0.0,
        max: 6.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
};

export default blowBotlPresets;