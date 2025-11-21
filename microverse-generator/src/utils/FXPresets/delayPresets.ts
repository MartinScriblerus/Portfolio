export const stkVariableDelay = "delay";
export const stkIdentifierDelay = "Delay";
export const stkVariableDelayA = "delayA";
export const stkIdentifierDelayA = "DelayA";
export const stkVariableDelayL = "delayL";
export const stkIdentifierDelayL = "DelayL";
export const stkVariableEcho = "echo";
export const stkIdentifierEcho = "Echo";

// Establishing PATTERNS here... 
    // 1.) types split by *** snake case *** require function syntax for getter
    // 2.) types split by *** array -> snake case *** will be followed by array item types (multiple types are allowed)
    // 3.) interface with *** Reverse *** will subtract val from max (thus val 2 === max - 2)
    // 4.) interface intspinner converts to floats ints (already implemented)
    // 5.) knobspinner handles floats (already implemented)
    // 6.) dur values are measured in milliseconds
    // 7.) group name (int -> string) will be used for styling and layout
        // FX Groups Int #s
            // 0. Gain / Distortion
            // 1. Delays / Echos
            // 2. Chorus / Mods / Pans
            // 3. Reverbs
            // 4. ADSRs
            // 5. Filters
            // 6. Pitch Trackers
            // 7. Envelopes

const delayPresets = {
    delay: {
        name: "delay",
        label: "Delay",
        value: 500,
        min: 1,
        max: 6000,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "dur_needsFun_delay_",
        group: 1,
    },
    syncDelay: {
        name: "syncDelay",
        label: "Sync Delay",
        value: 4,
        min: 0,
        max: 7,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "dur_needsFun_delay_sync",
        group: 1,
    },
    lines: {
        name: "lines",
        label: "Delay Lines",
        value: 3,
        min: 1,
        max: 12,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "int_needsFun_delay_delayLines",
        group: 1,
    },
    zero: {
        name: "zero",
        label: "OneZero.zero",
        value: 0.5,
        min: 0.001,
        max: 1.0,
        fxType: "fx",
        screenInterface: "knob",
        type: "float_needsFun_delay_",
        group: 1,
    },
    b0: {
        name: "b0",
        label: "OneZero.b0",
        value: 0.5,
        min: 0.001,
        max: 1.0,
        fxType: "fx",
        screenInterface: "knob",
        type: "float_needsFun_delay_",
        group: 1,
    },
    b1: {
        name: "b1",
        label: "OneZero.b1",
        value: 0.2,
        min: 0.001,
        max: 1,
        fxType: "fx",
        screenInterface: "knob",
        type: "float_needsFun_delay_",
        group: 1,
    },
};

export const delayLPresets = {
    delay: {
        name: "delay",
        label: "Delay",
        value: 500,
        min: 1,
        max: 6000,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "dur_needsFun_delayL_",
        group: 1,
    },
    syncDelay: {
        name: "syncDelay",
        label: "Sync Delay",
        value: 4,
        min: 0,
        max: 7,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "dur_needsFun_delayL_sync",
        group: 1,
    },
    lines: {
        name: "lines",
        label: "Delay Lines",
        value: 3,
        min: 1,
        max: 12,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "int_needsFun_delayL_delayLines",
        group: 1,
    },
    zero: {
        name: "zero",
        label: "OneZero.zero",
        value: 0.5,
        min: 0.001,
        max: 1.0,
        fxType: "fx",
        screenInterface: "knob",
        type: "float_needsFun_delayL_delayLines",
        group: 1,
    },
    b0: {
        name: "b0",
        label: "OneZero.b0",
        value: 0.5,
        min: 0.001,
        max: 1.0,
        fxType: "fx",
        screenInterface: "knob",
        type: "float_needsFun_delayL_delayLines",
        group: 1,
    },
    b1: {
        name: "b1",
        label: "OneZero.b1",
        value: 0.2,
        min: 0.001,
        max: 1,
        fxType: "fx",
        screenInterface: "knob",
        type: "float_needsFun_delayL_delayLines",
        group: 1,
    },
};

export const delayAPresets = {
    delay: {
        name: "delay",
        label: "Delay",
        value: 500,
        min: 1,
        max: 6000,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "dur_needsFun_delayA_",
        group: 1,
    },
    syncDelay: {
        name: "syncDelay",
        label: "Sync Delay",
        value: 4,
        min: 0,
        max: 7,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "dur_needsFun_delayA_sync",
        group: 1,
    },
    lines: {
        name: "lines",
        label: "Delay Lines",
        value: 3,
        min: 1,
        max: 12,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "int_needsFun_delayA_delayLines",
        group: 1,
    },
    zero: {
        name: "zero",
        label: "OneZero.zero",
        value: 0.5,
        min: 0.001,
        max: 1.0,
        fxType: "fx",
        screenInterface: "knob",
        type: "float_needsFun_delayA",
        group: 1,
    },
    b0: {
        name: "b0",
        label: "OneZero.b0",
        value: 0.5,
        min: 0.001,
        max: 1.0,
        fxType: "fx",
        screenInterface: "knob",
        type: "float_needsFun_delayA",
        group: 1,
    },
    b1: {
        name: "b1",
        label: "OneZero.b1",
        value: 0.2,
        min: 0.001,
        max: 1,
        fxType: "fx",
        screenInterface: "knob",
        type: "float_needsFun_delayA",
        group: 1,
    },
};

export const echoPresets = {
    delay: {
        name: "delay",
        label: "Echo",
        value: 10,
        min: 0,
        max: 6000,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "dur",
        group: 1,
    },
    max: {
        name: "max",
        label: "Max",
        value: 10,
        min: 1,
        max: 6000,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "dur",
        group: 1,
    },
    mix: {
        name: "mix",
        label: "Mix",
        value: 0,
        min: 0,
        max: 1,
        fxType: "fx",
        screenInterface: "knob",
        type: "float",
        group: 1,
    },
};

export default delayPresets;