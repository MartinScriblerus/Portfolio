export const stkVariableExpEnv = "expenv";
export const stkIdentifierExpEnv = "ExpEnv";

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

const expEnvPresets = {
    T60: {
        name: "T60",
        label: "T60",
        value: 0,
        min: -3,
        max: 3,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "dur_needsFun_expEnv",
        group: 7,
    },
    radius: {
        name: "radius",
        label: "Radius",
        value: 0.9,
        min: 0.5,
        max: 1,
        fxType: "fx",
        screenInterface: "knob",
        type: "float_needsFun_expEnv",
        group: 7,
    },
    value: {
        name: "value",
        label: "Value",
        value: 0,
        min: 0,
        max: 7,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "float_needsFun_expEnv",
        group: 7,
    },
};

export default expEnvPresets;