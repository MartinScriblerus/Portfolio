export const stkVariableExpDelay = "expDelay";
export const stkIdentifierExpDelay = "ExpDelay";

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

const expDelayPresets = {
    ampcurve: {
        name: "ampcurve",
        label: "Amp Curve",
        value: 1.0,
        min: 0.5,
        max: 2.0,
        fxType: "fx",
        screenInterface: "knob",
        type: "float_needsFun_expDelay",
        group: 1,
    },
    delay: {
        name: "delay",
        label: "Delay",
        value: 0,
        min: 0,
        max: 7,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "dur_needsFun_expDelay",
        group: 1,
    },
    durcurve: {
        name: "durcurve",
        label: "Dur Curve",
        value: 1.0,
        min: 0.1,
        max: 2.0,
        fxType: "fx",
        screenInterface: "knob",
        type: "float_needsFun_expDelay",
        group: 1,
    },
    // max: {
    //     name: "max",
    //     label: "Exp Del Max",
    //     value: 6000,
    //     min: 200,
    //     max: 6000,
    //     screenInterface: "intspinner",
    //     type: "dur",
    //     group: 1,
    // },
    mix: {
        name: "mix",
        label: "Exp Del Mix",
        value: 0.8,
        min: 0.01,
        max: 1.0,
        fxType: "fx",
        screenInterface: "knob",
        type: "float_needsFun_expDelay",
        group: 1,
    },
    reps: {
        name: "reps",
        label: "Del Reps",
        value: 4,
        min: 0,
        max: 32,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "int_needsFun_expDelay",
        group: 1,
    },
    gain: {
        name: "gain",
        label: "Gain",
        value: 0.01,
        min: 0.0,
        max: 12.0,
        fxType: "fx",
        screenInterface: "knob",
        type: "float_needsFun_expDelay",
        group: 1,
    },
};

export default expDelayPresets;