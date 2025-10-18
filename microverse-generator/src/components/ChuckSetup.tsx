'use client';
import { useEffect } from 'react';
import { loadWebChugins } from './WebChuckRaf';
import { useSignalBus } from '../store/useSignalBus';
import { useGuideMetricsStore } from '../store/useGuideMetricsStore';

export default function ChuckSetup() {

    const tryGetAudio = async () => {
        const devices = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        console.log('Audio devices:', devices);
    };

    const bus = useSignalBus.getState();
    const metrics = useGuideMetricsStore(state => state.metrics);
    console.log("@@@ Metrics from GuideMetricsStore in ChuckSetup: ", metrics);


    useEffect(() => {
        import('webchuck').then((mod) => {        
            (async () => {
                            const audioContext = new AudioContext();
                const sampleRate = audioContext.sampleRate;
                // calculateDisplayDigits(sampleRate);

                const LOCAL_CHUCK_SRC = "/webchuck/";
                const theChuck = await mod.Chuck.init(
                    [],
                    audioContext,
                    audioContext.destination.maxChannelCount,
                    // whereIsChuck
                    LOCAL_CHUCK_SRC
                );

                const chugins: string[] = loadWebChugins();
                chugins.forEach((chuginPath) => mod.Chuck.loadChugin(chuginPath));
                // const DEV_CHUCK_SRC = "https://chuck.stanford.edu/webchuck/dev/"; // dev webchuck src
                // const PROD_CHUCK_SRC = "https://chuck.stanford.edu/webchuck/src/"; // prod webchuck src
                // let whereIsChuck: string =
                //     localStorage.getItem("chuckVersion") === "dev"
                //         ? DEV_CHUCK_SRC
                //         : PROD_CHUCK_SRC;
            
                await theChuck.connect(audioContext.destination);
                // Expose a one-shot resume function for user gesture
                let resumed = false;
                (window as any).__resumeChuck = async () => {
                    if (resumed) return;
                    try {
                        await audioContext.resume();
                    } catch {}
                    try {
                        const ctx: any = theChuck.context;
                        if (ctx?.state === 'suspended') await ctx.resume();
                    } catch {}
                    resumed = true;
                    console.log('[WebChucK] Audio resumed');
                };
                let chuckVersion = '';

                theChuck.getParamString("VERSION").then((value: string) => {
                    chuckVersion = value;
                    console.log("What is CHUCK VERSION?: ", chuckVersion)
                });

                theChuck.chuckPrint = (message: string) => {
                    if (message.includes("TICK: ")) {
                        const parsedMsg = message.split(":")[1].trim();
                        // setChuckMsg(parsedMsg); 
                        console.log("TICK MESSAGE FROM CHUCK: ", parsedMsg);
                    } else {
                        if (message.includes("SHREDCOUNT: ")) {
                            console.log("SHREDCOUNT ", message)
                        }
                        if (message.includes("updatedgain: ")) {
                            
                            console.log("updatedgain ", message)

                            const energy: number = useSignalBus.getState().rgb.energy;
                            const blue: number = useSignalBus.getState().rgb.b;
                            const red: number = useSignalBus.getState().rgb.r;
                            const green: number = useSignalBus.getState().rgb.g;

                            theChuck.setFloat("energy", energy);
                            theChuck.setFloat("red", red);
                            theChuck.setFloat("green", green);
                            theChuck.setFloat("blue", blue);
                        }
                    }
                }

                console.log("THE CHUCK: ", theChuck);


                const chuckInstructions = `

                    0.0 => global float energy;
                    0.0 => global float red;
                    0.0 => global float green;
                    0.0 => global float blue;
                    float _m;

                    class TheEvent extends Event
                    {
                        int pitch;
                        float velocity;
                    }
                    
                    global float theUpdatedGain;
                    
                    fun void flipGain() { 
                        while (true) { 
                            0.6 => theUpdatedGain; 
                            1::second => now; 
                            0.0 => theUpdatedGain; 
                            1::second => now; 
                        } 
                    }
                    
                    TheEvent e;

                    NRev reverb => dac;
                    .17 => reverb.mix;

                    spork ~ flipGain();

                    fun void hi( TheEvent e, int id )
                    {
                        FrencHrn f => reverb;
        
                        while( true )
                        {
                            e => now;
                            <<< "shred", id, ":", e.pitch, e.velocity >>>;
                
                            e.pitch => Std.mtof => f.freq;
                            theUpdatedGain => f.gain;
                            e.velocity => f.noteOn;

                            float _m;

                            energy => reverb.mix;
                            <<< "updatedgain: ", reverb.mix() >>>;
                            300::ms => now;
                            
                            f.noteOff( 0 );
                        }
                    }

                    spork ~ hi( e, 1 );

                    me.yield();

                    while( true )
                    {
                        Math.random2( 48, 60 ) => e.pitch;
                        Math.random2f( .5,.65 ) => e.velocity;
                        e.signal();
                        4000::ms => now;
                    }
                `;

                console.log("CHUCK DEBUG: ", chuckInstructions);

                theChuck.runCode(chuckInstructions)

            })();
        });
    }, []);

    console.log("WTF BUS??? ", bus);

    return null;
}