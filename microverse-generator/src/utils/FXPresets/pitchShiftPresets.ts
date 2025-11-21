export const stkVariablePitShift = "pitShift";
export const stkIdentifierPitShift = "PitShift";

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

export const pitShiftPresets = {
    mix: {
        name: "mix",
        label: "Mix",
        value: 0,
        min: 0,
        max: 1,
        fxType: "fx",
        screenInterface: "knob",
        type: "float",
        group: 2,
    },
    shift: {
        name: "shift",
        label: "Shift",
        value: 6, // need to translate this to center of -6 0 6
        min: 0,
        max: 12,
        fxType: "fx",
        screenInterface: "knob", // new type needed?
        type: "float",
        group: 2,
    },
};

export default pitShiftPresets;