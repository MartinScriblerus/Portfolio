export const stkVariablePowerADSR = "poweradsr";
export const stkIdentifierPowerADSR = "PowerADSR";

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

const powerADSRPresets = {
    // attack: {
    //     name: "attack",
    //     label: "Attack Dur",
    //     value: 1, // default 1000
    //     min: 1,
    //     max: 2000,
    //     screenInterface: "intspinner",
    //     type: "dur",
    //     group: 4,
    // },
    attackCurve: {
        name: "attackCurve",
        label: "Attack Curve",
        value: 0.5, // default 0.5
        min: 0.01,
        max: 4,
        fxType: "fx",
        screenInterface: "knob",
        type: "float_needsFun_powerADSR",
        group: 4,
    },
    attackTime: { // # of comb filters (default 5)
        name: "attackTime",
        label: "Attack Time",
        value: 1000,
        min: 1,
        max: 2000,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "dur_needsFun_powerADSR",
        group: 4,
    },
    // decay: {
    //     name: "decay",
    //     label: "Decay",
    //     value: 0.01,
    //     min: 0.01,
    //     max: 3000,
    //     screenInterface: "knob",
    //     type: "dur",
    //     group: 4,
    // },
    decayCurve: {
        name: "decayCurve",
        label: "Decay Curve",
        value: 1.25, // default 1.25
        min: 0.01,
        max: 3,
        fxType: "fx",
        screenInterface: "knob",
        type: "float_needsFun_powerADSR",
        group: 4,
    },
    decayTime: {
        name: "decayTime",
        label: "Decay Time",
        value: 1000, // 1000 ms default
        min: 1,
        max: 2000,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "dur_needsFun_powerADSR",
        group: 4,
    },
    // release: {
    //     name: "release",
    //     label: "Release",
    //     value: 0.01,
    //     min: 0.01,
    //     max: 2000,
    //     screenInterface: "knob",
    //     type: "dur",
    //     group: 4,
    // },
    releaseCurve: {
        name: "releaseCurve",
        label: "Release Curve",
        value: 1.5, // default 1.5
        min: 0.01,
        max: 3,
        fxType: "fx",
        screenInterface: "knob",
        type: "float_needsFun_powerADSR",
        group: 4,
    },
    releaseTime: {
        name: "releaseTime",
        label: "Release Time",
        value: 1000,
        min: 1,
        max: 2000,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "dur_needsFun_powerADSR",
        group: 4,
    },
    sustainLevel: {
        name: "sustainLevel",
        label: "Sustain Level",
        value: 0.5, // default 0.8
        min: 0.01,
        max: 1,
        fxType: "fx",
        screenInterface: "knob",
        type: "float_needsFun_powerADSR",
        group: 4,
    },
    // quantizeAttackTime: {
    //     name: "quantizeAttackTime",
    //     label: "Quant Attack",
    //     value: 0, // default 0.8
    //     min: 0,
    //     max: 7,
    //     screenInterface: "knob",
    //     type: "float_needsFun_powerADSR",
    //     group: 4,       
    // },
    // quantizeReleaseTime: {
    //     name: "quantizeReleaseTime",
    //     label: "Quant Release",
    //     value: 0, // default 0.8
    //     min: 0,
    //     max: 7,
    //     screenInterface: "knob",
    //     type: "float_needsFun_powerADSR",
    //     group: 4,
    // },
    // quantizationOn: {
    //     name: "quantizationOn",
    //     label: "Quantize On",
    //     value: 0, // default 0.8
    //     min: 0,
    //     max: 1,
    //     screenInterface: "intspinner",
    //     type: "int_needsFun_powerADSR",
    //     group: 4,
    // }
};

export default powerADSRPresets;