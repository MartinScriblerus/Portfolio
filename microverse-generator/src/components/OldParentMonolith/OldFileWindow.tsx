"use client";

// // import { clippedDuration, ffmpegRef, filesToProcess, messageRef, regionEnd, regionStart, totalDuration, wavesurferRef } from "../../../app/state/refs";
// // import { toBlobURL } from "@ffmpeg/util";
// // import WaveSurfer from 'wavesurfer.js';
// // import RegionsPlugin, { Region } from "wavesurfer.js/dist/plugins/regions";
// // import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js';
// // import WaveSurferPlayer from '@wavesurfer/react';
// // import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// // import React from "react";
// // import { Chuck } from "webchuck";
// // import { Box, Button, Stack, Typography } from '@mui/material';
// // import { useOldMonolithStore } from "../../store/useOldMonolithStore";
// // import { useClipAnalysisStore } from "../../store/useClipAnalysisStore";
// // import { detectBpmFromWavesurfer } from "../../utils/bpmDetect";

// // type FileWindowProps = {
// //     uploadedBlob: React.MutableRefObject<Blob | MediaSource >;
// //     getMeydaData: (arrayBuffer: ArrayBuffer) => Promise<any>;
// //     clickedFile: React.MutableRefObject<string | null>;
// //     chuck: Chuck | undefined;
// //     onBpmDetected?: (bpm: number | null) => void;
// //     autoAnalyze?: boolean;
// //     height?: number;
// //     showTimeline?: boolean;
// // }


// // const FileWindow = (props: FileWindowProps) => {
// //     const { uploadedBlob, getMeydaData, clickedFile, chuck } = props;
// //     const [isPlaying, setIsPlaying] = useState(false);

// //     const [loaded, setLoaded] = useState(false);
// //     const [isLoading, setIsLoading] = useState(false);
// //     const [wavesurfer, setWavesurfer] = useState<any>(null);

// //     const [audioUrl, setAudioUrl] = useState<string | null>(null);
// //     const setSampleFileName = useOldMonolithStore(s => s.setSampleFileName);
// //     const setSampleVoiceEnabled = useOldMonolithStore(s => s.setSampleVoiceEnabled);
// //     const setClipAnalysis = useClipAnalysisStore(s => s.setAnalysis);

// //   const { onBpmDetected } = props;

// //   // keep your existing wsRef
// //   const wsRef = useRef<any>(null);

// //   // If you build plugins here, keep refs so you can access Regions
// //   const regionsRef = useRef<any>(null);
// //   const plugins = useMemo(() => {
// //     const regions = RegionsPlugin.create();
// //     regionsRef.current = regions;
// //     const timeline = TimelinePlugin.create({ container: '#timeline' });
// //     return [regions, timeline];
// //   }, []);

// //   // Example: if you use @wavesurfer/react <WaveSurfer plugins={plugins} onReady={(ws)=> wsRef.current = ws } />
// //   // Or if you instantiate manually, assign wsRef.current = ws when created.

// //   const onDetectBpm = useCallback(() => {
// //     const ws = wsRef.current;
// //     if (!ws) {
// //       onBpmDetected?.(null);
// //       return;
// //     }
// //     // Try selected region first
// //     let region: { start: number; end: number } | undefined = undefined;

// //     // Prefer plugin ref if available
// //     const regionsPlugin = regionsRef.current ?? ws?.getActivePlugins?.()?.regions;
// //     const list = regionsPlugin?.getRegions?.() ?? [];
// //     if (list.length > 0) {
// //       const r = list[0];
// //       region = { start: r.start, end: r.end };
// //     }

// //     const bpm = detectBpmFromWavesurfer(ws, region, { hopSize: 2048, minWindowSec: 2 });
// //     onBpmDetected?.(bpm ?? null);
// //   }, [onBpmDetected]);

// //   // Render your UI; for convenience, add a small button somewhere:
// //   // <Button onClick={onDetectBpm}>Detect BPM</Button>

// //     // const onDetectBpm = () => {
// //     //     const ws = wsRef.current;
// //     //     const regions = ws?.getActivePlugins?.().regions?.getRegions?.() ?? [];
// //     //     const region = regions[0] ? { start: regions[0].start, end: regions[0].end } : undefined;
// //     //     const bpm = detectBpmFromWavesurfer(ws, region, { hopSize: 2048, minWindowSec: 2.0 });
// //     //     props.onBpmDetected?.(bpm ?? null);
// //     // };

