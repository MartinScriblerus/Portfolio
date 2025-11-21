const expEnvHelper = (name: string, value: any, presets: any) => {
    const indexOfNameInPresets = presets.map((i: any) => i.name).indexOf(name);
    const thePreset = presets[indexOfNameInPresets];
    // freq: any, radius: any, T60: any, gain: any, duration: any
    console.log(`%cNAME IN HELPER: ${name} // VAL IN HELPER: ${value} // thePreset: ${thePreset} // PRESETS: ${presets}`, 'color: yellow;');
    return `
    1000 => s.freq;
    0.999 => expenv_osc1.radius;

    100*ms => eenv.T60;  1 => expenv_osc1.keyOn;  second => now;
    second => eenv.T60;  1 => expenv_osc1.keyOn;  second => now;
    3*second => eenv.T60; 1 => expenv_osc1.keyOn; 3*second => now;

    while (1)  {
        Math.random2f(0.995,0.9995) => expenv_osc1.radius;
        Math.random2f(0.3,1.0) => expenv_osc1.gain;
        Std.mtof(Math.random2(0,10)*2+72) => s.freq;
        1 => expenv_osc1.keyOn;
        0.1::second => now;
    }
    `
};
export default expEnvHelper;