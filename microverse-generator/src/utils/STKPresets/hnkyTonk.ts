export const stkVariableHnkyTonk = "hnkytonk";
export const stkIdentifierHnkyTonk = "HnkyTonk";

const hnkyTonkPresets = { 
    controlOne: { // Make sure to SET on code side (see ChucK reference)
        name: "controlOne",
        label: "Control One",
        value: 0.50,
        min: 0.01,
        max: 1.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
    controlTwo: { // Make sure to SET on code side (see ChucK reference)
        name: "controlTwo",
        label: "Control Two",
        value: 0.5,
        min: 0.01,
        max: 1.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
    lfoSpeed: {
        name: "lfoSpeed",
        label: "LFO Speed",
        value: 11.0,
        min: 0.0,
        max: 12.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    }, // freq in hZ
    lfoDepth: {
        name: "lfoDepth",
        label: "LFO Depth",
        value: 1.0,
        min: 0.0,
        max: 12.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
    gain: {
        name: "gain",
        label: "Gain",
        value: 1.0,
        min: 0.0,
        max: 2.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    }
};

export default hnkyTonkPresets;