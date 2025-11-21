export const stkVariableBowed = "bow";
export const stkIdentifierBowed = "Bowed";

const bowedPresets = {
    bowPressure: {
        name: "bowPressure", // if this does not work, try controlChange 2
        label: "Bow Pressure",
        value: 0.5,
        min: 0.01,
        max: 1.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
    bowPosition: {
        name: "bowPosition", // if this does not work, try controlChange 2
        label: "Bow Position",
        value: 0.5,
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
        max: 1000,
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
    startBowing: {
        name: "startBowing",
        label: "Start Bowing",
        value: 1.0,
        min: 0.01,
        max: 1.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
    stopBowing: {
        name: "stopBowing",
        label: "Stop Bowing",
        value: 1.0,
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
        max: 12.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
    // rate: {
    //     name: "rate",
    //     label: "Rate",
    //     value: 0.2,
    //     min: 0,
    //     max: 2,
    //     screenInterface: "knob",
    // }, // rate in seconds
    // reverb: {
    //     name: "reverb",
    //     label: "Reverb",
    //     value: 5,
    //     min: 0,
    //     max: 100,
    //     screenInterface: "knob",
    // }, // reverb amount (0-100)
};

export default bowedPresets;