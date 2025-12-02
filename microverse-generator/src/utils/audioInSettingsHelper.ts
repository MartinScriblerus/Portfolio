
// lisaTrigger [listen, length, minimumLength]
// achop [listen, length, minimumLength]
// grain [stretch, rate, length, grains]
// t [delayLength, loop, gain]
// rr [listen, setInfluence, setReverseGain, setMaxBufferLength]
// rei [record, play, voices, speed, bi, random, spread]

import { create } from 'zustand';

type AudioInSettings = { [key: string]: number };

const defaultAudioInSettings: AudioInSettings = {
        // 'grain_stretch': 1.0,
        'grain_rate': 500.0,
        'grain_length': 1000.0,
        'grain_maxlength': 8000.0,
        'grain_grains': 32.0,
        'tape_delaylength': 500.0,
        'tape_loop': 1.0,
        'tape_gain': 500.0,
        // 'random_reverse_listen': 1.0,
        'random_reverse_influence': 500.0,
        'random_reverse_reversegain': 700.0,
        'random_reverse_maxbufferlength': 2000.0,
        'random_reverse_envelopeduration': 5000.0,
        "random_reverse_rate": -1000.0,
        "random_reverse_maxtimebetweenmultiplier": 2.0,
        
        'clapping_length': 0.0,
        'clapping_voices': 4.0,
        'clapping_speed': 1010.0,
        'clapping_maxbuffer': 4.0,


        'lisa_trigger_length': 1000.0,
        'lisa_trigger_minlength': 250.0,
        'lisa_trigger_rampup': 2.0,
        'lisa_trigger_rampdown': 2.0,
        'lisa_trigger_rate': -1250.0,
        'lisa_trigger_bufferwindow': 0.5,
        'lisa_trigger_envwindow': 2.0,
        // 'asymptotic_chopper_listen': 1.0,
        'asymptotic_chopper_length': 100.0,
        'asymptotic_chopper_minlengthdivisor': 40.0,
        'asymptotic_chopper_maxlengthmultiplier': 10.0,
        'asymptotic_chopper_envwindow': 0.5,
        // 'mosaic_synth': {}
};

type AudioInSettingsStore = {
    audioInSettings: AudioInSettings;
    setAudioInSetting: (key: string, value: number) => void;
    setAudioInSettings: (settings: AudioInSettings) => void;
};

export const useAudioInSettingsStore = create<AudioInSettingsStore>((set) => ({
    audioInSettings: { ...defaultAudioInSettings },
    setAudioInSetting: (key, value) => set(state => ({
  audioInSettings: {
    ...state.audioInSettings,
    [key]: value
  }
})),
    setAudioInSettings: (settings) => set({ audioInSettings: { ...settings } }),
}));

export function getGrainStretchClass(
    beatMs: number,
): string {
    return `
        class GrainStretch extends Chugraph {

            LiSa mic[2];
            ADSR env;

            inlet => mic[0] => env => outlet;
            inlet => mic[1] => env => outlet;

            1 => int m_stretching;
            Std.ftoi(${defaultAudioInSettings["grain_grains"]}) => int m_grains;
            ${defaultAudioInSettings["grain_rate"]} => float m_rate;
            Std.ftoi(${defaultAudioInSettings["grain_length"]})::ms => dur m_bufferLength;
            maxLength(Std.ftoi(${defaultAudioInSettings["grain_maxlength"]})::ms);

            fun void stretch(int s) {
                if (s == 1) {
                    1 => m_stretching;
                    spork ~ stretching();
                }
                else {
                    0 => m_stretching;
                }
            }

            fun void maxLength(dur m) {
                mic[0].duration(m);
                mic[1].duration(m);
            }

            fun void length(dur l) {
                l => m_bufferLength;
            }

            fun void rate(float r) {
                r => m_rate;
            }

            fun void grains(int g) {
                g => m_grains;
            }

            fun void stretching() {
                0 => int idx;

                recordVoice(mic[idx], m_bufferLength);

                // switches between audio buffers, ensuring a constant processed signal
                while (m_stretching) {
                    spork ~ recordVoice(mic[(idx + 1) % 2], m_bufferLength);
                    (idx + 1) % 2 => idx;
                    stretchVoice(mic[idx], m_bufferLength, m_rate, m_grains);
                }
            }

            fun void recordVoice(LiSa mic, dur bufferLength) {
                mic.clear();
                mic.recPos(0::samp);
                mic.record(1);
                bufferLength => now;
                mic.record(0);
            }


            fun void stretchVoice(LiSa mic, dur duration, float rate, int grains) {
                (duration * 1.0/rate)/grains => dur grain;
                grain/32.0 => dur grainEnv;
                grain * 0.5 => dur halfGrain;

                // for some reason if you try to put a sample
                // at a fraction of samp, it will silence ChucK
                // but not crash it?
                if (halfGrain < samp) {

                    return;
                }

                // envelope parameters
                env.attackTime(grainEnv);
                env.releaseTime(grainEnv);

                halfGrain/samp => float halfGrainSamples;
                ((duration/samp)$int)/grains=> int sampleIncrement;

                mic.play(1);

                // bulk of the time stretching
                for (0 => int i; i < grains; i++) {
                    mic.playPos((i * sampleIncrement)::samp);
                    (i * sampleIncrement)::samp + grain => dur end;

                    // only fade if there will be no discontinuity errors
                    if (duration > end) {
                        env.keyOn();
                        halfGrain => now;
                        env.keyOff();
                        halfGrain - grainEnv => now;
                    }
                    else {
                        (grain - (end - duration)) => dur endGrain;
                        env.keyOn();
                        endGrain * 0.5 => now;
                        env.keyOff();
                        endGrain * 0.5 - grainEnv => now;
                    }
                }
                mic.play(0);
            }
        }
    `
};