// //     useMemo(() => {
// //         if (uploadedBlob.current) {
// //             const url = URL.createObjectURL(uploadedBlob.current);
// //             url && setAudioUrl(url);
// //             return () => URL.revokeObjectURL(url);
// //         }
// //     }, [uploadedBlob]);

// //     const load = async () => {
// //         setIsLoading(true);
// //         const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";
// //         const ffmpeg = ffmpegRef.current;
// //         ffmpeg.on("log", ({ message }: any) => {
// //             if (messageRef.current) messageRef.current.innerHTML = message;
// //         });
// //         // toBlobURL is used to bypass CORS issue, urls with the same
// //         // domain can be used directly.
// //         await ffmpeg.load({
// //             coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
// //             wasmURL: await toBlobURL(
// //             `${baseURL}/ffmpeg-core.wasm`,
// //             "application/wasm"
// //             ),
// //         });
// //         setLoaded(true);
// //         setIsLoading(false);
// //     }; 
        
// //     function readArrayBufferAsFile(arrayBuffer: ArrayBuffer) {
// //         const decoder = new TextDecoder('utf-8');
// //         const fileContent = decoder.decode(arrayBuffer);
// //         return fileContent;
// //     };

// //     async function uploadAudioFile(blob: Blob, name: string) {
// //         // Backend temporarily disabled: safely no-op to avoid failing when FastAPI isn't running.
// //         // To re-enable, point to your FastAPI endpoint and remove this early return.
// //         // Endpoint expected by backend (no trailing slash): /analyze_audio
// //         if (!name.endsWith('.wav')) {
// //             console.error('Only WAV files are supported ', name, "BLOB: ", blob);
// //             return;
// //         }
// //         console.info('[backend disabled] analyze_audio skipped for', name);
// //         return;
// //     }

// //     async function transposeAudio() {
// //         // Backend temporarily disabled: safely no-op.
// //         const filename = filesToProcess.current[filesToProcess.current.length - 1]?.filename;
// //         console.info('[backend disabled] transpose_sample skipped for', filename);
// //         return;
// //     }

// //     async function testAudio() {
// //         const start: number | any = regionStart.current; 
// //         const end: number | any = regionEnd.current;
// //         // alert("TEST AUDIO: " + [start, end].toString());
// //         regionsPlugin[0].getRegions().forEach((region: Region) => {
// //             // (region as any).play({ loop: true });
                
            
            
// //             (region as any).play({ loop: true });

// //             console.log("REGION PLAYED: ", region);

// //         });
// //     };

// //     async function clipAudio() {
// //         const start: number | any = regionStart.current; 
// //         const end: number | any = regionEnd.current;
                
// //         if (!start ||!end ) return;
        
// //         const duration = end - start;
// //         if (duration > 5) {
// //             alert("Max clip length is 5s");
// //             return;
// //         }

// //         const ffmpeg = ffmpegRef.current;
// //         console.log("File to proc 1?: ", filesToProcess.current);
// //         const audioFile = filesToProcess.current[filesToProcess.current.length - 1];
// //         console.log("trying to clip audio: ", audioFile, "START: ", start, "END: ", end);
// //         const clonedBuffer = audioFile.data.slice(0); 
// //         try {
// //             // Write the audio file to the FFmpeg wasm file system
// //             await ffmpeg.writeFile(
// //                 audioFile.filename,
// //                 clonedBuffer
// //             );
            
// //             // Run the FFmpeg command
// //             await ffmpeg.exec([
// //                 '-i', audioFile.filename,
// //                 '-ss', start.toString(), // Start time
// //                 '-t', (end - start).toString(), // Duration
// //                 '-c', 'copy',
// //                 '-f','wav',
// //                 // 'clipped_audio.mp3'
// //                 `clipped_${audioFile.filename}`
// //             ]);
        
// //             // Read the clipped audio file
// //             const clippedAudio: any = (await ffmpeg.readFile(`clipped_${audioFile.filename}`, 'binary')) as Uint8Array;
// //                 console.log("CLIPPED AUDIO: ", clippedAudio);
// //             if (clippedAudio) {
// //             // Create a blob from the clipped audio
// //             const blob = new Blob([clippedAudio], { type: 'audio/wav' });
            
// //             // Create a URL for the clipped audio
// //             const url = URL.createObjectURL(blob);

// //             const response = await fetch(URL.createObjectURL(blob));
// //             const arrayBuffer = await response.arrayBuffer();

