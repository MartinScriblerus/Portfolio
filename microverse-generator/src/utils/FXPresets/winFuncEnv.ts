export const stkVariableWinFuncEnv = "winfuncenv";
export const stkIdentifierWinFuncEnv = "WinFuncEnv";

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
    // 0 => Blackman();
    // 1 => BlackmanHarris();
    // 2 => BlackmanNutall();
    // 3 => Exponential();
    // 4 => Hann();
    // 5 => HannPoisson();
    // 6 => Nutall();
    // 7 => Parzen();
    // 8 => Poisson();
    // 9 => Sigmoid();
    // 10 => Tukey();
    // 11 => Welch();

const winFuncEnvPresets = {
    releaseTime: {
        name: "releaseTime",
        label: "Release Time",
        value: 3,
        min: 0,
        max: 7,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "dur_needsFun_winFuncEnv",
        group: 8,
    },
    attackTime: {
        name: "attackTime",
        label: "Attack Time",
        value: 3,
        min: 0,
        max: 7,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "dur_needsFun_winFuncEnv",
        group: 8,
    },
    envSetting: {
        name: "envSetting",
        label: "Env Setting",
        value: 0,
        min: 0,
        max: 11,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "dur_needsFun_winFuncEnv",
        group: 8,
    },
};

export default winFuncEnvPresets;