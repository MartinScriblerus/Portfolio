export const stkVariableBeeThree = "beethree";
export const stkIdentifierBeeThree = "BeeThree";

const beeThreePresets = {
    controlOne: {
        name: "controlOne", // if this does not work, try controlChange 2
        label: "Operator 4 Feedback",
        value: 0.5,
        min: 0.01,
        max: 1.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
    controlTwo: {
        name: "controlTwo", // if this does not work, try controlChange 2
        label: "Operator 3 Gain",
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
        value: 0.0,
        min: 0.0,
        max: 1.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    }, // freq in hZ
    lfoDepth: {
        name: "lfoDepth",
        label: "LFO Depth",
        value: 0.2,
        min: 0.01,
        max: 1.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
    gain: {
        name: "gain",
        label: "Gain",
        value: 0.5,
        min: 0.01,
        max: 1.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    }
};

export default beeThreePresets;