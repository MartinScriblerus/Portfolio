export const stkVariableSpectacle= "spectacle";
export const stkIdentifierSpectacle = "Spectacle";

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

const spectaclePresets = {
    bands: {
        name: "bands",
        label: "Bands",
        value: 5, // default 20
        min: 0,
        max: 8,
        fxType: "fx",
        screenInterface: "intspinner", // power of two exponent
        type: "int_needsFun_spectacle",
        group: 7,
    },
    delay: {
        name: "delay",
        label: "Delay",
        value: 3,
        min: 0,
        max: 7,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "dur_needsFun_spectacle",
        group: 7,
    },
    eq: { 
        name: "eq",
        label: "EQ",
        value: 0,
        min: 0,
        max: 85,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "int_needsFun_spectacle",
        group: 7,
    },
    feedback: {
        name: "feedback",
        label: "Feedback",
        value: 0.8, // => this should be 0 for -1 to 1 range
        min: -1,
        max: 1,
        fxType: "fx",
        screenInterface: "knob", // need a knob for -1 0 1
        type: "float_needsFun_spectacle",
        group: 7,
    },
    fftlen: {
        name: "fftlen",
        label: "FFT Len",
        value: 3, // 512 here... see powers of 2
        min: 0,
        max: 8, // this will be exponent for powers of 2
        fxType: "fx",
        screenInterface: "intspinner", // should this be a float knob?
        type: "int_needsFun_spectacle",
        group: 7,
    },
    freqMax: { 
        name: "freqMax",
        label: "Freq Max",
        value: 4100,
        min: 1,
        max: 5000,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "int_needsFun_spectacle",
        group: 7,
    },
    freqMin: {
        name: "freqMin",
        label: "Freq Min",
        value: 100,
        min: 1,
        max: 600,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "int_needsFun_spectacle",
        group: 7,
    },
    mix: { // # of comb filters (default 5)
        name: "mix",
        label: "Mix",
        value: 0.8,
        min: 0.01,
        max: 1.0,
        fxType: "fx",
        screenInterface: "knob",
        type: "float_needsFun_spectacle",
        group: 7,
    },
    overlap: { // # of comb filters (default 5)
        name: "overlap",
        label: "Overlap",
        value: 3,
        min: 2,
        max: 6,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "int_needsFun_spectacle",
        group: 7,
    },
   
    // Set "delay", “eq”, or "feedback" tables to the types "random", "ascending", or "descending." Example: table("delay", "random")
    // =================================================================================================
    table: { // # of comb filters (default 5)
        name: "table",
        label: "Table",
        value: 2,
        min: 0, // 0-2 desc / 3 - 5 random / 6 - 8 asc (for all 3 types) 
        max: 8,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "int_needsFun_spectacleTable_spectacle",
        group: 7,
    },
};

export default spectaclePresets;