// //             const newClippedFile = readArrayBufferAsFile(arrayBuffer);
// //             await uploadAudioFile(blob, `${audioFile.filename.split('.').slice(0,-1).join(',')}_clipped.wav`);
// //             ///// remove below if causing troubles
// //             filesToProcess.current.push({
// //                 data: clippedAudio,
// //                 filename: `${audioFile.filename.split('.').slice(0,-1).join(',')}_clipped.wav`,
// //                 processed: false,
// //             });
// //             chuck && chuck.createFile("", `${audioFile.filename.split('.').slice(0,-1).join(',')}_clipped.wav`, clippedAudio);
// //             ////////////////////////////////////////
// //             const clippedAudioMeydaData = await getMeydaData(arrayBuffer);
// //             console.log("*** CLIPPED AUDIO MEYDA DATA: ", clippedAudioMeydaData);
// //             try {
// //                 setClipAnalysis(`${audioFile.filename.split('.').slice(0,-1).join(',')}_clipped.wav`, clippedAudioMeydaData);
// //             } catch {}
            
// //             // Save the clipped audio or play it
// //             const a = document.createElement('a');
// //             a.href = url;
// //             a.download = `clipped_${audioFile.filename}`;
// //             a.click();

// //             // Connect to Sample Voice UX: auto-select new clip and enable
// //             try {
// //                 const newName = `${audioFile.filename.split('.').slice(0,-1).join(',')}_clipped.wav`;
// //                 setSampleFileName(newName);
// //                 setSampleVoiceEnabled(true);
// //             } catch {}
// //             } else {
// //             console.error('Error: clipped audio is null or undefined');
// //             }
// //         } catch (error) {
// //             console.error('Error clipping audio:', error);
// //         }
// //     }
    
// //     const onReady = (ws: any) => {
// //         console.log("WAVESURFER READY: ", ws);
// //         if (ws) {  
// //             console.log("WAVESURFER PLUGINS: ", ws.plugins);   
            
            
// //             // zoom so ~10s fit in the container
// //             ws.zoom(100); // each second = 100px, tweak to taste
// //             ws.setOptions({
// //                 scrollParent: true, // enable horizontal scroll
// //                 normalize: true,
// //             });

// //             // Add region through the Regions plugin
// //             const regionsPlugin = ws.getActivePlugins().regions;


// //             const region = ws.plugins[0].addRegion({
// //             // const region = regionsPlugin.addRegion({
// //                 start: 0,
// //                 end: 0.3,
// //                 drag: true,
// //                 resize: true,
// //                 color: 'rgba(0, 255, 0, 0.5)',
// //             });
    
// //             region.on("update", (e: any) => {
// //                 console.log('Region clicked!', e);
// //             });
    
// //             region.on("update-end", () => {
// //                 regionStart.current = region.start;
// //                 regionEnd.current = region.end;
// //                 totalDuration.current = region.totalDuration;
// //                 clippedDuration.current = region.end - region.start;
// //                 // clipAudio(region.start, region.end);
// //                 console.log('Finished dragging/resizing!', region);
// //             });

// //             region.on("play", function(this: Region) {
// //                 console.log('PLAY WORKS!!', this as any);
// //                 setIsPlaying(true);
// //             });
    
// //             console.log("Region listeners (for info):", region);
        
// //         }
// //         wavesurferRef.current = ws;

// //         if ((
// //             wavesurferRef.current !== wavesurfer) && 
// //             wavesurferRef.current && 
// //             !wavesurfer
// //         ) {
// //             setWavesurfer(wavesurferRef.current)
// //         }
// //         // setIsPlaying(false)
// //     }
    
// //     const onPlayPause = () => {
// //         console.log("wavesurfer ref current: ", wavesurferRef.current);
// //         wavesurferRef.current && wavesurferRef.current.playPause()
// //     }
    
// //     const regionsPlugin = useMemo(() => [RegionsPlugin.create()], []);
// //     useEffect(() => {
// //         load();
// //         // const regionsPlugin = useMemo(() => [RegionsPlugin.create()], []);
// //     }, []);

// //     useEffect(() => {
// //         if (!clickedFile) return;
// //         const theFile: any = Object.values(clickedFile).map((i:any) => i[0]);
// //         console.log("clicked file: ", theFile);
// //         theFile && fetch(theFile)
// //             .then(response => response.arrayBuffer())
// //             .then(buffer => {
// //                 const uint8Array = new Uint8Array(buffer);
// //                 console.log("*** CLICKED FILE BUFFER: ", uint8Array);
// //                 // WebChucK.FS_createDataFile('/', 'my_audio.wav', uint8Array, true, true);
// //        });
// //     }, [clickedFile]);