// gain, delaylength, loop, 
export function getTapeClass(
    beatMs: number,
): string {
    return `
        class Tape extends Chugraph {
            inlet => NRev nRA => Delay del => ADSR env => Gain g => outlet;
            g => del;

            nRA.mix(audioInSettingsHelperHash["tape_gain"]/1000);

            env.set(0::ms, (BeatMsInts/10)::ms, 0.75, (Std.ftoi(audioInSettingsHelperHash["tape_delaylength"]))::ms);
            delayLength((Std.ftoi(audioInSettingsHelperHash["tape_delaylength"]))::ms);

            Std.ftoi(audioInSettingsHelperHash["tape_loop"]) => int m_loop;

            fun void delayLength(dur d) {
                del.max(d);
                
                del.delay(d);
            }

            fun void loop(int l) {
                if (l) {
                    1 => m_loop;
                    spork ~ looping();
                }
                if (l == 0) {
                    0 => m_loop;
                }
            }

            fun void looping() {
                env.keyOn();
                while (m_loop) {
                    1::samp => now;
                }
                env.keyOff();
            }
        }
    `;
};

export function getRandomReverseClass(
    beatMs:number,
): string {
    return `
        class RandomReverse extends Chugraph {

            inlet => LiSa mic => Gain r => outlet;
            inlet => Gain g => ADSR env => outlet;

            0 => int m_listen;
            (BeatMsInts)::ms => dur m_maxBufferLength;
            (BeatMsInts)::ms => dur m_bufferLength;
            ( audioInSettingsHelperHash["random_reverse_influence"] / 1000.0 ) => float m_influence;
            (Std.ftoi(audioInSettingsHelperHash["random_reverse_envelopeduration"]))::ms => dur m_envDuration;
            (BeatMsInts)::ms => dur m_maxTimeBetween;

            // envelope
            env.attackTime(m_envDuration);
            env.releaseTime(m_envDuration);
            env.keyOn();

            fun void listen(int l) {
                if (l == 1) {
                    1 => m_listen;
                    spork ~ listening();
                }
                if (l == 0) {
                    0 => m_listen;
                }
            }

            fun void setInfluence(float i) {
                i => m_influence;
            }

            fun void setReverseGain(float g) {
                r.gain(g);
            }

            fun void setMaxBufferLength(dur l) {
                l => m_maxBufferLength;
            }

            fun void listening() {
                mic.duration(m_maxBufferLength);
                while (m_listen) {
                    if (m_influence >= 0.01) {
                        Math.random2f(0.1, m_influence * 0.75) => float scale;
                        scale * m_bufferLength => dur bufferLength;
                        record(bufferLength);
                        playInReverse(bufferLength);
                        m_maxTimeBetween * Math.fabs(1.0 - m_influence) => now;
                    }
                    1::samp => now;
                }
            }

            fun void record(dur bufferLength) {
                mic.playPos(0::samp);
                mic.record(1);
                bufferLength => now;
                mic.record(0);
            }

            fun void playInReverse(dur bufferLength) {
                if (bufferLength < m_envDuration) {
                    m_envDuration * 2 => bufferLength;
                }
                env.keyOff();
                mic.play(1);
                mic.playPos(bufferLength);
                mic.rate(-1.0);
                mic.rampUp(m_envDuration);
                bufferLength - m_envDuration => now;
                mic.rampDown(m_envDuration);
                env.keyOn();
                m_envDuration => now;
                mic.play(0);
            }


        }
    `;
    // return `
    //     class RandomReverse extends Chugraph {

    //     inlet => LiSa mic => Gain r => outlet;
    //     inlet => Gain g => ADSR env => outlet;

    //     0 => int m_listen;
    //     (audioInSettingsHelperHash["random_reverse_maxbufferlength"] / 1000 )::ms => dur m_maxBufferLength;
    //     (audioInSettingsHelperHash["random_reverse_maxbufferlength"] / 1000)::ms => dur m_bufferLength;
    //     audioInSettingsHelperHash["random_reverse_influence"] / 1000 => float m_influence;
    //     100::ms => dur m_envDuration;
    //     (Std.ftoi(audioInSettingsHelperHash["random_reverse_envelopeduration"]))::ms => dur m_maxTimeBetween;

    //     // envelope
    //     env.attackTime(m_envDuration);
    //     env.releaseTime(m_envDuration);
    //     env.keyOn();

    //     fun void listen(int l) {
    //         if (l == 1) {
    //             1 => m_listen;
    //             spork ~ listening();
    //         }
    //         if (l == 0) {
    //             0 => m_listen;
    //         }
    //     }

    //     fun void setInfluence(float i) {
    //         i => m_influence;
    //     }

    //     fun void setReverseGain(float g) {
    //         r.gain(g);
    //     }

    //     fun void setMaxBufferLength(dur l) {
    //         l => m_maxBufferLength;
    //     }

    //     fun void listening() {
    //         mic.duration(m_maxBufferLength);
    //         while (m_listen) {
    //             if (m_influence >= 0.01) {
    //                 Math.random2f(0.1, m_influence * 0.95) => float scale;
    //                 scale * m_bufferLength => dur bufferLength;
    //                 record(bufferLength);
    //                 playInReverse(bufferLength);
    //                 m_maxTimeBetween * Math.fabs(1.0 - m_influence) => now;
    //             }
    //             1::samp => now;
    //         }
    //     }

    //     fun void record(dur bufferLength) {
    //         mic.playPos(0::samp);
    //         mic.record(1);
    //         bufferLength => now;
    //         mic.record(0);
    //     }

    //     fun void playInReverse(dur bufferLength) {
    //         if (bufferLength < m_envDuration) {
    //             m_envDuration * 2 => bufferLength;
    //         }
    //         env.keyOff();
    //         mic.play(1);
    //         mic.playPos(bufferLength);
    //         mic.rate(-1.0);
    //         mic.rampUp(m_envDuration);
    //         bufferLength - m_envDuration => now;
    //         mic.rampDown(m_envDuration);
    //         env.keyOn();
    //         m_envDuration => now;
    //         mic.play(0);
    //     }
    //     }
    // `;
};

