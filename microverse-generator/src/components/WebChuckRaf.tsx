'use client';

import { useEffect } from 'react';
import { useRafLoop } from '../hooks/useRafLoop';
import { useTickStore } from '../store/useTickStore';

const WEBCHUGIN_URL = "https://ccrma.stanford.edu/~tzfeng/static/webchugins/";

const chugins = [
    "ABSaturator.chug.wasm",
    "AmbPan.chug.wasm",
    "Binaural.chug.wasm",
    "Bitcrusher.chug.wasm",
    "Elliptic.chug.wasm",
    "ExpDelay.chug.wasm",
    "ExpEnv.chug.wasm",
    "FIR.chug.wasm",
    "FoldbackSaturator.chug.wasm",
    "GVerb.chug.wasm",
    "KasFilter.chug.wasm",
    "Ladspa.chug.wasm",
    "Line.chug.wasm",
    "MagicSine.chug.wasm",
    "Mesh2D.chug.wasm",
    "Multicomb.chug.wasm",
    "NHHall.chug.wasm",
    "Overdrive.chug.wasm",
    "PanN.chug.wasm",
    "Patch.chug.wasm",
    "Perlin.chug.wasm",
    "PitchTrack.chug.wasm",
    "PowerADSR.chug.wasm",
    "Random.chug.wasm",
    "Range.chug.wasm",
    "RegEx.chug.wasm",
    "Sigmund.chug.wasm",
    "Spectacle.chug.wasm",
    "WPDiodeLadder.chug.wasm",
    "WPKorg35.chug.wasm",
    "Wavetable.chug.wasm",
    "WinFuncEnv.chug.wasm",
    "XML.chug.wasm",
];

/**
 * Create paths to webchugins for loading into WebChucK
 * TODO: implement some kind of caching
 * @returns {string[]} array of chugin paths
 */
export function loadWebChugins(): string[] {
    return chugins.map((chuginName) => {
        return WEBCHUGIN_URL + chuginName;
    });
}

export default function WebChucKRaf() {
  const setTick = useTickStore((s) => s.setTick);

  useEffect(() => {
    // 🔹 Only import webchuck dynamically in the browser
    import('webchuck').then(({ Chuck }) => {
        (async () => {
   
            const audioContext = new AudioContext();
            audioContext.suspend();
            const sampleRate = audioContext.sampleRate;
            // calculateDisplayDigits(sampleRate);

            const chugins: string[] = loadWebChugins();
            chugins.forEach((chuginPath) => Chuck.loadChugin(chuginPath));
            // const DEV_CHUCK_SRC = "https://chuck.stanford.edu/webchuck/dev/"; // dev webchuck src
            // const PROD_CHUCK_SRC = "https://chuck.stanford.edu/webchuck/src/"; // prod webchuck src
            // let whereIsChuck: string =
            //     localStorage.getItem("chuckVersion") === "dev"
            //         ? DEV_CHUCK_SRC
            //         : PROD_CHUCK_SRC;

            const LOCAL_CHUCK_SRC = "/webchuck/";

            const theChuck = await Chuck.init(
                [], // files to preload (if noeeded)
                audioContext,
                audioContext.destination.maxChannelCount,
                LOCAL_CHUCK_SRC // or whereIsChuck
            );

            await theChuck.connect(audioContext.destination);
            if (theChuck && theChuck.context.state === "suspended") {
                const theChuckContext: any = theChuck.context;
                theChuckContext.resume();
            }
            let chuckVersion = '';

            theChuck.getParamString("VERSION").then((value: string) => {
                chuckVersion = value;
            });

            theChuck.chuckPrint = (message: string) => {
                if (message.includes("TICK: ")) {
                    const parsedMsg = message.split(":")[1].trim();

                    // setChuckMsg(parsedMsg); 

                } else {
                    if (message.includes("SHREDCOUNT: ")) {
                        console.log("SHREDCOUNT ", message)
                    }
                    if (message.includes("KEY_VAL2")) { 
                        console.log("GOT NOTES!>!>!>! ", message)
                    }
                }
            }
            console.log("THE CHUCK: ", theChuck);
            theChuck.runCode(`
                class TheEvent extends Event
                {
                    int pitch;
                    float velocity;
                }

                TheEvent e;

                NRev reverb => dac;
                .15 => reverb.mix;


                fun void hi( TheEvent e, int id )
                {
                    FrencHrn f => reverb;
    
                    while( true )
                    {
                        e => now;
                        <<< "shred", id, ":", e.pitch, e.velocity >>>;
                        
                        e.pitch => Std.mtof => f.freq;
                        e.velocity => f.noteOn;
                        
                        150::ms => now;
                        f.noteOff( 0 );
                    }
                }

                spork ~ hi( e, 1 );
                spork ~ hi( e, 2 );
                spork ~ hi( e, 3 );
                spork ~ hi( e, 4 );

                me.yield();

                while( true )
                {
                    Math.random2( 48, 84 ) => e.pitch;
                    Math.random2f( .5,1 ) => e.velocity;
                    e.signal();
                    600::ms => now;
                }
            `)
        })();
    }).catch(console.error);
  }, []);

  useRafLoop((time, delta) => {
    setTick(time, delta);
  });

  return null;
}