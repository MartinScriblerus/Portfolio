export const stkVariableStifKarp = "m";
export const stkIdentifierStifKarp = "StifKarp";

const stifKarpPresets = {
    pickupPosition: {
        name: "pickupPosition",
        label: "Pickup Position",
        value: 0.20,
        min: 0.01,
        max: 1.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
    sustain: {
        name: "sustain",
        label: "Sustain",
        value: 0.76,
        min: 0.01,
        max: 1.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    }, 
    stretch: {
        name: "stretch",
        label: "Stretch",
        value: 0.49,
        min: 0.01,
        max: 1.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
    pluck: {
        name: "pluck",
        label: "Pluck",
        value: 1.0,
        min: 0.01,
        max: 1.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
    baseLoopGain: {
        name: "baseLoopGain",
        label: "Loop Gain",
        value: 0.97,
        min: 0.8,
        max: 2.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    }, 
    gain: {
        name: "gain",
        label: "Gain",
        value: 0.8,
        min: 0.01,
        max: 2.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    }, 
};

export default stifKarpPresets;