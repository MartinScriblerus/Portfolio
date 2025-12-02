export const stkVariableVoicForm = "voic";
export const stkIdentifierVoicForm = "VoicForm";
export const phonemes = ["eee",  "ihh",  "ehh",  "aaa", 
"ahh",  "aww",  "ohh",  "uhh", 
"uuu",  "ooo",  "rrr",  "lll", 
"mmm",  "nnn",  "nng",  "ngg", 
"fff",  "sss",  "thh",  "shh", 
"xxx",  "hee",  "hoo",  "hah", 
"bbb",  "ddd",  "jjj",  "ggg", 
"vvv",  "zzz", "thz",  "zhh" ];

const voicFormPresets = {
    phonemeNum: {
        name: "phonemeNum",
        label: "Phoneme",
        value: 3,
        min: 0,
        max: 127,
        screenInterface: "intSpinner",
        fxType: "stk",
        type: "int",
    },
    // speak: {
    //     name: "speak",
    //     label: "Speak",
    //     value: 1,
    //     min: 0,
    //     max: 1,
    //     screenInterface: "knob",
    //     fxType: "stk",
    // },
    // quiet: {
    //     name: "quiet",
    //     label: "Quiet",
    //     value: 0.8,
    //     min: 0,
    //     max: 1,
    //     screenInterface: "knob",
    //     fxType: "stk",
    // },
    // vibratoFreq: {
    //     name: "vibratoFreq",
    //     label: "Vibr Freq",
    //     value: 440,
    //     min: 0,
    //     max: 1200,
    //     screenInterface: "knob",
    //     fxType: "stk",
    // }, // freq in hZ
    vibratoGain: {
        name: "vibratoGain",
        label: "Vibr Gain",
        value: 0.4,
        min: 0.01,
        max: 1.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
    gain: {
        name: "gain",
        label: "Gain",
        value: 0.8,
        min: 0.01,
        max: 1.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
};

export default voicFormPresets;