export function getReichClass(
    beatMs: number,
) {
    return `
        class Reich extends Chugraph {

            inlet => LiSa mic => outlet;

            0 => int m_record;
            0 => int m_play;

            Std.ftoi(audioInSettingsHelperHash["clapping_length"])::ms => dur m_length;
            Std.ftoi(audioInSettingsHelperHash["clapping_voices"]) => int m_voices;
            Std.ftoi(audioInSettingsHelperHash["clapping_speed"])/1000 => float m_speed;

            false => int m_bi;
            false => int m_random;
            false => int m_spread;

            maxBufferLength(2000::ms);

            fun void maxBufferLength(dur l) {
                mic.duration(l);
            }

            fun void record(int r) {
                if (r == 1) {
                    1 => m_record;
                    spork ~ recording();
                }
                if (r == 0) {
                    0 => m_record;
                }
            }

            fun void recording() {
                mic.clear();

                mic.recPos(0::samp);
                mic.record(1);

                while (m_record == 1) {
                    1::samp => now;
                }

                mic.record(0);
                mic.recPos() => m_length;
            }

            fun void play(int p) {
                if (p == 1) {
                    1 => m_play;
                    spork ~ playing();
                }
                if (p == 0) {
                    0 => m_play;
                }

            }

            fun void playing() {
                m_voices => int numVoices;
                for (int i; i < numVoices; i++) {
                    0::ms => dur pos;
                    if (m_random) {
                        Math.random2f(0.5,1.0) * m_length => pos;
                    } else if (m_spread) {
                        i/(numVoices$float) * m_length => pos;
                    }
                    mic.playPos(i, pos);

                    // set parameters
                    mic.bi(i, m_bi);
                    mic.rate(i, (m_speed - 1.0) * i + 1);
                    mic.loop(i, 1);
                    mic.loopEnd(i, m_length);

                    mic.play(i, 1);
                }
                while (m_play == 1) {
                    samp => now;
                }
                for (int i; i < numVoices; i++) {
                    mic.play(i, 0);
                }
            }

            // spreads the initial voices randomly
            // throughout the record buffer
            fun void random(int r) {
                r => m_random;
            }

            // spreads the initial voices equally
            // throughout the record buffer
            fun void spread(int r) {
                r => m_spread;
            }

            // plays a voice backwards when reaching
            // the end of the buffer, otherwise
            // it will loop from the beginning
            fun void bi(int b) {
                b => m_bi;
            }

            // the number of voices to be played back
            fun void voices(int n) {
                n => m_voices;
            }

            // speed offset for the voices
            fun void speed(float s) {
                s => m_speed;
            }
        }
    `;
};

