export const stkVariableBandedWg = "wg";
export const stkIdentifierBandedWg = "BandedWg";

const bandedWGPresets = {
    // bowPressure: {
    //     name: "bowPressure",
    //     label: "Bow Pressure",
    //     value: 0.01,
    //     min: 0.0,
    //     max: 0.1,
    //     screenInterface: "knob",
    // },
    bowMotion: {
        name: "bowMotion",
        label: "Bow Motion",
        value: 0.9,
        min: 0.01,
        max: 1.0,
        screenInterface: "intspinner",
        fxType: "stk",
    },
    bowRate: {
        name: "bowRate",
        label: "Bow Rate",
        value: 0.01,
        min: 0.0,
        max: 1.0,
        screenInterface: "float",
        fxType: "stk",
    },
    strikePosition: {
        name: "strikePosition",
        label: "Strike Pos",
        value: 0.2,
        min: 0.01,
        max: 1,
        screenInterface: "knob",
        fxType: "stk",
    }, // rate in seconds
    // integrationConstant: {
    //     name: "integrationConstant",
    //     label: "Integration Constant",
    //     value: 0.5,
    //     min: 0.01,
    //     max: 1.0,
    //     screenInterface: "knob",
    // }, // freq in hZ
    // modesGain: {
    //     name: "modesGain",
    //     label: "Modes Gain",
    //     value: 2.0,
    //     min: 0.0,
    //     max: 4.0,
    //     screenInterface: "knob",
    // },
    gain: {
        name: "gain",
        label: "Gain",
        value: 16.0,
        min: 0.0,
        max: 32.0,
        screenInterface: "knob",
        fxType: "stk",
    },
    preset: { // 0 -> uniform bar / 1 -> Tuned Bar / 2 -> Glass Harmonica  3 -> Tibetan Bowl
        name: "preset",
        label: "Preset",
        value: 2,
        min: 0,
        max: 3,
        screenInterface: "intspinner",
        fxType: "stk",
    },
    pluck: {
        name: "pluck",
        label: "Pluck",
        value: 0.5,
        min: 0.01,
        max: 1.0,
        screenInterface: "knob",
        fxType: "stk",
    },
    startBowing: {
        name: "startBowing",
        label: "Start Bowing",
        value: 1,
        min: 0,
        max: 7,
        screenInterface: "intspinner",
        fxType: "stk",
    },
    stopBowing: {
        name: "stopBowing",
        label: "Stop Bowing",
        value: 1,
        min: 0,
        max: 7,
        screenInterface: "intspinner",
    },
    // noteOn: {
    //     name: "noteOn",
    //     label: "Note On",
    //     value: 1,
    //     min: 1,
    //     max: 1,
    //     screenInterface: "intspinner",
    // },

    // reverb: {
    //     name: "reverb",
    //     label: "Reverb",
    //     value: 5,
    //     min: 0,
    //     max: 100,
    //     screenInterface: "knob",
    // }, // reverb amount (0-100)
};

export default bandedWGPresets;