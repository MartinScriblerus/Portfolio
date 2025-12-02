export const stkVariableMulticomb = "multicomb";
export const stkIdentifierMulticomb = "Multicomb";

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

const multicombPresets = {
    maxfreq: {
        name: "maxfreq",
        label: "Max Freq",
        value: 440,
        min: 0,
        max: 880,
        fxType: "fx",
        screenInterface: "knob",
        type: "float_float",
        group: 5,
    },
    minfreq: {
        name: "minfreq",
        label: "Min Freq",
        value: 220,
        min: 0,
        max: 440,
        fxType: "fx",
        screenInterface: "knob",
        type: "float_float",
        group: 5,
    },
    num: { // # of comb filters (default 5)
        name: "num",
        label: "Num Combs",
        value: 5,
        min: 0,
        max: 8,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "int_int",
        group: 5,
    },
    revtime: { // # of comb filters (default 5)
        name: "revtime",
        label: "Rev Time",
        value: 0.5, // default 1000::ms
        min: 0,
        max: 1,
        fxType: "fx",
        screenInterface: "knob",
        type: "dur_dur",
        group: 5,
    },
};

export default multicombPresets;