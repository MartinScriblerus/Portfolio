export const stkVariableMandolin = "man";
export const stkIdentifierMandolin = "Mandolin";

const mandolinPresets = { // .clair
    bodySize: {
        name: "bodySize",
        label: "Body Size",
        value: 0.5,
        min: 0.01,
        max: 1.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    }, // lfo gain 
    pluckPos: {
        name: "pluckPos",
        label: "Pluck Position",
        value: 0.7,
        min: 0.01,
        max: 1.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    }, // lfo pitch
    stringDamping: {
        name: "stringDamping",
        label: "String Damping",
        value: 0.2,
        min: 0.01,
        max: 1.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    }, // lfo voice 
    stringDetune: {
        name: "stringDetune",
        label: "String Detune",
        value: 0.0,
        min: 0.0,
        max: 1.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    }, // offset (controls note offset in semitones)
    pluck: {
        name: "pluck",
        label: "Pluck",
        value: 0.2,
        min: 0.01,
        max: 1.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    }, // filter cutoff amount (0-100)
   gain: {
        name: "gain",
        label: "Gain",
        value: 0.5,
        min: 0.01,
        max: 2.0,
        screenInterface: "knob",
        fxType: "stk",
        type: "float",
    },
};

export default mandolinPresets;