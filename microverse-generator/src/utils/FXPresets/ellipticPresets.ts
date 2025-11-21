export const stkVariableElliptic = "elliptic";
export const stkIdentifierElliptic = "Elliptic";

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

const ellipticPresets = {
    lowFilter: {
        name: "lowFilter",
        label: "Low Filter",
        value: 100,
        min: 1,
        max: 1200,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "int_needsFun_elliptic",
        group: 5,
    },
    midFilter: {
        name: "midFilter",
        label: "Mid Filter",
        value: 300,
        min: 1,
        max: 1200,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "int_needsFun_elliptic",
        group: 5,
    },
    highFilter: {
        name: "highFilter",
        label: "High Filter",
        value: 450,
        min: 1,
        max: 1200,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "int_needsFun_elliptic",
        group: 5,
    },
    atten: {
        name: "atten",
        label: "Attenuation",
        value: 80.00,
        min: 0.0,
        max: 100.0,
        fxType: "fx",
        screenInterface: "knob",
        type: "float_needsFun_elliptic",
        group: 5,
    },
    ripple: {
        name: "ripple",
        label: "Ripple",
        value: 10.00, // measured in dB—default 0.2
        min: 0.00,
        max: 12.0,
        fxType: "fx",
        screenInterface: "knob",
        type: "float_needsFun_elliptic",
        group: 5,
    },
    filterMode: {
        name: "filterMode", // 0 -> bpf / 1 -> lpf / 2 -> hpf
        label: "Filter Mode", // 0 -> bpf / 1 -> lpf / 2 -> hpf
        value: 0, // 0 -> bpf / 1 -> lpf / 2 -> hpf
        min: 0, 
        max: 2,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "int_needsFun_elliptic",
        group: 5,
    }
};

export default ellipticPresets;