export const stkVariableADSR = "adsr";
export const stkIdentifierADSR = "ADSR";

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

const adsrPresets = {
    attackRate: {
        name: "attackRate",
        label: "Attack Rate",
        value: 0.50,
        min: 0.01,
        max: 1,
        screenInterface: "knob",
        type: "float",
        group: 4,
    },
    attackTime: {
        name: "attackTime",
        label: "Attack Time",
        value: 0.01,
        min: 0.01,
        max: 4000,
        screenInterface: "knob",
        type: "dur", 
        group: 4,
    },
    decayRate: {
        name: "decayRate",
        label: "Decay Rate",
        value: 0.01,
        min: 0,
        max: 1,
        screenInterface: "knob",
        type: "float",
        group: 4,
    },
    decayTime: {
        name: "decayTime",
        label: "Decay Time",
        value: 0.001,
        min: 0.001,
        max: 2000,
        screenInterface: "knob",
        type: "dur",
        group: 4,
    },
    releaseRate: {
        name: "releaseRate",
        label: "Release Rate",
        value: 0.001,
        min: 0.001,
        max: 1,
        screenInterface: "knob",
        type: "float",
        group: 4,
    },
    releaseTime: {
        name: "releaseTime",
        label: "Release Time",
        value: 0.01,
        min: 0.01,
        max: 2000,
        screenInterface: "knob",
        type: "dur",
        group: 4,
    },
    sustainLevel: {
        name: "sustainLevel",
        label: "Sustain Level",
        value: 0.01,
        min: 0.01,
        max: 1,
        screenInterface: "knob",
        type: "float",
        group: 4,
    },
};

export default adsrPresets;