export const stkVariableAmbPan3 = "ambPan3";
export const stkIdentifierAmbPan3 = "AmbPan3";

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

const ambPan3Presets = {
    azimuth: {
        name: "azimuth",
        label: "Azimuth",
        value: 2, // (necessary clarification => 2 should actually equal 2 ^ (12 - 2) => 1024)
        min: 0,
        max: 11, // this will be exponent for powers of 2 (0 - 4096)
        fxType: "fx",
        screenInterface: "intspinnerReverseVals", // should this be a float knob? this should go in reverse because larger values are actually smaller
        type: "int",
        group: 2,
    },
    elevation: {
        name: "elevation",
        label: "Elevation",
        value: 3, // (clarification much like above [a bit tricky!] => this 3 should equal 2 ^ (12 - 3) => 512)
        min: 0,
        max: 11,
        fxType: "fx",
        screenInterface: "intspinnerReverseVals", // should this be a float knob? see above on reverse vals
        type: "int",
        group: 2,
    },
    // channelMap: {
    //     name: "channelMap", // probably won't be implemented by default
    //     label: "Channel Map",
    //     value: [0,1,2,7,8,9,10,3,4,11,12,13,14,15,5,6],
    //     min: 0,
    //     max: 0,
    //     screenInterface: "arrayinterface",
    //     type: "array_int",
    //     group: 2,
    // }
};

export default ambPan3Presets;