// //     return (
         
// //             <Box
// //                 id="waveSurferContainer"
// //                 sx={{
// //                     display: "block",
// //                     zIndex: 9999,
// //                     position: "relative",
// //                     background: "rgba(28,28,28,0.98)",
// //                     pointerEvents: "auto",
// //                     // overflow: "hidden",
// //                 }}
// //             >
// //                 <Button style={{zIndex: 9999}} onClick={testAudio}>
// //                     Play
// //                 </Button>
// //                 <Button style={{zIndex: 9999}} onClick={clipAudio}>
// //                     Clip
// //                 </Button>
// //                 <Button style={{zIndex: 9999}} onClick={transposeAudio}>
// //                     Transpose
// //                 </Button>
// //                 <WaveSurferPlayer
// //                     height={100}
// //                     waveColor="#4d91ff"
// //                     progressColor="#4D91ff"
// //                     url={audioUrl || undefined}
// //                     onReady={onReady}
// //                     onPlay={() => setIsPlaying(true)}
// //                     onPause={() => setIsPlaying(false)}
// //                     onPlayPause={onPlayPause}
// //                     plugins={regionsPlugin}
// //                 />
// //             </Box>
// //     );
// // }
// // export default React.memo(FileWindow);;
// // src/components/OldParentMonolith/OldFileWindow.tsx


// // Waveform + Regions + optional BPM detect
// import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
// import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
// import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js';
// import WaveSurfer from 'wavesurfer.js';
// import { Box, Button, Stack, Typography } from '@mui/material';
// import { detectBpmFromWavesurfer } from '../../utils/bpmDetect';

// type FileWindowProps = {
//   uploadedBlob: React.MutableRefObject<Blob | null>;
//   getMeydaData?: (fileData: ArrayBuffer) => Promise<any>;
//   clickedFile?: React.MutableRefObject<string | null>;
//   chuck?: any;
//   onBpmDetected?: (bpm: number | null) => void;
//   autoAnalyze?: boolean;
//   height?: number;
//   showTimeline?: boolean;
// };

// export default function FileWindow({
//   uploadedBlob,
//   getMeydaData,
//   clickedFile,
//   chuck,
//   onBpmDetected,
//   autoAnalyze = false,
//   height = 96,
//   showTimeline = true,
// }: FileWindowProps) {
//   const containerRef = useRef<HTMLDivElement | null>(null);
//   const wsRef = useRef<WaveSurfer | null>(null);
//   const regionsRef = useRef<any>(null);
//   const timelineRef = useRef<any>(null);
//   const [ready, setReady] = useState(false);
//   const [lastBpm, setLastBpm] = useState<number | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [errorMsg, setErrorMsg] = useState<string | null>(null);

//   const plugins = useMemo(() => {
//     const regions = RegionsPlugin.create();
//     regionsRef.current = regions;
//     const arr: any[] = [regions];
//     if (showTimeline) {
//       const timeline = TimelinePlugin.create({ container: '#wave-timeline', height: 20 });
//       timelineRef.current = timeline;
//       arr.push(timeline);
//     }
//     return arr;
//   }, [showTimeline]);

//   const destroy = () => {
//     try {
//       wsRef.current?.destroy?.();
//     } catch {}
//     wsRef.current = null;
//     setReady(false);
//   };

//   const init = useCallback(async () => {
//     destroy();
//     const blob = uploadedBlob.current;
//     if (!blob) {
//       setErrorMsg('No audio loaded yet.');
//       return;
//     }
//     setErrorMsg(null);
//     let arrayBuf: ArrayBuffer;
//     try {
//       arrayBuf = await blob.arrayBuffer();
//     } catch (e) {
//       setErrorMsg('Failed reading audio blob.');
//       return;
//     }

//     const wavesurfer = WaveSurfer.create({
//       container: containerRef.current!,
//       height,
//       waveColor: '#666',
//       progressColor: '#ff4081',
//       cursorColor: '#ddd',
//       barWidth: 2,
//       normalize: true,
//       plugins,
//     });

//     wsRef.current = wavesurfer;

//     wavesurfer.on('ready', () => {
//       setReady(true);
//       // optional auto region spanning entire file
//       if (regionsRef.current && !regionsRef.current.getRegions().length) {
//         regionsRef.current.addRegion({
//           start: 0,
//           end: wavesurfer.getDuration(),
//           color: 'rgba(255,64,129,0.12)',
//           drag: true,
//           resize: true,
//         });
//       }
//       if (autoAnalyze) {
//         handleDetectBpm(); // attempt BPM
//       }
//     });

