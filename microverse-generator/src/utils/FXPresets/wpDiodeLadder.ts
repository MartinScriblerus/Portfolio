export const stkVariableWPDiodeLadder = "wpdiodeladder";
export const stkIdentifierWPDiodeLadder = "WPDiodeLadder";

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

const wpDiodeLadderPresets = {
    cutoff: {
        name: "cutoff",
        label: "Cutoff",
        value: 0.01,
        min: 0.01,
        max: 0.30,
        fxType: "fx",
        screenInterface: "knob",
        type: "float_needsFun_diodeladder",
        group: 5,
    },
    nlp_type: {
        name: "nlp_type",
        label: "NLP Type",
        value: 1,
        min: 0,
        max: 1,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "int_needsFun_diodeladder",
        group: 5,
    },
    nonlinear: {
        name: "nonlinear",
        label: "Nonlinear",
        value: 0,
        min: 0,
        max: 1,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "int_needsFun_diodeladder",
        group: 5,
    },
    resonance: {
        name: "resonance",
        label: "Resonance",
        value: 17,
        min: 0,
        max: 17,
        fxType: "fx",
        screenInterface: "knob",
        type: "float_needsFun_diodeladder",
        group: 5,
    },
    saturation: {
        name: "saturation",
        label: "Saturation",
        value: 0.1,
        min: 0.01,
        max: 1.0,
        fxType: "fx",
        screenInterface: "knob",
        type: "float_needsFun_diodeladder",
        group: 5,
    },
};

export default wpDiodeLadderPresets;