export function getLisaTriggerClass(
    beatMs: number,
): string {
    return `
        class LisaTrigger extends Chugraph {
            inlet => Envelope e => LiSa10 loopme => outlet;
            // direct
            adc => e => dac;


            // print channel info
            <<< "LiSa channels:", loopme.channels() >>>;

            // allocate memory in LiSa
            6::second => loopme.duration;

            // play s for a bit
            500::ms => now;

            // sweep the freq for fun
            Envelope pitchmod => blackhole;
            pitchmod.duration( 2000::ms );
            // pitchmod.value( s.freq() );
            pitchmod.target( 220.0 );

            // set times for recording fade in/out and sample loop length
            100::ms => dur recfadetime;
            1000::ms => dur mylooplen;
            // set envelope duration
            e.duration( recfadetime );

            while (true) {
                // start recording input; record 1 seconds worth
                loopme.record(1);
                // open envelope (can also do without the Envelope and use
                // loopme.recramp(dur) to set a recording ramp)
                e.keyOn();

                // calcuate later
                now + (mylooplen - recfadetime) => time later;
                // go until now is later (or later)
                while(now < later)
                {
                    // advance time
                    10::ms => now;
                }
                // close envelope
                e.keyOff();
                // let fade time pass
                recfadetime => now;
                // print
                <<< "stop recording input into LiSa...", "" >>>;
                // stop recording input
                loopme.record(0);

                // disconnect direct input...
                adc =< dac;
                // print
                <<< "disconnect sine and hanging out...", "" >>>;
                // and hang out for a bit
                1000::ms => now;

                // now, manipulate the sample
                // get a voicenumber; note that this voice won't actually be
                // reserved until you play it
                loopme.getVoice() => int voice1;

                // we'll play voice 1 forward; then crossfade with voice 2 backwards
                // set gain
                loopme.voiceGain( voice1, .5 );
                // set pan (hard left channel)
                loopme.pan( voice1, 0 );
                // play voice 1
                loopme.play( voice1, 1 );
                // print
                <<< "playing LiSa voice 1 ( id:", voice1, ")" >>>;
                // let time pass
                (mylooplen - recfadetime) => now;

                // just as voice 1 is going to fade, bring in voice 2
                loopme.getVoice() => int voice2;
                // set play rate to go backwards
                loopme.rate( voice2, .4 );
                // set play head at the end
                loopme.playPos( voice2, mylooplen ); 
                // set gain
                loopme.voiceGain( voice2, 0.5 );
                // set pan (hard right channel)
                loopme.pan( voice2, 1 );
                // play
                loopme.play( voice2, 1 );
                // print
                <<< "playing LiSa voice 2 ( id:", voice2, ")" >>>;

                // wait until voice 1 had finished fading...
                recfadetime => now;
                // turn off voice 1
                loopme.play( voice1, 0 );
                // print
                <<< "stopping LiSa voice 1...", "" >>>;

                // wait for voice 2 to finish
                1000::ms => now;

                // print
                <<< "program ending...", "" >>>;

            }
        }
    `;
};

export function getAsymptoticChopperClass(
    beatMs: number,
): string {
    return `
        class AsymptoticChopper extends Chugraph {
            inlet => LiSa mic => outlet;
            // Std.ftoi(audioInSettingsHelperHash["asymptotic_chopper_listen"]) 
            1 => int m_listen;
            (BeatMsInts)::ms => dur m_bufferLength;
            (Std.ftoi(audioInSettingsHelperHash["asymptotic_chopper_maxlengthmultiplier"] * BeatMsInts))::ms => dur m_maxBufferLength;
            (Std.ftoi(BeatMsInts / audioInSettingsHelperHash["asymptotic_chopper_minlengthdivisor"]))::ms => dur m_minimumLength;
            m_minimumLength * audioInSettingsHelperHash["asymptotic_chopper_envwindow"] => dur m_envLength;
            fun void listen(int lstn) {
                if (lstn == 1) {
                    1 => m_listen;
                    spork ~ listening();
                }
                if (lstn == 0) {
                    0 => m_listen;
                }
            }
            fun void length(dur l) {
                l => m_bufferLength;
            }
            fun void maxLength(dur l) {
                l => m_maxBufferLength;
            }
            fun void minimumLength(dur l) {
                m_minimumLength;
                l * audioInSettingsHelperHash["asymptotic_chopper_envwindow"] => m_envLength;
            }
            fun void listening() {
                mic.duration(m_maxBufferLength);
                while (m_listen) {
                    mic.clear();
                    mic.recPos(0::samp);
                    mic.record(1);
                    m_bufferLength => now;
                    mic.record(0);
                    asymptopChop(m_bufferLength);
                }
            }
            fun void asymptopChop(dur bufferLength) {
                dur bufferStart;
                m_bufferLength => dur bufferLength;
                mic.play(1);
                while (bufferLength > m_minimumLength) {
                    Math.random2(0, 1) => int which;
                    bufferLength * audioInSettingsHelperHash["asymptotic_chopper_envwindow"] => bufferLength;
                    bufferLength * which => bufferStart;
                    mic.playPos(bufferStart);
                    mic.rampUp(m_envLength);
                    bufferLength - m_envLength => now;
                    mic.rampDown(m_envLength);
                    m_envLength => now;
                }
                mic.play(0);
            }
        }
    `;
} 

