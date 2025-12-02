export const stkVariableHevyMetl = "hevyMetl";
export const stkIdentifierHevyMetl = "HevyMetl";

const hevyMetlPresets = { 
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
    // lfoSpeed: {
    //     name: "lfoSpeed",
    //     label: "LFO Speed",
    //     value: 1.0,
    //     min: 0.0,
//     max: 12.0,
    //     screenInterface: "knob",
    //     fxType: "stk",
    // }, // freq in hZ
    // lfoDepth: {
    //     name: "lfoDepth",
    //     label: "LFO Depth",
    //     value: 1.0,
    //     min: 0.0,
    //     max: 12.0,
    //     screenInterface: "knob",
    //     fxType: "stk",
    // },
    gain: {
        name: "gain",
        label: "Gain",
        value: 0.5,
        min: 0.0,
        max: 2.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    }
};

export default hevyMetlPresets;