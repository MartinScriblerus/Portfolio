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
    setupAudioAnalysisWorklet(audioContext, setMeydaData).then(() => {
      if (processor) return;
      processor = new AudioWorkletNode(audioContext, 'meyda-audio-processor');
      if (!workerRef.current) {
        workerRef.current = new Worker('/workers/meydaWorker.js', { type: 'module' });
        // workerRef.current.onmessage = (e: MessageEvent) => {
        //   // Placeholder for potential heavy processing results
        //   // console.log('Meyda worker message:', e.data);
        // };
        workerRef.current.onmessage = (e: MessageEvent) => {
          const { amp, centroid, onset, bpm, flux } = e.data || {};

          // Single producer for amplitude (smoothing + clamp)
          if (typeof amp === 'number') {
            const prev = (window as any).__audioAmp ?? 0;
            const smoothed = prev + (amp - prev) * 0.2;
            (window as any).__audioAmp = Math.min(1, Math.max(0, smoothed * 3.2));
          }

          // Accumulate other features for visuals/timing
          (window as any).__hydraFeatures = {
            ...(window as any).__hydraFeatures,
            centroid,
            onset,
            bpm,
            flux
          };

          // Optional: push to stores if you want global timing/pulse
          try {
            if (onset) {
              useSignalBus.getState().registerOnsetPulse?.();
              // e.g., useSignalBus.getState().registerOnsetPulse?.();
            }
            if (typeof bpm === 'number' && bpm > 30 && bpm < 300) {
              // e.g., useTimingStore.getState().setBpmExternal?.(bpm);
            }
          } catch {}
        };
      }

      // Connect ChucK graph to processor and destination
      chuckRef.current && chuckRef.current.connect(processor);
      processor.connect(audioContext.destination);

      processor.port.onmessage = (event: MessageEvent) => {
            if ((event as any).data?.audioData) {
          const audioData = (event as any).data.audioData as Float32Array;
          // Provide raw time-domain frames to optional consumer (e.g., for visualization)
          try { onAudioFrame && onAudioFrame(audioData.slice(0)); } catch {}
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
            setMeydaData(features || null);

            if (workerRef.current) {
              workerRef.current.postMessage({
                audioData: audioData.slice(0),
                sampleRate: audioContext.sampleRate,
                features,
              });
            }

            // --- Hydra amplitude bridge (impact driver) ---
            // if (features && typeof features.rms === 'number') {
            //   // Mild scaling + clamp; tune scalar for sensitivity.
            //   const raw = features.rms;
            //   // Optional smoothing to avoid flicker:
            //   const prev = (window as any).__audioAmp ?? 0;
            //   const SMOOTH_A = 0.2; // higher = more responsive
            //   const smoothed = prev + (raw - prev) * SMOOTH_A;
            //   (window as any).__audioAmp = Math.min(1, Math.max(0, smoothed * 3.2)); // scale factor boosts typical rms (~0.01–0.08) into visible range
            //   (window as any).__hydraFeatures = {
            //     rms: raw,
            //     energy: features.energy,
            //     centroid: features.spectralCentroid,
            //     loudness: Array.isArray(features.mfcc) ? features.mfcc[0] : undefined
            //   };
            // }
          } catch (err) {
            // Swallow transient analysis errors
            // console.error('Meyda analysis error:', err);
          }
        }
      };

      // analyzer = audioContext.createAnalyser();
      // chuckRef.current && chuckRef.current.connect(analyzer);
      // analyzer.connect(audioContext.destination);
    });

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