//     try {
//       wavesurfer.loadBlob(blob);
//     } catch (e) {
//       setErrorMsg('Wavesurfer failed to load blob.');
//     }
//   }, [uploadedBlob, height, plugins, autoAnalyze]);

//   useEffect(() => {
//     if (containerRef.current) {
//       init();
//     }
//     return () => destroy();
//   }, [init]);

//   const handleDetectBpm = useCallback(() => {
//     const ws = wsRef.current;
//     if (!ws) return;
//     setLoading(true);
//     requestAnimationFrame(() => {
//       try {
//         const regionsPlugin = regionsRef.current;
//         const regionsList = regionsPlugin?.getRegions?.() || [];
//         const regionObj = regionsList.length
//           ? { start: regionsList[0].start, end: regionsList[0].end }
//           : undefined;
//         const bpm = detectBpmFromWavesurfer(ws, regionObj, { hopSize: 2048, minWindowSec: 2 });
//         setLastBpm(bpm);
//         onBpmDetected?.(bpm ?? null);
//       } catch (e) {
//         setErrorMsg('BPM detection failed.');
//         onBpmDetected?.(null);
//       } finally {
//         setLoading(false);
//       }
//     });
//   }, [onBpmDetected]);

//   const addMeasureGuides = useCallback(
//     (bpm: number, numerator = 4, denominator = 4, maxMeasures = 16) => {
//       if (!regionsRef.current || !wsRef.current || !bpm) return;
//       // Remove existing measure guides (keep first region if it's selection)
//       const existing = regionsRef.current.getRegions();
//       existing.forEach((r: any) => {
//         if (r.data?.guide === 'measure') r.remove();
//       });
//       const dur = wsRef.current.getDuration();
//       const quarterMs = 60000 / bpm;
//       // denominator: how many quarter notes constitute one "beat" unit
//       const beatMs = (quarterMs * 4) / denominator;
//       const measureMs = beatMs * numerator;
//       const measureSec = measureMs / 1000;
//       let current = 0;
//       let count = 0;
//       while (current < dur && count < maxMeasures) {
//         regionsRef.current.addRegion({
//           start: current,
//           end: Math.min(current + measureSec, dur),
//           color: 'rgba(0,255,200,0.05)',
//           drag: false,
//           resize: false,
//           data: { guide: 'measure', index: count },
//         });
//         current += measureSec;
//         count++;
//       }
//     },
//     []
//   );

//   // Re-render measure guides whenever lastBpm changes
//   useEffect(() => {
//     if (lastBpm) {
//       addMeasureGuides(lastBpm);
//     }
//   }, [lastBpm, addMeasureGuides]);

//   return (
//     <Box sx={{ width: '100%', fontFamily: 'monospace' }}>
//       <Stack direction="row" spacing={1} sx={{ mb: 1, alignItems: 'center' }}>
//         <Button
//           size="small"
//             variant="outlined"
//           disabled={!ready || loading}
//           onClick={handleDetectBpm}
//         >
//           {loading ? 'Detecting…' : 'Detect BPM'}
//         </Button>
//         {lastBpm && (
//           <Typography variant="caption" sx={{ color: 'rgba(245,245,245,0.85)' }}>
//             Detected: {lastBpm} BPM
//           </Typography>
//         )}
//         {!uploadedBlob.current && (
//           <Typography variant="caption" color="warning.main">
//             (Load audio to enable)
//           </Typography>
//         )}
//       </Stack>
//       <div
//         ref={containerRef}
//         style={{
//           position: 'relative',
//           width: '100%',
//           minHeight: `${height + 24}px`,
//           background: 'rgba(20,20,24,0.6)',
//           border: '1px solid #222',
//         }}
//       />
//       {showTimeline && (
//         <div id="wave-timeline" style={{ width: '100%', fontSize: 10, color: '#aaa' }} />
//       )}
//       {errorMsg && (
//         <Typography variant="caption" sx={{ mt: 0.5, color: '#ff6b6b' }}>
//           {errorMsg}
//         </Typography>
//       )}
//     </Box>
//   );
// }

'use client';

import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js';
import WaveSurfer from 'wavesurfer.js';
import { Box, Button, Stack, Typography } from '@mui/material';
import { detectBpmFromWavesurfer } from '../../utils/bpmDetect';

