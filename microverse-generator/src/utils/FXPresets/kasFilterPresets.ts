export const stkVariableKasFilter = "kasfilter";
export const stkIdentifierKasFilter = "KasFilter";

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

const kasFilterPresets = {
    accent: { // waveshape the crossfading sine 
        name: "accent",
        label: "Accent",
        value: 0,
        min: 0,
        max: 1,
        fxType: "fx",
        screenInterface: "knob",
        type: "float_float",
        group: 5,
    },
    freq: {
        name: "freq",
        label: "Frequency",
        value: 0, // measured in hZ
        min: 0,
        max: 1200,
        screenInterface: "knob",
        type: "float_float",
        group: 5,
    },
    resonance: {
        name: "resonance",
        label: "Resonance",
        value: 0,
        min: 0,
        max: 0.95,
        screenInterface: "knob",
        type: "float_float",
        group: 5,
    },
};

export default kasFilterPresets;