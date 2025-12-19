"use client";

import { useEffect, useState } from 'react';
import Meyda, { MeydaFeaturesObject } from 'meyda';
import setupAudioAnalysisWorklet from '../../audio/setupAudioAnalysisWorklet';
import setupAudioWorklet from '../../audio/setupAudioWorklet.js';
import { midiAccess, workerRef } from '../../../app/state/refs';
import { useSignalBus } from '../../store/useSignalBus';

export default function useAudioAnalysisAndMIDI(
  chuckRef: React.MutableRefObject<any>,
  deps: any[] = [],
  onAudioFrame?: (audioData: Float32Array) => void
) {
  const [meydaData, setMeydaData] = useState<Partial<MeydaFeaturesObject> | null>(null);
  const [midiData, setMidiData] = useState<any>(null);

  useEffect(() => {
    // SSR guards
    if (typeof window === 'undefined') return;
    if (!chuckRef.current?.context) return;

    let processor: AudioWorkletNode | null = null;
    let analyzer: AnalyserNode | null = null;

    const audioContext: AudioContext = chuckRef.current.context as AudioContext;

    // Setup Meyda analysis worklet and worker wiring
    let onProcessorMessage: ((e: MessageEvent) => void) | null = null;
    let workerReady = false;
    (async () => {
      // Await the helper which ensures the module is added and returns a node when possible
      const meydaNode: any = await setupAudioAnalysisWorklet(audioContext, setMeydaData);
      if (!meydaNode) return;
      if (processor) return;
      // Use the node returned by the setup helper (it already created/registered the processor)
      processor = meydaNode;
        if (!workerRef.current) {
          // Attempt to create the stream worker. If this fails (e.g. bare imports in the
          // public worker are not resolvable in the browser), fall back to main-thread extraction.
          let created = false;
            try {
            // Use a classic worker (no `type: 'module'`) so the worker can use importScripts
            // (the worker currently tries to load Meyda via importScripts fallback).
            workerRef.current = new Worker('/workers/meydaStreamWorker.js');
            created = true;
              try { (window as any).__meydaDebug = (window as any).__meydaDebug || {}; (window as any).__meydaDebug.workerAttempted = true; (window as any).__meydaDebug.workerCreated = true; } catch {}
          } catch (e) {
            console.warn('[useAudioAnalysisAndMIDI] Meyda stream worker creation failed, falling back to main-thread extraction', e);
            workerRef.current = null;
            created = false;
              try { (window as any).__meydaDebug = (window as any).__meydaDebug || {}; (window as any).__meydaDebug.workerAttempted = true; (window as any).__meydaDebug.workerError = String(e); } catch {}
          }

          if (created && workerRef.current) {
            workerRef.current.onmessage = (e: MessageEvent) => {
              const d = e.data || {};
                try { (window as any).__meydaDebug.workerRunning = true; } catch {}
              if (d?.type === 'features') {
                const pkt = d as { type: string; ts?: number; features?: Record<string, any> };
                const features = pkt.features || null;
                
                // Throttle state updates to 30 FPS to avoid blocking main thread and competing with Babylon
                const now = performance.now();
                if (now - lastStateUpdateRef.current >= MIN_UPDATE_MS) {
                  lastStateUpdateRef.current = now;
                  // Use RAF but schedule it to avoid blocking - let Babylon render first
                  requestAnimationFrame(() => {
                    try { setMeydaData(features as Partial<MeydaFeaturesObject> || null); } catch {}
                  });
                }

                // Shared globals for other visuals
                try {
                  if (features) {
                    const amp = typeof features.rms === 'number' ? features.rms : undefined;
                    const centroid = typeof features.spectralCentroid === 'number' ? features.spectralCentroid : undefined;
                    if (typeof amp === 'number') {
                      const prev = (window as any).__audioAmp ?? 0;
                      const smoothed = prev + (amp - prev) * 0.2;
                      (window as any).__audioAmp = Math.min(1, Math.max(0, smoothed * 3.2));
                    }
                    (window as any).__hydraFeatures = {
                      ...(window as any).__hydraFeatures,
                      centroid: centroid,
                    };
                    if (features.onset) {
                      useSignalBus.getState().registerOnsetPulse?.();
                    }
                  }
                } catch {}
              } else if (d?.type === 'ready') {
                workerReady = true;
                try { (window as any).__meydaDebug = (window as any).__meydaDebug || {}; (window as any).__meydaDebug.ready = true; } catch {}
              } else if (d?.type === 'error') {
                workerReady = false;
                try { (window as any).__meydaDebug = (window as any).__meydaDebug || {}; (window as any).__meydaDebug.error = d.error || true; } catch {}
                console.warn('[useAudioAnalysisAndMIDI] Meyda worker error:', d.error || d);
              }
            };

            // Initialize worker with desired features and hop size
            try {
              workerRef.current.postMessage({ type: 'init', sampleRate: audioContext.sampleRate, hopSize: 1024, features: ['rms','zcr','spectralCentroid','loudness','mfcc','chroma','spectralRolloff'] });
            } catch (e) {
              console.warn('[useAudioAnalysisAndMIDI] Meyda worker init failed, falling back to main-thread extraction', e);
              try { workerRef.current.terminate(); } catch {};
              workerRef.current = null;
            }
          }
        }

      // Connect ChucK graph to processor and destination
      try {
        if (processor) {
          chuckRef.current && chuckRef.current.connect(processor);
          processor.connect(audioContext.destination);
        } else {
          console.warn('[useAudioAnalysisAndMIDI] Processor is not available to connect');
        }
      } catch (e) {
        console.warn('[useAudioAnalysisAndMIDI] Failed to connect processor:', e);
      }

      // Strictly cap updates at 30 FPS to avoid competing with Babylon render loop
      // 1000ms / 30fps = ~33.33ms per frame
      // This ensures audio visualization doesn't slow down Babylon or the grid
      const lastSetRef = { current: 0 } as { current: number };
      const MIN_UPDATE_MS = 1000 / 30; // ~33.33ms for 30 FPS (reduced from 60 to avoid Babylon conflicts)
      const lastStateUpdateRef = { current: 0 } as { current: number };

      // Add a message listener (use addEventListener to avoid overwriting other handlers)
      onProcessorMessage = (event: MessageEvent) => {
        try {
          if ((event as any).data?.audioData) {
            const audioData = (event as any).data.audioData as Float32Array;
            // Provide raw time-domain frames to optional consumer (e.g., for visualization)
            try { onAudioFrame && onAudioFrame(audioData.slice(0)); } catch {}

            // If worker is available, forward raw audio to it for extraction. Otherwise
            // fall back to throttled main-thread Meyda.extract.
                  if (workerRef.current && workerReady) {
                    // Throttle posts to worker to avoid excessive main-thread overhead
                    const now = performance.now();
                    const lastPosted = (window as any).__meydaDebugLastPosted || 0;
                    if (now - lastPosted >= MIN_UPDATE_MS) {
                      try {
                        const f32 = audioData.slice(0);
                        workerRef.current.postMessage({ type: 'audio', f32, ts: now }, [f32.buffer]);
                        (window as any).__meydaDebugLastPosted = now;
                        (window as any).__meydaDebugPosts = ((window as any).__meydaDebugPosts || 0) + 1;
                      } catch (e) {
                        try { workerRef.current.postMessage({ type: 'audio', f32: audioData.slice(0), ts: now }); } catch {}
                      }
                    }
                  } else {
              // Main thread fallback - should NOT be used if worker is available
              // This is a fallback only and should be avoided to keep main thread free for Babylon/grid
              const now = performance.now();
              if (now - lastSetRef.current >= MIN_UPDATE_MS) {
                lastSetRef.current = now;
                // Warn if main thread extraction is being used (indicates worker failure)
                if (!(window as any).__meydaMainThreadWarningShown) {
                  console.warn('[useAudioAnalysisAndMIDI] ⚠️ Main thread extraction active - worker unavailable. This may impact performance.');
                  (window as any).__meydaMainThreadWarningShown = true;
                }
                // Use RAF but schedule it to avoid blocking - let Babylon render first
                requestAnimationFrame(() => {
                  try {
                    const features = Meyda.extract(
                      [
                        'rms',
                        'mfcc',
                        'chroma',
                        'spectralCentroid',
                        'spectralRolloff',
                        'zcr',
                        'energy',
                        'amplitudeSpectrum'
                      ],
                      audioData
                    );
                    // Schedule state update with throttling to avoid blocking
                    const updateNow = performance.now();
                    if (updateNow - lastStateUpdateRef.current >= MIN_UPDATE_MS) {
                      lastStateUpdateRef.current = updateNow;
                      requestAnimationFrame(() => {
                        setMeydaData(features || null);
                      });
                    }
                    // record main-thread extraction stats for debugging
                    (window as any).__meydaDebugMainThreadExtractions = ((window as any).__meydaDebugMainThreadExtractions || 0) + 1;
                  } catch (err) {
                    // swallow transient extraction errors
                  }
                });
              }
            }
          }
        } catch (err) {
          // swallow any unexpected errors in message handling
        }
      };
      try {
        if (processor && processor.port) {
          processor.port.addEventListener?.('message', onProcessorMessage as EventListener);
        } else if (processor && processor.port) {
          try { processor.port.onmessage = onProcessorMessage as any; } catch {}
        } else {
          // no-op if processor is not available
        }
      } catch (e) {
        // swallow
      }

      // analyzer = audioContext.createAnalyser();
      // chuckRef.current && chuckRef.current.connect(analyzer);
      // analyzer.connect(audioContext.destination);
    })();

    // Setup MIDI via WebMIDI + audio worklet
    const setupMIDI = async () => {
      if (!('navigator' in window) || !(navigator as any).requestMIDIAccess) return;
      try {
        const midi = await (navigator as any).requestMIDIAccess();
        midiAccess.current = midi;

        if (!midiAccess.current) return;
        for (const input of midiAccess.current.inputs.values()) {
          chuckRef.current &&
            setupAudioWorklet(chuckRef.current.context as AudioContext, setMidiData).then(
              (midiNode: any) => {
                input.onmidimessage = (event: any) => {
                  midiNode.sendMidiData(event.data);
                };
              }
            );
        }
      } catch (error) {
        // console.error('Failed to get MIDI access:', error);
      }
    };

    setupMIDI();

    return () => {
      try {
        workerRef.current && workerRef.current.terminate();
        workerRef.current = null; 
      } catch {}
      try {
        // Remove message listener if we added one
        if (onProcessorMessage && processor && processor.port && (processor.port as any).removeEventListener) {
          try { (processor.port as any).removeEventListener('message', onProcessorMessage as EventListener); } catch {}
        } else if (onProcessorMessage && processor && processor.port) {
          try { (processor.port as any).onmessage = null; } catch {}
        }
      } catch {}
      try {
        processor && processor.disconnect();
      } catch {}
      // try {
      //   analyzer && analyzer.disconnect();
      // } catch {}
      try {
        if (midiAccess.current) {
          for (const input of midiAccess.current.inputs.values()) {
            input.onmidimessage = null;
          }
        }
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chuckRef, ...deps]);

  return { meydaData, midiData } as const;
}
