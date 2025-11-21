export const stkVariableBitcrusher = "bitcrusher";
export const stkIdentifierBitcrusher = "Bitcrusher";

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

const bitcrusherPresets = {
    bits: {
        name: "bits", // 1-32
        label: "Bits",
        value: 8,
        min: 1,
        max: 32,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "int_int",
        group: 0,
    },
    downsample: {
        name: "downsample",  // >= 1
        label: "Downsample",
        value: 1,
        min: 1,
        max: 32,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "int_int",
        group: 0,
    },
    downsampleFactor: {
        name: "downsampleFactor",
        label: "Downsample Factor",
        value: 1,
        min: 1,
        max: 32,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "int_int",
        group: 0,
    }
};

export default bitcrusherPresets;