// Import your browser-only loader (added earlier in refs.ts)
import { getFFmpeg } from '../../../app/state/refs'; // adjust path alias if different

type FileWindowProps = {
  uploadedBlob: React.MutableRefObject<Blob | null>;
  getMeydaData?: (fileData: ArrayBuffer) => Promise<any>;
  clickedFile?: React.MutableRefObject<string | null>;
  chuck?: any;
  onBpmDetected?: (bpm: number | null) => void;
  autoAnalyze?: boolean;
  height?: number;
  showTimeline?: boolean;
};

interface ProcFile {
  filename: string;
  data: Uint8Array;
  processed: boolean;
}

export default function FileWindow({
  uploadedBlob,
  getMeydaData,
  clickedFile,
  chuck,
  onBpmDetected,
  autoAnalyze = false,
  height = 96,
  showTimeline = true,
}: FileWindowProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<any>(null);
  const timelineRef = useRef<any>(null);

  // FFmpeg + file tracking (local replacements for old global refs)
  const ffmpegRef = useRef<any | null>(null);
  const filesToProcess = useRef<ProcFile[]>([]);
  const regionStart = useRef<number | null>(null);
  const regionEnd = useRef<number | null>(null);
  const clippedDuration = useRef<number | null>(null);
  const totalDuration = useRef<number | null>(null);

  // UI state
  const [ready, setReady] = useState(false);
  const [lastBpm, setLastBpm] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [clipBusy, setClipBusy] = useState(false);

  // Build plugin array
  const plugins = useMemo(() => {
    const regions = RegionsPlugin.create();
    regionsRef.current = regions;
    const arr: any[] = [regions];
    if (showTimeline) {
      const timeline = TimelinePlugin.create({ container: '#wave-timeline', height: 20 });
      timelineRef.current = timeline;
      arr.push(timeline);
    }
    return arr;
  }, [showTimeline]);

  const destroyWaveSurfer = () => {
    try { wsRef.current?.destroy?.(); } catch {}
    wsRef.current = null;
    setReady(false);
  };

  const initWaveSurfer = useCallback(async () => {
    destroyWaveSurfer();
    const blob = uploadedBlob.current;
    if (!blob) {
      setErrorMsg('No audio loaded yet.');
      return;
    }
    setErrorMsg(null);

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current!,
      height,
      waveColor: '#666',
      progressColor: '#ff4081',
      cursorColor: '#ddd',
      barWidth: 2,
      normalize: true,
      plugins,
    });
    wsRef.current = wavesurfer;

    wavesurfer.on('ready', () => {
      setReady(true);
      // Prefer using wavesurfer API to add regions (safer: ensures wavesurfer is initialized)
      const regPlugin = wsRef.current?.getActivePlugins?.()?.regions ?? regionsRef.current;
      const existingRegions = regPlugin?.getRegions?.() ?? [];
      if (regPlugin && existingRegions.length === 0) {
        if (typeof wsRef.current?.addRegion === 'function') {
          wsRef.current.addRegion({
            start: 0,
            end: wavesurfer.getDuration(),
            color: 'rgba(255,64,129,0.12)',
            drag: true,
            resize: true,
          });
        } else if (typeof regPlugin.addRegion === 'function') {
          regPlugin.addRegion({
            start: 0,
            end: wavesurfer.getDuration(),
            color: 'rgba(255,64,129,0.12)',
            drag: true,
            resize: true,
          });
        }
      }

      // Populate regionStart/regionEnd based on first region
      const regList = (regPlugin?.getRegions?.() ?? []);
      if (regList.length) {
        regionStart.current = regList[0].start;
        regionEnd.current = regList[0].end;
        totalDuration.current = wavesurfer.getDuration();
        clippedDuration.current = regList[0].end - regList[0].start;
      }
      if (autoAnalyze) {
        handleDetectBpm();
      }
    });

    wavesurfer.on('error', (e: any)  => {
      setErrorMsg('Wavesurfer error.');
      console.error('[WaveSurfer] error', e);
    });

    // Track region changes via WaveSurfer events (safer than calling plugin methods pre-init)
    if (typeof wsRef.current?.on === 'function') {
      wsRef.current.on('region-update-end', (region: any) => {
        regionStart.current = region.start;
        regionEnd.current = region.end;
        clippedDuration.current = region.end - region.start;
        totalDuration.current = wsRef.current?.getDuration() ?? null;
      });
    } else if (regionsRef.current && typeof regionsRef.current.on === 'function') {
      regionsRef.current.on('region-update-end', (region: any) => {
        regionStart.current = region.start;
        regionEnd.current = region.end;
        clippedDuration.current = region.end - region.start;
        totalDuration.current = wsRef.current?.getDuration() ?? null;
      });
    }

    try {
      wavesurfer.loadBlob(blob);
    } catch (e) {
      setErrorMsg('Failed to load audio blob.');
    }
  }, [uploadedBlob, height, plugins, autoAnalyze]);

  // Initialize wavesurfer when container mounts / blob changes
  useEffect(() => {
    if (containerRef.current) {
      initWaveSurfer();
    }
    return () => destroyWaveSurfer();
  }, [initWaveSurfer]);

  // FFmpeg lazy init (only when needed)
  const initFFmpeg = useCallback(async () => {
    if (ffmpegLoaded || ffmpegRef.current) return;
    try {
      setLoading(true);
      const ffmpeg = await getFFmpeg();
      ffmpegRef.current = ffmpeg;
      setFfmpegLoaded(true);
    } catch (e) {
      console.error('[FFmpeg] load failed', e);
      setErrorMsg('FFmpeg failed to initialize.');
    } finally {
      setLoading(false);
    }
  }, [ffmpegLoaded]);

  // BPM detection
  const handleDetectBpm = useCallback(() => {
    const ws = wsRef.current;
    if (!ws) return;
    setLoading(true);
    requestAnimationFrame(() => {
      try {
        const regionsPlugin = regionsRef.current;
        const regionsList = regionsPlugin?.getRegions?.() || [];
        const regionObj = regionsList.length
          ? { start: regionsList[0].start, end: regionsList[0].end }
          : undefined;
        const bpm = detectBpmFromWavesurfer(ws, regionObj, { hopSize: 2048, minWindowSec: 2 });
        setLastBpm(bpm);
        onBpmDetected?.(bpm ?? null);
      } catch (e) {
        setErrorMsg('BPM detection failed.');
        onBpmDetected?.(null);
      } finally {
        setLoading(false);
      }
    });
  }, [onBpmDetected]);

  // Clip audio using current region bounds
  const handleClip = useCallback(async () => {
    if (!ffmpegRef.current) {
      await initFFmpeg();
      if (!ffmpegRef.current) return;
    }
    if (!regionStart.current || !regionEnd.current) {
      setErrorMsg('No region selected.');
      return;
    }
    const start = regionStart.current;
    const end = regionEnd.current;
    const duration = end - start;
    if (duration > 5) {
      setErrorMsg('Max clip length is 5s');
      return;
    }
    const blob = uploadedBlob.current;
    if (!blob) {
      setErrorMsg('No source audio.');
      return;
    }
    setClipBusy(true);
    setErrorMsg(null);

    try {
      const ffmpeg = ffmpegRef.current;
      // Choose a filename base
      const baseName = 'input.wav';
      const srcBuf = new Uint8Array(await blob.arrayBuffer());
      // Write source file
      await ffmpeg.writeFile(baseName, srcBuf);
      // Execute trim
      const clipName = `clip_${Date.now()}.wav`;
      await ffmpeg.exec([
        '-i', baseName,
        '-ss', start.toString(),
        '-t', duration.toString(),
        '-c', 'copy',
        '-f', 'wav',
        clipName
      ]);

// clippedData is what ffmpeg.readFile returns (Uint8Array-like).
const clippedData = await ffmpeg.readFile(clipName) as Uint8Array;

// Keep using clippedData for filesToProcess and WebChucK:
filesToProcess.current.push({
  filename: clipName,
  data: clippedData,
  processed: false
});
if (chuck) {
  try { chuck.createFile('', clipName, clippedData); } catch {}
}

// For Blob, force a clean ArrayBuffer (TS-safe; no ArrayBufferLike)
const ab: ArrayBuffer = (() => {
  const out = new ArrayBuffer(clippedData.byteLength);
  new Uint8Array(out).set(clippedData);
  return out;
})();

const clipBlob = new Blob([ab], { type: 'audio/wav' });

// Example: download link
const link = document.createElement('a');
link.href = URL.createObjectURL(clipBlob);
link.download = clipName;
link.click();
URL.revokeObjectURL(link.href);

// Optional: analysis
if (getMeydaData) {
  const arr = await clipBlob.arrayBuffer();
  try {
    const analysis = await getMeydaData(arr);
    console.log('[Clip analysis]', analysis);
  } catch (e) {
    console.warn('[Meyda] analysis failed', e);
  }
}
      // If you want to send to backend, add code here (currently disabled)
      // Provide download link
      //const link = document.createElement('a');
      link.href = URL.createObjectURL(clipBlob);
      link.download = clipName;
      link.click();
      URL.revokeObjectURL(link.href);

    } catch (e) {
      console.error('[Clip] error', e);
      setErrorMsg('Clip failed.');
    } finally {
      setClipBusy(false);
    }
  }, [uploadedBlob, initFFmpeg, getMeydaData]);

  // Optional auto-init FFmpeg when user loads audio (defer to clip action to save startup cost)
  // useEffect(() => {
  //   if (uploadedBlob.current) initFFmpeg();
  // }, [uploadedBlob, initFFmpeg]);

  // Recompute measure guides if BPM updated (reuse existing pattern)
  const addMeasureGuides = useCallback(
    (bpm: number, numerator = 4, denominator = 4, maxMeasures = 16) => {
      if (!wsRef.current || !bpm) return;
      const regPlugin = wsRef.current?.getActivePlugins?.()?.regions ?? regionsRef.current;
      if (!regPlugin) return;
      // Remove existing measure guides
      const existing = regPlugin.getRegions?.() ?? [];
      existing.forEach((r: any) => {
        if (r.data?.guide === 'measure') r.remove();
      });
      const dur = wsRef.current.getDuration();
      const quarterMs = 60000 / bpm;
      const beatMs = (quarterMs * 4) / denominator;
      const measureMs = beatMs * numerator;
      const measureSec = measureMs / 1000;
      let current = 0;
      let count = 0;
      while (current < dur && count < maxMeasures) {
        if (typeof wsRef.current.addRegion === 'function') {
          wsRef.current.addRegion({
            start: current,
            end: Math.min(current + measureSec, dur),
            color: 'rgba(0,255,200,0.05)',
            drag: false,
            resize: false,
            data: { guide: 'measure', index: count },
          });
        } else if (typeof regPlugin.addRegion === 'function') {
          regPlugin.addRegion({
            start: current,
            end: Math.min(current + measureSec, dur),
            color: 'rgba(0,255,200,0.05)',
            drag: false,
            resize: false,
            data: { guide: 'measure', index: count },
          });
        }
        current += measureSec;
        count++;
      }
    },
    []
  );

  useEffect(() => {
    if (lastBpm) addMeasureGuides(lastBpm);
  }, [lastBpm, addMeasureGuides]);

  // Optional respond to clickedFile (legacy code stub)
  useEffect(() => {
    if (!clickedFile?.current) return;
    // Example: handle external selection
    // console.log('[clickedFile]', clickedFile.current);
  }, [clickedFile]);

  return (
    <Box sx={{ width: '100%', fontFamily: 'monospace', position: 'relative' }}>
      <Stack direction="row" spacing={1} sx={{ mb: 1, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button
          size="small"
          variant="outlined"
          disabled={!ready || loading}
          onClick={handleDetectBpm}
        >
          {loading ? 'Detecting…' : 'Detect BPM'}
        </Button>
        <Button
          size="small"
          variant="outlined"
          disabled={!ready || clipBusy}
          onClick={handleClip}
        >
          {clipBusy ? 'Clipping…' : 'Clip Region'}
        </Button>
        {!ffmpegLoaded && (
          <Button
            size="small"
            variant="outlined"
            disabled={loading || ffmpegLoaded}
            onClick={initFFmpeg}
          >
            {loading ? 'Loading FFmpeg…' : 'Init FFmpeg'}
          </Button>
        )}
        {lastBpm && (
          <Typography variant="caption" sx={{ color: 'rgba(245,245,245,0.85)' }}>
            BPM: {lastBpm}
          </Typography>
        )}
        {!uploadedBlob.current && (
          <Typography variant="caption" color="warning.main">
            (Load audio to enable)
          </Typography>
        )}
        {ffmpegLoaded && (
          <Typography variant="caption" sx={{ color: '#66d28f' }}>
            ffmpeg ready
          </Typography>
        )}
      </Stack>
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          minHeight: `${height + 24}px`,
          background: 'rgba(20,20,24,0.6)',
          border: '1px solid #222',
        }}
      />
      {showTimeline && (
        <div id="wave-timeline" style={{ width: '100%', fontSize: 10, color: '#aaa' }} />
      )}
      {errorMsg && (
        <Typography variant="caption" sx={{ mt: 0.5, color: '#ff6b6b' }}>
          {errorMsg}
        </Typography>
      )}
    </Box>
  );
}