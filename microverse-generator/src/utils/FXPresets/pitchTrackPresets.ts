export const stkVariablePitchTrack = "pittrack";
export const stkIdentifierPitchTrack = "PitchTrack";

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

const pitchTrackPresets = {
    bias: {
        name: "bias",
        label: "Bias",
        value: 0,
        min: 0,
        max: 1,
        fxType: "fx",
        screenInterface: "knob",
        type: "float_float",
        group: 6,
    },
    fidelity: {
        name: "fidelity",
        label: "Fidelity",
        value: 0.95,
        min: 0,
        max: 1,
        fxType: "fx",
        screenInterface: "knob",
        type: "float_float",
        group: 6,
    },
    frame: {
        name: "frame",
        label: "Frame",
        value: 2, // (necessary clarification => 2 should actually equal 2 ^ (12 - 2) => 1024)
        min: 0,
        max: 12, // this will be exponent for powers of 2 (0 - 4096)
        fxType: "fx",
        screenInterface: "exponentialintspinner",
        type: "int",
        group: 6,
    },
    overlap: {
        name: "overlap",
        label: "Overlap",
        value: 2,
        min: 0,
        max: 6,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "int",
        group: 6,
    },
    sensitivity: {
        name: "sensitivity",
        label: "Sensitivity",
        value: 0.003,
        min: 0,
        max: 1,
        fxType: "fx",
        screenInterface: "knob",
        type: "float",
        group: 6,
    },
};

export default pitchTrackPresets;