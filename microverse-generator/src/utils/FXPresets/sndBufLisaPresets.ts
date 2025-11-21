export const stkVariableSndBuf = "sndbuf";
export const stkIdentifierSndBuf = "SndBuf";
export const stkVariableLisa = "lisa";
export const stkIdentifierLisa = "LiSa";

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
            // 8. Samples



const sndBufPresets = {
    pos: { //  
        name: "pos",
        label: "Start Pos",
        value: 0,
        min: 0,
        max: 1,
        fxType: "fx",
        screenInterface: "knob",
        type: "float",
        group: 8,
    },
    duration: { //  
        name: "duration",
        label: "Duration",
        value: 0,
        min: 0,
        max: 1,
        fxType: "fx",
        screenInterface: "knob",
        type: "float",
        group: 8,
    },
    rate: { //  
        name: "rate",
        label: "Rate",
        value: 1.0,
        min: 0.001,
        max: 1.0,
        fxType: "fx",
        screenInterface: "knob",
        type: "float",
        group: 8,
    },
    randomRateOn: { //  
        name: "randomRateOn",
        label: "Random Rate On",
        value: 0,
        min: 0,
        max: 1,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "int",
        group: 8,
    },
    randomRateMax: { // 
        name: "rateMax",
        label: "Rate Max",
        value: 1.0,
        min: 0.001,
        max: 1.0,
        fxType: "fx",
        screenInterface: "knob",
        type: "float",
        group: 8,
    },
    randomRateMin: {
        name: "rateMin",
        label: "Rate Min",
        value: 1.0,
        min: 0.001,
        max: 1.0,
        fxType: "fx",
        screenInterface: "knob",
        type: "float",
        group: 8,
    },
    loop: { //  
        name: "loop",
        label: "Loop",
        value: 0,
        min: 0,
        max: 1,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "int",
        group: 8,
    },
    freq: { //  
        name: "freq",
        label: "Freq",
        value: 1.0,
        min: 0.001,
        max: 2,
        fxType: "fx",
        screenInterface: "knob",
        type: "float",
        group: 8,
    },
}

export const lisaPresets = {
    bi: {
        name: "bi",
        label: "Bidir",
        value: 0,
        min: 0,
        max: 1,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "int_int", // voice / val
        group: 8,
    },
    duration_perc: {
        name: "duration_perc",
        label: "Dur Perc",
        value: 0, // measured in hZ
        min: 0,
        max: 1,
        fxType: "fx",
        screenInterface: "knob",
        type: "float_float",
        group: 8,
    },
    startPos: {
        name: "startPos",
        label: "Start Pos",
        value: 0.0,
        min: 0.0,
        max: 1.0,
        fxType: "fx",
        screenInterface: "knob",
        type: "float_float",
        group: 8,
    },
    feedback: {
        name: "feedback",
        label: "Feedback",
        value: 0.0,
        min: 0.0,
        max: 1.0,
        fxType: "fx",
        screenInterface: "knob",
        type: "float",
        group: 8,
    },
    loop: {
        name: "loop", // voice / val
        label: "Loop",
        value: 0.0,
        min: 0.0,
        max: 1.0,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "int_int",
        group: 8,
    },
    loopStart: {
        name: "loopStart",
        label: "Loop Start",
        value: 0.0,
        min: 0.0,
        max: 1.0,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "int_dur",
        group: 8,
    },
    pan: {
        name: "pan",
        label: "Pan",
        value: 0.5,
        min: 0.0,
        max: 1.0,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "int_int",
        group: 8,
    },
    record: {
        name: "record",
        label: "Record",
        value: 0.0,
        min: 0.0,
        max: 1.0,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "int_int",
        group: 8,
    },
    track: {
        name: "track",
        label: "Track",
        value: 0.0,
        min: 0.0,
        max: 2.0,
        fxType: "fx",
        screenInterface: "intspinner",
        type: "int_int",
        group: 8,
    },
    voiceGain: {
        name: "voiceGain",
        label: "Voice Gain",
        value: 0.0,
        min: 0.0,
        max: 3.0,
        fxType: "fx",
        screenInterface: "knob",
        type: "float_float",
        group: 8,
    },
};

export default sndBufPresets;