export function getMosaicSynthClass(beatMs: number): string {
    // return `
    //     // input: pre-extracted model file
    //     me.dir() + "mosaic_model.txt" => string FEATURES_FILE;

    //     //------------------------------------------------------------------------------
    //     // unit analyzer network: *** this must match the features in the features file
    //     //------------------------------------------------------------------------------
    //     // audio input into a FFT
    //     adc => FFT fft;
    //     // a thing for collecting multiple features into one vector
    //     FeatureCollector combo => blackhole;
    //     // add spectral feature: Centroid
    //     fft =^ Centroid centroid =^ combo;
    //     // add spectral feature: Flux
    //     fft =^ Flux flux =^ combo;
    //     // add spectral feature: RMS
    //     fft =^ RMS rms =^ combo;
    //     // add spectral feature: MFCC
    //     fft =^ MFCC mfcc =^ combo;
    //     fft =^ RollOff rolloff =^ combo;
    //     fft =^ Chroma chroma =^ combo;
    //     fft =^ Kurtosis kurtosis => blackhole;
    //     adc => DCT dct => blackhole;
    //     adc => Flip flip =^ ZeroX zerox => blackhole;
    //     fft =^ SFM sfm => blackhole;

    //     //-----------------------------------------------------------------------------
    //     // setting analysis parameters -- also should match what was used during extration
    //     //-----------------------------------------------------------------------------
    //     // set flip size (N)

    //     // output in [-1,1]
    //     // calculate sample rate
    //     second/samp => float srate;

    //     // set number of coefficients in MFCC (how many we get out)
    //     // 13 is a commonly used value; using less here for printing
    //     20 => mfcc.numCoeffs;
    //     // set number of mel filters in MFCC
    //     10 => mfcc.numFilters;

    //     // do one .upchuck() so FeatureCollector knows how many total dimension
    //     combo.upchuck();

    //     // get number of total feature dimensions
    //     combo.fvals().size() => int NUM_DIMENSIONS;

    //     // set FFT size
    //     4096 => fft.size;
    //     // set window type and size
    //     Windowing.hann(fft.size()) => fft.window;
    //     // our hop size (how often to perform analysis)
    //     (fft.size()/2)::samp => dur HOP;
    //     // how many frames to aggregate before averaging?
    //     // (this does not need to match extraction; might play with this number) ***
    //     30 => int NUM_FRAMES;
    //     // how much time to aggregate features for each file
    //     fft.size()::samp * NUM_FRAMES => dur EXTRACT_TIME;

    //     class Tracking
    //     {
    //         static float the_freq;
    //         static float the_gain;
    //         static Event @ the_event;
    //     }

    //     // initialize separately (due to a bug)
    //     new Event @=> Tracking.the_event;

    //     // analysis
    //     adc => PoleZero dcblock => FFT fftTrack => blackhole;

    //     // set to block DC
    //     .99 => dcblock.blockZero;

    //     fun void pitchTrackADC(FFT @win, Kurtosis @ winKurtosis, SFM @ winSfm) {
    //         // window
    //         Windowing.hamming( win.size() ) => win.window;
    //         float finalObj[2];

    //         0 => int count;
    //         // go for it
    //         while( true )
    //         {
    //             // take fft
    //             win.upchuck() @=> UAnaBlob blob;
    //             winKurtosis.upchuck();
    //             winSfm.upchuck();
                
    //             // find peak
    //             0 => float max; float where;
    //             for( int i; i < blob.fvals().size()/8; i++ )
    //             {
    //                 // compare
    //                 if( blob.fvals()[i] > max )
    //                 {
    //                     // save
    //                     blob.fvals()[i] => max;
    //                     i => where;
    //                 }
    //             }
                
    //             // set freq
    //             (where / win.size() * (second / samp)) => Tracking.the_freq;
    //             // set gain
    //             (max / .5) => Tracking.the_gain;
    //             // clamp
    //             if( Tracking.the_gain > 1 )
    //                 1 => Tracking.the_gain;
    //             // fire!
    //             Tracking.the_event.broadcast();

    //             // hop
    //             (win.size()/4)::samp => now;

    //             "" => string sfmString;
                
    //             for( int i; i < winSfm.fvals().size(); i++ )
    //             {
    //                 Math.round(winSfm.fval(i) * 10) / 10 => float tmp;
    //                 sfmString + " " + tmp => sfmString;
    //             }

    //             // if (count % 2048 == 0) {
    //             //     <<< "FREQ / GAIN / KURT / SFM: ", Tracking.the_freq, Tracking.the_gain, winKurtosis.fval(0), sfmString >>>;
    //             // }
    //             count++;
    //         }
    //     }

    //     fun void getDCT_XCrossing(DCT @ winDct, ZeroX @ winZerox, Flip @ winFlip) {
    //         // set parameters
    //         8 => winDct.size;

    //         int div;

    //         4096 => winFlip.size;

    //         0 => int countCrossLog;

    //         // control loop
    //         while( true )
    //         {
    //             // set srate
    //             second / samp => float srate;
    //             (winFlip.size() / srate) * 1000 => float toMilliseconds;

    //             // winDct.size()/2 %=> div;
    //             winZerox.upchuck() @=> UAnaBlob blob;

    //             winDct.size()/2 %=> div;
    //             winDct.upchuck();

    //             // advance time
    //             toMilliseconds::ms => now;
    //             // if (countCrossLog % 2048 == 0) {
    //             //     <<< "XCROSS / DCT: ", blob.fvals()[0], winDct.fval(0), winDct.fval(1), winDct.fval(2), winDct.fval(3), toMilliseconds >>>;
    //             // }
    //             countCrossLog++;
    //         }
    //     }

    //     //------------------------------------------------------------------------------
    //     // unit generator network: for real-time sound synthesis
    //     //------------------------------------------------------------------------------
    //     // how many max at any time? // 16
    //     // 16 => int NUM_VOICES;
    //     16 => int NUM_VOICES;
    //     // a number of audio buffers to cycel between
    //     SndBuf buffers[NUM_VOICES]; ADSR envs[NUM_VOICES]; Pan2 pans[NUM_VOICES];
    //     // set parameters
    //     for( int i; i < NUM_VOICES; i++ )
    //     {
    //         // connect audio
    //         buffers[i] => envs[i] => pans[i] => dac;
    //         // set chunk size (how to to load at a time)
    //         // this is important when reading from large files
    //         // if this is not set, SndBuf.read() will load the entire file immediately
    //         fft.size() => buffers[i].chunks;
    //         // randomize pan
    //         Math.random2f(-.75,.75) => pans[i].pan;
    //         // set envelope parameters
    //         envs[i].set( EXTRACT_TIME, EXTRACT_TIME/2, 1, EXTRACT_TIME );
    //     }


    //     //------------------------------------------------------------------------------
    //     // load feature data; read important global values like numPoints and numCoeffs
    //     //------------------------------------------------------------------------------
    //     // values to be read from file
    //     0 => int numPoints; // number of points in data
    //     0 => int numCoeffs; // number of dimensions in data
    //     // file read PART 1: read over the file to get numPoints and numCoeffs
    //     loadFile( FEATURES_FILE ) @=> FileIO @ fin;
    //     // check
    //     if( !fin.good() ) me.exit();
    //     // check dimension at least
    //     if( numCoeffs != NUM_DIMENSIONS )
    //     {
    //         // error
    //         <<< "[error] expecting:", NUM_DIMENSIONS, "dimensions; but features file has:", numCoeffs >>>;
    //         // stop
    //         me.exit();
    //     }


    //     //------------------------------------------------------------------------------
    //     // each Point corresponds to one line in the input file, which is one audio window
    //     //------------------------------------------------------------------------------
    //     class AudioWindow
    //     {
    //         // unique point index (use this to lookup feature vector)
    //         int uid;
    //         // which file did this come file (in files arary)
    //         int fileIndex;
    //         // starting time in that file (in seconds)
    //         float windowTime;
            
    //         // set
    //         fun void set( int id, int fi, float wt )
    //         {
    //             id => uid;
    //             fi => fileIndex;
    //             wt => windowTime;
    //         }
    //     }

    //     // array of all points in model file
    //     AudioWindow windows[numPoints];
    //     // unique filenames; we will append to this
    //     string files[0];
    //     // map of filenames loaded
    //     int filename2state[0];
    //     // feature vectors of data points
    //     float inFeatures[numPoints][numCoeffs];
    //     // generate array of unique indices
    //     int uids[numPoints]; for( int i; i < numPoints; i++ ) i => uids[i];

    //     // use this for new input
    //     float features[NUM_FRAMES][numCoeffs];
    //     // average values of coefficients across frames
    //     float featureMean[numCoeffs];


    //     //------------------------------------------------------------------------------
    //     // read the data
    //     //------------------------------------------------------------------------------
    //     readData( fin );


    //     //------------------------------------------------------------------------------
    //     // set up our KNN object to use for classification
    //     // (KNN2 is a fancier version of the KNN object)
    //     // -- run KNN2.help(); in a separate program to see its available functions --
    //     //------------------------------------------------------------------------------
    //     KNN2 knn;
    //     // k nearest neighbors
    //     2 => int K;
    //     // results vector (indices of k nearest points)
    //     int knnResult[K];
    //     // knn train
    //     knn.train( inFeatures, uids );


    //     // used to rotate sound buffers
    //     0 => int which;
    //     //------------------------------------------------------------------------------
    //     // SYNTHESIS!!
    //     // this function is meant to be sporked so it can be stacked in time
    //     //------------------------------------------------------------------------------
    //     fun void synthesize( int uid )
    //     {
    //         // get the buffer to use
    //         buffers[which] @=> SndBuf @ sound;
    //         // get the envelope to use
    //         envs[which] @=> ADSR @ envelope;
    //         // increment and wrap if needed
    //         which++; if( which >= buffers.size() ) 0 => which;

    //         // get a referencde to the audio fragment to synthesize
    //         windows[uid] @=> AudioWindow @ win;
    //         // get filename
    //         files[win.fileIndex] => string filename;
            
    //         // <<< "WHAT IS FILENAME? ", filename >>>;
            
            
    //         "" => string mfccString;
    //         for (0 => int i; i < mfcc.fvals().cap(); i++) {
    //             if (i < mfcc.fvals().cap() - 1) {
    //                 mfcc.fvals()[i] + ", "  +=> mfccString;
    //             } else {
    //                 mfcc.fvals()[i] +=> mfccString;
    //             }
    //         }

    //         "" => string chromaString;
    //         for (0 => int i; i < chroma.fvals().cap(); i++) {
    //             if (i < chroma.fvals().cap() - 1) {
    //                 chroma.fvals()[i] + ", " +=> chromaString;
    //             } else {
    //                 chroma.fvals()[i] +=> chromaString;
    //             }
    //         }

    //         /////// not part of voice stitcher but useful (in while loop this will be sporked from)
    //         // <<< "FEATURES VALS: ", centroid.fval(0) + " " + flux.fval(0) + " " + rms.fval(0) + " " + mfccString + " " +  rolloff.fval(0) + " " + chromaString >>>;
    //         spork ~ pitchTrackADC(fftTrack, kurtosis, sfm) @=> Shred @ pitchGainADC;
    //         spork ~ getDCT_XCrossing(dct, zerox, flip) @=> Shred @ xCross;
    //         ////////////////////////////////////



    //         // load into sound buffer
    //         filename => sound.read;
    //         // seek to the window start time
    //         (win.windowTime::second/samp) $ int => sound.pos;
    //         <<< "window time: ", win.windowTime >>>;
    //         // print what we are about to play
    //         chout <= "synthsizing window: ";
    //         // print label
    //         chout <= win.uid <= "["
    //             <= win.fileIndex <= ":"
    //             <= win.windowTime <= ":POSITION="
    //             <= sound.pos() <= "]";
    //         // endline
    //         chout <= IO.newline();

    //         // open the envelope, overlap add this into the overall audio
    //         envelope.keyOn();
    //         // wait
    //         (EXTRACT_TIME*3)-envelope.releaseTime() => now;
    //         // start the release
    //         envelope.keyOff();
    //         // wait
    //         envelope.releaseTime() => now;
    //     }


    //     //------------------------------------------------------------------------------
    //     // real-time similarity retrieval loop
    //     //------------------------------------------------------------------------------
    //     while( true )
    //     {

    //         // aggregate features over a period of time
    //         for( int frame; frame < NUM_FRAMES; frame++ )
    //         {
    //             //-------------------------------------------------------------
    //             // a single upchuck() will trigger analysis on everything
    //             // connected upstream from combo via the upchuck operator (=^)
    //             // the total number of output dimensions is the sum of
    //             // dimensions of all the connected unit analyzers
    //             //-------------------------------------------------------------
    //             combo.upchuck();  
    //             // get features
    //             for( int d; d < NUM_DIMENSIONS; d++) 
    //             {
    //                 // store them in current frame
    //                 combo.fval(d) => features[frame][d];
    //                 // if (frame % 512 == 0) {
    //                 //     <<< "FEATURE ", d, ": ", features[frame][d] >>>;
    //                 // }
    //             }
                
    //             // advance time
    //             HOP => now;
    //         }
            
    //         // compute means for each coefficient across frames
    //         for( int d; d < NUM_DIMENSIONS; d++ )
    //         {
    //             // zero out
    //             0.0 => featureMean[d];
    //             // loop over frames
    //             for( int j; j < NUM_FRAMES; j++ )
    //             {
    //                 // add
    //                 features[j][d] +=> featureMean[d];
    //             }
    //             // average
    //             NUM_FRAMES /=> featureMean[d];
    //         }
            
    //         //-------------------------------------------------
    //         // search using KNN2; results filled in knnResults,
    //         // which should the indices of k nearest points
    //         //-------------------------------------------------
    //         knn.search( featureMean, K, knnResult );
                
    //         // SYNTHESIZE THIS
    //         spork ~ synthesize( knnResult[Math.random2(0,knnResult.size()-1)] );
    //     }
    //     //------------------------------------------------------------------------------
    //     // end of real-time similiarity retrieval loop
    //     //------------------------------------------------------------------------------




    //     //------------------------------------------------------------------------------
    //     // function: load data file
    //     //------------------------------------------------------------------------------
    //     fun FileIO loadFile( string filepath )
    //     {
    //         // reset
    //         0 => numPoints;
    //         0 => numCoeffs;
            
    //         // load data
    //         FileIO fio;
    //         if( !fio.open( filepath, FileIO.READ ) )
    //         {
    //             // error
    //             <<< "cannot open file:", filepath >>>;
    //             // close
    //             fio.close();
    //             // return
    //             return fio;
    //         }
            
    //         string str;
    //         string line;
    //         // read the first non-empty line
    //         while( fio.more() )
    //         {
    //             // read each line
    //             fio.readLine().trim() => str;
    //             // check if empty line
    //             if( str != "" )
    //             {
    //                 numPoints++;
    //                 str => line;
    //             }
    //         }
            
    //         // a string tokenizer
    //         StringTokenizer tokenizer;
    //         // set to last non-empty line
    //         tokenizer.set( line );
    //         // negative (to account for filePath windowTime)
    //         -2 => numCoeffs;
    //         // see how many, including label name
    //         while( tokenizer.more() )
    //         {
    //             tokenizer.next();
    //             numCoeffs++;
    //         }
            
    //         // see if we made it past the initial fields
    //         if( numCoeffs < 0 ) 0 => numCoeffs;
            
    //         // check
    //         if( numPoints == 0 || numCoeffs <= 0 )
    //         {
    //             <<< "no data in file:", filepath >>>;
    //             fio.close();
    //             return fio;
    //         }
            
    //         // print
    //         <<< "# of data points:", numPoints, "dimensions:", numCoeffs >>>;
            
    //         // done for now
    //         return fio;
    //     }


    //     //------------------------------------------------------------------------------
    //     // function: read the data
    //     //------------------------------------------------------------------------------
    //     fun void readData( FileIO fio )
    //     {
    //         // rewind the file reader
    //         fio.seek( 0 );
            
    //         // a line
    //         string line;
    //         // a string tokenizer
    //         StringTokenizer tokenizer;
            
    //         // points index
    //         0 => int index;
    //         // file index
    //         0 => int fileIndex;
    //         // file name
    //         string filename;
    //         // window start time
    //         float windowTime;
    //         // coefficient
    //         int c;
            
    //         // read the first non-empty line
    //         while( fio.more() )
    //         {
    //             // read each line
    //             fio.readLine().trim() => line;
    //             // check if empty line
    //             if( line != "" )
    //             {
    //                 // set to last non-empty line
    //                 tokenizer.set( line );
    //                 // file name
    //                 tokenizer.next() => filename;
    //                 // window start time
    //                 tokenizer.next() => Std.atof => windowTime;
    //                 // have we seen this filename yet?
    //                 if( filename2state[filename] == 0 )
    //                 {
    //                     // make a new string (<< appends by reference)
    //                     filename => string sss;
    //                     // append
    //                     files << sss;
    //                     // new id
    //                     files.size() => filename2state[filename];
    //                 }
    //                 // get fileindex
    //                 filename2state[filename]-1 => fileIndex;
    //                 // set
    //                 windows[index].set( index, fileIndex, windowTime );

    //                 // zero out
    //                 0 => c;
    //                 // for each dimension in the data
    //                 repeat( numCoeffs )
    //                 {
    //                     // read next coefficient
    //                     tokenizer.next() => Std.atof => inFeatures[index][c];
    //                     // increment
    //                     c++;
    //                 }
                    
    //                 // increment global index
    //                 index++;
    //             }
    //         }
    //     }
    // `;
    return ``;
};

