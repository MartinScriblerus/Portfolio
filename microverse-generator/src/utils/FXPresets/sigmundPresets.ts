export const stkVariableSigmund = "sigmund";
export const stkIdentifierSigmund = "Sigmund";

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

const sigmundPresets = {
    // amp: {
    //     name: "amp",
    //     label: "Amp",
    //     value: 0,
    //     min: 0,
    //     max: 12,
    //     screenInterface: "intspinner",
    //     type: "float_int",
    //     group: 6,
    // },
    maxfreq: {
        name: "maxfreq",
        label: "Max Freq",
        value: 128,
        min: 0,
        max: 128, // freq measured as MIDI vals here
        fxType: "fx",
        screenInterface: "knob",
        type: "float_float",
        group: 6,
    },
    minpower: {
        name: "minpower",
        label: "Min Power",
        value: 50,
        min: 1,
        max: 85,
        fxType: "fx",
        screenInterface: "knob",
        type: "float_float",
        group: 6,
    },
    npeak: {
        name: "npeak",
        label: "N Peak",
        value: 9,
        min: 0,
        max: 11, // this will be exponent for powers of 2 (0 - 4096)
        fxType: "fx",
        screenInterface: "exponentialintspinner", // should this be a float knob?
        type: "int_int",
        group: 6,
    },
    npts: {
        name: "npts",
        label: "N Pts",
        value: 7, // (necessary clarification => 2 should actually equal 2 ^ (10 + 1) => 2048)
        min: 6,
        max: 11, // this will be exponent for powers of 2 (0 - 4096)
        fxType: "fx",
        screenInterface: "exponentialintspinner", // should this be a float knob?
        type: "int_int",
        group: 6,
    },
    peak: {
        name: "peak",
        label: "Peak",
        value: 9,
        min: 0,
        max: 11, // this will be exponent for powers of 2 (0 - 4096)
        fxType: "fx",
        screenInterface: "exponentialintspinner", // should this be a float knob?
        type: "int_int",
        group: 6,
    },
    param1: {
        name: "param1",
        label: "Param 1",
        value: 0,
        min: 0,
        max: 1,
        fxType: "fx",
        screenInterface: "knob",
        type: "float_float",
        group: 6,
    },
    param2: {
        name: "param2",
        label: "Param 2",
        value: 0,
        min: 0,
        max: 1,
        fxType: "fx",
        screenInterface: "knob",
        type: "float_float",
        group: 6,
    },
    param3: {
        name: "param3",
        label: "Param 3",
        value: 0,
        min: 0,
        max: 1,
        fxType: "fx",
        screenInterface: "knob",
        type: "float_float",
        group: 6,
    },
    tracks: {
        name: "tracks",
        label: "Tracks",
        value: 0,
        min: 0,
        max: 1,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "int_int", // works like a bool
        group: 6,
    },
};

export default sigmundPresets;