export const stkVariableFrencHrn = "f";
export const stkIdentifierFrencHrn = "FrencHrn";

const frencHrnPresets = {
    controlOne: {
        name: "controlOne",
        label: "Mod Index",
        value: 0.87,
        min: 0.01,
        max: 2.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
    controlTwo: {
        name: "controlTwo",
        label: "Mod Crossfade",
        value: 1.4,
        min: 0.01,
        max: 4.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
    lfoSpeed: {
        name: "lfoSpeed",
        label: "LFO Rate",
        value: 0.2,
        min: 0.01,
        max: 1.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
    lfoDepth: {
        name: "lfoDepth",
        label: "LFO Depth",
        value: 1.7,
        min: 0.01,
        max: 2.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
    gain: {
        name: "gain",
        label: "Gain",
        value: 1.0,
        min: 0.01,
        max: 2.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
};

export default frencHrnPresets;