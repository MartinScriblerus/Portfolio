export const stkVariablePercFlut = "percFlut";
export const stkIdentifierPercFlut = "PercFlut";

const percFlutPresets = {
    controlOne: {
        name: "controlOne",
        label: "Modulator Index",
        value: 2,
        min: 0,
        max: 2,
        screenInterface: "intSpinner",
        fxType: "stk",
        type: "int",
    },
    controlTwo: {
        name: "controlTwo",
        label: "Modulator Crossfade",
        value: 1,
        min: 0,
        max: 4,
        screenInterface: "intSpinner_5",
        fxType: "stk",
        type: "int",
    },
    lfoSpeed: {
        name: "lfoSpeed",
        label: "LFO Speed",
        value: 0.4,
        min: 0.01,
        max: 1.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
    lfoDepth: {
        name: "lfoDepth",
        label: "LFO Depth",
        value: 0.18,
        min: 0.01,
        max: 2.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
    gain: {
        name: "gain",
        label: "Gain",
        value: 0.6,
        min: 0.01,
        max: 2.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
};

export default percFlutPresets;