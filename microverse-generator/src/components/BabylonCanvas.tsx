declare global {
    interface Window {
        __hydraDebugLastLog?: number;
    }
}

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSignalBus } from '../store/useSignalBus';
import * as BABYLON from '@babylonjs/core';
import { formatNoteNameWithOctave, noteToFreq, makeLetterOverlay } from '../utils/utils';
import { useVisStore } from '../store/useVisStore';
import { BLUE_CHANNEL, GREEN_CHANNEL, LAYOUTS, RED_CHANNEL } from '../constants';
import Title from './Title';
import { useAgentStore } from '../agent/useAgentStore';
import { DECAY_PER_SEC, ENERGY_THRESHOLD, ENTROPY_COOLDOWN_MS, INCREMENT, NEIGHBOR_FACTOR } from './constants';
import { useGuideMetricsStore } from '../store/useGuideMetricsStore';
import { useHudStore } from '../hooks/useHudStore';
import { useTimingStore } from '../hooks/useTimingStore';
import MicrotonesWrapper from './MicrotonesWrapper';
import { Tune } from "../tune";
import { useMicrotonalStore } from '../store/useMicrotonalStore';
import { useLayoutStore } from '../store/useLayoutStore';
import ControlPanel from './ControlPanel';
import HexKeyboard from './HexKeyboard';
import { useOldMonolithStore } from '../store/useOldMonolithStore';
import { Box } from '@mui/material';
import { useBeatGridStore } from '../store/useBeatGridStore';
import { useHydraControlsStore } from '../store/useHydraControlsStore';

export default function BabylonHydraCanvas() {
            // const metrics = useGuideMetricsStore(state => state.metrics);

            // console.log("@@@ [guide] BabylonCanvas initial metrics:", metrics);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const hydraCanvasRef = useRef<HTMLCanvasElement>(null);
    const hexScrollRef = useRef<HTMLDivElement>(null);
    const [hexVisible, setHexVisible] = useState(false);
    const previewCtxRef = useRef<AudioContext | null>(null);
    
    const [titleText, setTitleText] = useState("Find a cube and click it!");
    const [hud, setHud] = useState({ r:0, g:0, b:0, energy:0, impact:0, pulse:0 });
    const [bpm, setBpm] = useState<number>(120);

    // Initialize window variables for music variable access
    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as any).__clickCount = 0;
            (window as any).__bpm = bpm;
        }
    }, []);

    // Microtonal state
    const [tune, setTune] = useState<Tune | any>(null);
    const selectedChordScaleOctaveRange = useRef<any>({
        key: 'C',
        scale: 'Diatonic',
        midi: [],
        notes: [],
        freqs: [],
        octaveMin: '0',  // Original range restored
        octaveMax: '4',  // Original range restored (MIDI 0-127 allows up to octave 9, but keeping original working range)
        chord: 'Major Triad',
    });
    const [mTScaleLength, setMTScaleLength] = useState<number>(0);
  
    // Hextiles
    // Hex keyboard config (dynamically configurable)
    const [showNoteLabels, setShowNoteLabels] = useState<boolean>(true);
    const [tileScale, setTileScale] = useState<number>(2.0); // 2x size as requested
    const stepsPerOctave = useMicrotonalStore(s => s.stepsPerOctave);
    const useSharps = useMicrotonalStore(s => s.useSharps);
    const showFraction = useMicrotonalStore(s => s.showFraction);
    const selectedScale = useMicrotonalStore(s => s.selected);
    const category = useLayoutStore(s => s.category);
    const layoutIndex = useLayoutStore(s => s.layoutIndex);
    const cycleLayout = useLayoutStore(s => s.cycleLayout);
    
    // Beats
    const [clicksTotal, setClicksTotal] = useState<number>(0);
    const setBeatMs = useTimingStore((s:any) => s.setBeatMs);
    const setRGB = useSignalBus(s => s.setRGB);
    const setImpactPulse = useSignalBus(s => s.setImpactPulse);
    // Prefer the shared signal bus for cross-layer metrics
    const busMetrics = useSignalBus(s => s.metrics);
    // Read agent telemetry (vtime/past30 computed in frame loop)
    const telemetry = useAgentStore(s => s.telemetry);

    // // Reset timing flags on mount to avoid HMR-persisted state causing early reveals
    // useEffect(() => {
    //     try { useAgentStore.getState().setTelemetry({ vtime: 0, past30: false }); } catch {}
    // }, []);

    // Simple keyboard controls for quick config tweaks
    useEffect(() => {

        if (!tune && Tune) {
            const getTune = new Tune();
            setTune(getTune);
        }
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'l' || e.key === 'L') setShowNoteLabels(v => !v);
            if (e.key === '[') cycleLayout(-1);
            if (e.key === ']') cycleLayout(1);
            if (e.key === '+' || e.key === '=') setTileScale(s => Math.min(4, s + 0.25));
            if (e.key === '-') setTileScale(s => Math.max(0.5, s - 0.25));
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [cycleLayout]);


    type CubeMeta = {
        mesh: BABYLON.Mesh;
        channels: { r: number; g: number; b: number };
        energy: number;
        lastUpdate: number;
        pulse: number;
    };

    class CubeManager {
        private static _instance: CubeManager | null = null;
        cubes: CubeMeta[] = [];
        maxCubes = 8;
        lastPatternSwitch = 0;
        private constructor(private scene: BABYLON.Scene) {}
        static get(scene: BABYLON.Scene) {
            if (!CubeManager._instance) CubeManager._instance = new CubeManager(scene);
            return CubeManager._instance;
        }
        spawn(position: BABYLON.Vector3) {
            if (this.cubes.length >= this.maxCubes) return null;
            // Create box - Babylon.js will auto-create 12 subMeshes (2 per face)
            const mesh = BABYLON.MeshBuilder.CreateBox(`rgbCube${this.cubes.length}`, { size: 1 }, this.scene);
            mesh.position = position.clone();
            this.applyFaceMaterials(mesh);
            mesh.isPickable = true;
            const meta: CubeMeta = { mesh, channels: { r: 0, g: 0, b: 0 }, energy: 0, lastUpdate: performance.now(), pulse: 0 };
            this.cubes.push(meta);
            return meta;
        }
        private applyFaceMaterials(c: BABYLON.Mesh) {
            const mats: BABYLON.StandardMaterial[] = [];
            const faceDefs: Array<[string,string]> = [
                ['...', RED_CHANNEL], ['...', RED_CHANNEL],
                ['...', GREEN_CHANNEL], ['...', GREEN_CHANNEL],
                ['...', BLUE_CHANNEL], ['...', BLUE_CHANNEL]
            ];
            faceDefs.forEach(([letter, col], idx) => {
                const m = new BABYLON.StandardMaterial(`mat-${c.name}-${idx}`, this.scene);
                m.backFaceCulling = true;
                // Ensure material is fully opaque and visible
                m.alpha = 1;
                m.transparencyMode = BABYLON.Material.MATERIAL_OPAQUE;
                m.emissiveColor = new BABYLON.Color3(1, 1, 1);
                m.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5); // Add some diffuse so faces are visible
                
                if (idx === 2 && hydraCanvasRef.current) {
                    // Show the Hydra/video canvas on one face (e.g., face 2)
                    m.emissiveTexture = new BABYLON.DynamicTexture(
                        `hydra-face-${c.name}`,
                        hydraCanvasRef.current,
                        this.scene,
                        false
                    );
                } else {
                    const letterDT = makeLetterOverlay(this.scene, letter, col);
                    m.emissiveTexture = letterDT;
                }
                
                // Ensure texture is set and material is ready
                if (!m.emissiveTexture) {
                    console.warn(`[CubeManager] Face ${idx} material missing emissiveTexture for ${c.name}`);
                }
                
                mats.push(m);
            });
            const mm = new BABYLON.MultiMaterial(`${c.name}-mm`, this.scene);
            mm.subMaterials.push(...mats);
            c.material = mm;
            
            // Babylon.js CreateBox auto-creates 12 subMeshes when MultiMaterial is set
            // We need to work with these 12 subMeshes and map pairs to our 6 materials
            // After setting material, Babylon.js will have created 12 subMeshes
            // Map them: subMeshes 0,1 -> material 0; 2,3 -> 1; 4,5 -> 2; 6,7 -> 3; 8,9 -> 4; 10,11 -> 5
            
            // Wait a frame for Babylon.js to finish creating subMeshes, then map them
            // Actually, let's just map whatever subMeshes exist
            if (c.subMeshes.length === 12) {
                // Perfect - map pairs to materials
                for (let faceIndex = 0; faceIndex < 6; faceIndex++) {
                    const subMesh1 = c.subMeshes[faceIndex * 2];
                    const subMesh2 = c.subMeshes[faceIndex * 2 + 1];
                    if (subMesh1) subMesh1.materialIndex = faceIndex;
                    if (subMesh2) subMesh2.materialIndex = faceIndex;
                }
            } else if (c.subMeshes.length > 0) {
                // Unexpected count - try to map what we have
                console.warn(`[CubeManager] ${c.name}: Unexpected subMesh count ${c.subMeshes.length}, attempting to map`);
                // Clear and create 6 manually
                c.subMeshes = [];
                const indices = c.getIndices();
                const verticesCount = c.getTotalVertices();
                for (let i = 0; i < 6; i++) {
                    const indexStart = i * 6;
                    const subMesh = new BABYLON.SubMesh(i, 0, verticesCount || 24, indexStart, 6, c);
                    c.subMeshes.push(subMesh);
                }
            } else {
                // No subMeshes - create 6
                const indices = c.getIndices();
                const verticesCount = c.getTotalVertices();
                for (let i = 0; i < 6; i++) {
                    const indexStart = i * 6;
                    const subMesh = new BABYLON.SubMesh(i, 0, verticesCount || 24, indexStart, 6, c);
                    c.subMeshes.push(subMesh);
                }
            }
            
            c.refreshBoundingInfo();
            
            // Ensure all materials are opaque and visible
            mats.forEach((mat, idx) => {
                mat.alpha = 1;
                mat.transparencyMode = BABYLON.Material.MATERIAL_OPAQUE;
                mat.backFaceCulling = true;
                // Ensure emissive color is set so faces are visible
                if (!mat.emissiveColor) {
                    mat.emissiveColor = new BABYLON.Color3(1, 1, 1);
                }
                // Ensure diffuse color is set
                if (!mat.diffuseColor) {
                    mat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
                }
                // Debug: log if any material is missing texture
                if (!mat.emissiveTexture) {
                    console.warn(`[CubeManager] Material ${idx} for ${c.name} is missing emissiveTexture`);
                }
            });
            
            // Force refresh to ensure subMeshes are properly applied
            c.refreshBoundingInfo();
            
            // Final verification and fix: ensure we have exactly 6 subMeshes
            // Babylon.js may auto-create 12 subMeshes, so we force it to 6
            if (c.subMeshes.length !== 6) {
                console.warn(`[CubeManager] ${c.name}: ${c.subMeshes.length} subMeshes but expected 6 - force fixing`);
                // Force clear and recreate exactly 6
                c.subMeshes = [];
                const vCount = c.getTotalVertices();
                const idx = c.getIndices();
                for (let i = 0; i < 6; i++) {
                    const indexStart = i * 6;
                    const subMesh = new BABYLON.SubMesh(i, 0, vCount || 24, indexStart, 6, c);
                    c.subMeshes.push(subMesh);
                }
                c.refreshBoundingInfo();
            }
            
            // Verify final state
            // Note: Having 12 subMeshes with 6 materials is actually OK - pairs share materials
            // But we prefer 6 subMeshes for simplicity
            if (c.subMeshes.length === 12 && mm.subMaterials.length === 6) {
                // This is fine - 12 subMeshes mapped to 6 materials (2 per face)
                // Verify mapping is correct
                let mappingOk = true;
                for (let i = 0; i < 6; i++) {
                    const sm1 = c.subMeshes[i * 2];
                    const sm2 = c.subMeshes[i * 2 + 1];
                    if (!sm1 || !sm2 || sm1.materialIndex !== i || sm2.materialIndex !== i) {
                        mappingOk = false;
                        break;
                    }
                }
                if (!mappingOk) {
                    console.warn(`[CubeManager] ${c.name}: 12 subMeshes but mapping incorrect - fixing`);
                    for (let faceIndex = 0; faceIndex < 6; faceIndex++) {
                        if (c.subMeshes[faceIndex * 2]) c.subMeshes[faceIndex * 2].materialIndex = faceIndex;
                        if (c.subMeshes[faceIndex * 2 + 1]) c.subMeshes[faceIndex * 2 + 1].materialIndex = faceIndex;
                    }
                }
            } else if (c.subMeshes.length !== 6 || mm.subMaterials.length !== 6) {
                console.error(`[CubeManager] ${c.name}: Final state mismatch - ${c.subMeshes.length} subMeshes, ${mm.subMaterials.length} materials`);
            }
        }
        getAverageChannels() {
            if (!this.cubes.length) return { r: 0, g: 0, b: 0, energy: 0 };
            let r=0,g=0,b=0;
            this.cubes.forEach(c => { r += c.channels.r; g += c.channels.g; b += c.channels.b; });
            r /= this.cubes.length; g /= this.cubes.length; b /= this.cubes.length;
            const energy = (r+g+b)/3;
            return { r, g, b, energy };
        }
    }

    useEffect(() => {
        if (!canvasRef.current) return;
        let disposer: (() => void) | undefined;
        // run async setup; capture a cleanup function into `disposer` and return it from the effect
        (async () => {
            const isIntro = true;
            const HydraModule = await import('hydra-synth');
            const Hydra = HydraModule.default;

            // ------------------------------
            // Hydra setup
            // ------------------------------
            const hydraCanvas = document.createElement('canvas');
            hydraCanvas.width = window.innerWidth;
            hydraCanvas.height = window.innerHeight;
            hydraCanvasRef.current = hydraCanvas;

            const hydra = new Hydra({ canvas: hydraCanvas, detectAudio: false, makeGlobal: true });

            console.log("WHAT IS HYDRA? ", hydra);

            const { osc, noise } = hydra.synth;
            // Mutable live average reference so Hydra param functions see updates every frame.
            const currentAvg = { r:0, g:0, b:0, energy:0 };
            const hydraState = { pattern:0, impact:0, hRotAngle: 0, hRotSpeed: 0, kaleidRamp: 1, lastEnergy: 0 };
            // Animate kaleidRamp from 1 down to 0.3 over 3 seconds for visible effect at startup
            let kaleidAnimStart = performance.now();
            function animateKaleidRamp() {
                const now = performance.now();
                const elapsed = (now - kaleidAnimStart) / 1000;
                if (elapsed < 3) {
                    hydraState.kaleidRamp = 1 - 0.7 * (elapsed / 3);
                    requestAnimationFrame(animateKaleidRamp);
                } else {
                    hydraState.kaleidRamp = 10.3;
                }
            }
            animateKaleidRamp();
            const backgroundState = { pulse:0, lastEnergy:0 };
            const saturationMode = { enabled: false }; // placeholder, remains off
            let hydraCamReady = false;
            // Pixel overlay controller: heavy from the start, clears at 22s
            const PX_HEAVY = 220;
            let hydraVideoEl: HTMLVideoElement | null = null;
            let past30 = false;
            let videoStartMs: number | null = null; // fallback when currentTime is unavailable
            // Exponential moving average for smoothing Hydra inputs
            const smoothAvg = { r:0, g:0, b:0, energy:0 };
            const SMOOTH_ALPHA = 0.18; // lower = smoother (more temporal damping for calmer background)
            // Environment sphere radius (read by Hydra rotate speed); start small and expand later
            let environSphereRadius = 25.0;
            function applySmoothing() {
                smoothAvg.r += (currentAvg.r - smoothAvg.r) * SMOOTH_ALPHA;
                smoothAvg.g += (currentAvg.g - smoothAvg.g) * SMOOTH_ALPHA;
                smoothAvg.b += (currentAvg.b - smoothAvg.b) * SMOOTH_ALPHA;
                smoothAvg.energy += (currentAvg.energy - smoothAvg.energy) * SMOOTH_ALPHA;
            }
            // Pull ops/strength and color bias from Zustand store (single source of truth)
            // Allow extra descriptor fields for nested ops (e.g., inner, amount, params)
            type OpCfg = { on: boolean; strength: number; [key: string]: any };
            let ops: Record<string, OpCfg> = useVisStore.getState().ops as any;
            const strengthScale = () => useVisStore.getState().strengthScale();
            let targetBias = useVisStore.getState().targetColorBias;
            let colorBiasWeight = useVisStore.getState().colorBiasWeight;

            // Subscribe to ops/strongMode changes and rebuild pipeline on updates (no visual change if defaults match)
            const unsubscribeVis = useVisStore.subscribe((state, prev) => {
                if (state.ops !== (prev as any)?.ops || state.strongMode !== (prev as any)?.strongMode) {
                    ops = state.ops as any;
                    buildHydraPipeline(hydraState.pattern);
                }
                if (state.targetColorBias !== (prev as any)?.targetColorBias) {
                    targetBias = state.targetColorBias;
                    buildHydraPipeline(hydraState.pattern);
                }
                if (state.colorBiasWeight !== (prev as any)?.colorBiasWeight) {
                    colorBiasWeight = state.colorBiasWeight;
                    buildHydraPipeline(hydraState.pattern);
                }
            });

            // Cache for built chains to avoid infinite loops and improve performance
            // Limit cache size aggressively to prevent memory leaks
            const MAX_CACHE_SIZE = 20; // Reduced from 50
            const chainCache = new Map<string, any>();
            let lastChainHash = '';
            let cacheAccessCount = 0;
            let lastCacheCleanup = performance.now();
            
            // Helper to limit cache size - called more frequently
            const limitCacheSize = () => {
                if (chainCache.size > MAX_CACHE_SIZE) {
                    // Clear entire cache when over limit (more aggressive)
                    chainCache.clear();
                }
            };
            
            // Periodic cache cleanup to prevent memory leaks
            const cleanupCache = () => {
                const now = performance.now();
                if (now - lastCacheCleanup > 5000) { // Every 5 seconds
                    limitCacheSize();
                    lastCacheCleanup = now;
                }
            };
            
            // Subscribe to Hydra controls store changes and rebuild pipeline
            const unsubscribeHydraControls = useHydraControlsStore.subscribe(() => {
                // Invalidate cache when chains change
                const currentChains = useHydraControlsStore.getState().chains;
                const currentHash = JSON.stringify(currentChains.map(c => ({ id: c.id, enabled: c.enabled, parentId: c.parentId, innerSourceId: c.innerSourceId, order: c.order })));
                if (currentHash !== lastChainHash) {
                    chainCache.clear();
                    lastChainHash = currentHash;
                }
                // Rebuild the pipeline whenever chains change
                buildHydraPipeline(hydraState.pattern);
            });

            // ------------------------------
            // Descriptor helpers for nested/stacked ops
            // ------------------------------
            type DynParam = number | { dyn: 'sin' | 'energy' | 'audioAmp'; freq?: number; amp?: number; offset?: number };
            type NodeOp = { op: string; args?: DynParam[] };
            type SourceSpec = { type: 'src' | 'osc' | 'noise' | 'shape' | 'gradient'; args?: DynParam[]; chain?: NodeOp[]; out?: 'o0'|'o1'|'o2'|'s0' };

            function evalParam(p: DynParam, tSec: number): number {
                if (typeof p === 'number') return p;
                if (!p || typeof p !== 'object') return 0;
                const amp = p.amp ?? 1;
                const offset = p.offset ?? 0;
                switch (p.dyn) {
                    case 'sin': {
                        const freq = p.freq ?? 0.2; // Hz
                        const phase = 2 * Math.PI * freq * tSec;
                        return offset + amp * Math.sin(phase);
                    }
                    case 'energy': {
                        return offset + amp * smoothAvg.energy;
                    }
                    case 'audioAmp': {
                        const a = (window as any).__audioAmp ?? 0;
                        return offset + amp * a;
                    }
                    default: return 0;
                }
            }

            function buildArgs(args: DynParam[] | undefined, tSec: number): number[] {
                if (!args || !args.length) return [];
                return args.map(a => evalParam(a, tSec));
            }

            function applyChainOps(base: any, chainOps: NodeOp[] | undefined, tSec: number): any {
                if (!chainOps || !chainOps.length) return base;
                let ch = base;
                for (const step of chainOps) {
                    const op = step.op as string;
                    const args = buildArgs(step.args, tSec) as any[];
                    try {
                        if (typeof (ch as any)[op] === 'function') {
                            ch = (ch as any)[op](...args);
                        }
                    } catch (e) {
                        console.warn('[Hydra inner chain] op failed', op, e);
                    }
                }
                return ch;
            }

            function buildSource(spec: SourceSpec | undefined, tSec: number): any | null {
                if (!spec) return null;
                const gAny: any = globalThis as any;
                try {
                    switch (spec.type) {
                        case 'src': {
                            // support feedback (o0) and camera (s0)
                            const target = spec.out === 's0' ? gAny.s0 : (spec.out === 'o1' ? gAny.o1 : (spec.out === 'o2' ? gAny.o2 : gAny.o0));
                            const base = typeof gAny.src === 'function' ? gAny.src(target) : null;
                            return applyChainOps(base, spec.chain, tSec);
                        }
                        case 'osc': {
                            const args = buildArgs(spec.args, tSec);
                            const base = typeof gAny.osc === 'function' ? gAny.osc(...args) : null;
                            return applyChainOps(base, spec.chain, tSec);
                        }
                        case 'noise': {
                            const args = buildArgs(spec.args, tSec);
                            const base = typeof gAny.noise === 'function' ? gAny.noise(...args) : null;
                            return applyChainOps(base, spec.chain, tSec);
                        }
                        case 'shape': {
                            const args = buildArgs(spec.args, tSec);
                            const base = typeof gAny.shape === 'function' ? gAny.shape(...args) : null;
                            return applyChainOps(base, spec.chain, tSec);
                        }
                        case 'gradient': {
                            const args = buildArgs(spec.args, tSec);
                            const base = typeof gAny.gradient === 'function' ? gAny.gradient(...args) : null;
                            return applyChainOps(base, spec.chain, tSec);
                        }
                        default: return null;
                    }
                } catch (e) {
                    console.warn('[Hydra buildSource] failed', spec, e);
                    return null;
                }
            }

            // Composer that applies enabled ops in a chosen order, with neutral fallbacks when off
            function applyOps(chain: any, order: Array<keyof typeof ops>) {
                const amt = strengthScale();
                const n = noise(() => 0.6 + smoothAvg.energy*0.8 + hydraState.impact*0.6);
                const tSec = performance.now() / 1000;
                for (const key of order) {
                    const cfg = ops[key as string];
                    if (!cfg) continue;
                    const s = cfg.strength * amt;
                    try {
                        switch (key) {
                            case 'saturate': chain = chain.saturate(() => cfg.on ? (1 + (s - 0.5)) : 1); break;
                            case 'contrast': chain = chain.contrast(() => cfg.on ? (1 + (s - 0.5)) : 1); break;
                            case 'brightness': chain = chain.brightness(() => cfg.on ? s : 0); break;
                            case 'hue': chain = chain.hue(() => cfg.on ? (s*2 - 1) : 0); break; // -1..1
                            case 'invert': chain = chain.invert(() => cfg.on ? s : 0); break; // 0..1
                            case 'colorama': chain = chain.colorama(() => cfg.on ? Math.max(0, s*0.5) : 0); break;
                            case 'posterize': {
                                if (cfg.on) {
                                    const levels = Math.max(2, Math.min(32, Math.floor(2 + s*30)));
                                    chain = chain.posterize(levels);
                                }
                                break;
                            }
                            case 'pixelate': {
                                if (cfg.on) {
                                    const px = (bpm / 120) * (2 + Math.floor(s * 180));
                                    chain = chain.pixelate(px, px);
                                }
                                break;
                            }
                            case 'kaleid': {
                                if (cfg.on) {
                                    const sides = Math.max(1, Math.min(16, Math.floor(1 + s*15)));
                                    chain = chain.kaleid(sides);
                                }
                                break;
                            }
                            case 'rotate': chain = chain.rotate(() => cfg.on ? (s*Math.PI) : 0, 0); break;
                            case 'scale': chain = chain.scale(() => cfg.on ? (1 + s*0.75) : 1); break;
                            case 'scrollX': chain = chain.scrollX(() => cfg.on ? (s*0.5) : 0, () => s*0.1); break;
                            case 'scrollY': chain = chain.scrollY(() => cfg.on ? (s*0.5) : 0, () => s*0.1); break;
                            case 'modulate': {
                                if (cfg.on) {
                                    const preferInner = cfg.useInner !== false; // default true
                                    const inner = preferInner && cfg.inner ? buildSource(cfg.inner as any, tSec) : null;
                                    chain = chain.modulate(inner ?? n, () => s);
                                }
                                break;
                            }
                            case 'modulateHue': {
                                if (cfg.on) {
                                    const preferInner = cfg.useInner !== false;
                                    const inner = preferInner && cfg.inner ? buildSource(cfg.inner as any, tSec) : null;
                                    chain = chain.modulateHue(inner ?? n, () => s);
                                }
                                break;
                            }
                            case 'luma': {
                                if (cfg.on) {
                                    const thresh = Math.max(0, Math.min(1, 0.5 + (s - 0.5)));
                                    chain = chain.luma(() => thresh);
                                }
                                break;
                            }
                            case 'modulateScale': {
                                if (cfg.on) {
                                    const preferInner = cfg.useInner !== false;
                                    const inner = preferInner && cfg.inner ? buildSource(cfg.inner as any, tSec) : null;
                                    chain = chain.modulateScale(inner ?? n, () => s);
                                }
                                break;
                            }
                            case 'modulateRepeatX': {
                                if (cfg.on) {
                                    const preferInner = cfg.useInner !== false;
                                    const inner = preferInner && cfg.inner ? buildSource(cfg.inner as any, tSec) : null;
                                    const reps = Math.max(1, Math.min(40, Math.floor(1 + s*20)));
                                    const off = Math.max(0, Math.min(1, s*0.6));
                                    chain = chain.modulateRepeatX(inner ?? n, () => reps, () => off);
                                }
                                break;
                            }
                            case 'modulateRepeatY': {
                                if (cfg.on) {
                                    const preferInner = cfg.useInner !== false;
                                    const inner = preferInner && cfg.inner ? buildSource(cfg.inner as any, tSec) : null;
                                    const reps = Math.max(1, Math.min(40, Math.floor(1 + s*20)));
                                    const off = Math.max(0, Math.min(1, s*0.6));
                                    chain = chain.modulateRepeatY(inner ?? n, () => reps, () => off);
                                }
                                break;
                            }
                            case 'modulateRotate': {
                                if (cfg.on) {
                                    const preferInner = cfg.useInner !== false;
                                    const inner = preferInner && cfg.inner ? buildSource(cfg.inner as any, tSec) : null;
                                    chain = chain.modulateRotate(inner ?? n, () => Math.max(0.01, s));
                                }
                                break;
                            }
                            case 'modulateKaleid': {
                                if (cfg.on) {
                                    const preferInner = cfg.useInner !== false;
                                    const inner = preferInner && cfg.inner ? buildSource(cfg.inner as any, tSec) : null;
                                    chain = chain.modulateKaleid(inner ?? n, () => Math.max(0.01, s));
                                }
                                break;
                            }
                            case 'repeat': {
                                if (cfg.on) {
                                    const x = cfg.params?.x != null ? (typeof cfg.params.x === 'number' ? cfg.params.x : evalParam(cfg.params.x, tSec)) : Math.max(1, Math.floor(1 + s*6));
                                    const y = cfg.params?.y != null ? (typeof cfg.params.y === 'number' ? cfg.params.y : evalParam(cfg.params.y, tSec)) : Math.max(1, Math.floor(1 + s*6));
                                    chain = chain.repeat(() => x, () => y);
                                }
                                break;
                            }
                            // Feedback and compositing with inner source
                            case 'blend': {
                                if (cfg.on) {
                                    const inner = buildSource(cfg.inner as SourceSpec, tSec);
                                    const amount = typeof cfg.amount === 'number' ? cfg.amount : Math.min(1, s);
                                    if (inner) chain = chain.blend(inner, () => amount);
                                }
                                break;
                            }
                            case 'add': {
                                if (cfg.on) {
                                    const inner = buildSource(cfg.inner as SourceSpec, tSec);
                                    const amount = typeof cfg.amount === 'number' ? cfg.amount : Math.min(1, s);
                                    if (inner) chain = chain.add(inner, () => amount);
                                }
                                break;
                            }
                            case 'mult': {
                                if (cfg.on) {
                                    const inner = buildSource(cfg.inner as SourceSpec, tSec);
                                    const amount = typeof cfg.amount === 'number' ? cfg.amount : Math.min(1, s);
                                    if (inner) chain = chain.mult(inner, () => amount);
                                }
                                break;
                            }
                            case 'mask': {
                                if (cfg.on) {
                                    const inner = buildSource(cfg.inner as SourceSpec, tSec);
                                    if (inner) chain = chain.mask(inner);
                                }
                                break;
                            }
                            case 'tapO1': {
                                if (cfg.on) {
                                    const gAny: any = globalThis as any;
                                    if (gAny.o1) chain = chain.out(gAny.o1);
                                }
                                break;
                            }
                            case 'tapO2': {
                                if (cfg.on) {
                                    const gAny: any = globalThis as any;
                                    if (gAny.o2) chain = chain.out(gAny.o2);
                                }
                                break;
                            }
                            default: break;
                        }
                    } catch (e) {
                        console.warn('[Hydra ops] Failed op', key, e);
                    }
                }
                return chain;
            }
            const getAudioAmp = () => {
              const v = (window as any).__audioAmp;
              return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0;
            };
            function buildHydraPipeline(pattern: number) {
                hydraState.pattern = pattern;
                const gAny: any = globalThis as any;
                const amp = getAudioAmp();
                // color with optional target bias mixing
                const mix = (a:number, b:number, t:number)=> a*(1-t) + b*t;
                const biasW = targetBias ? Math.max(0, Math.min(1, colorBiasWeight)) : 0.0;
                // Dynamic repeat count based on agent clicks (sqrt scale, min 1, capped)
                const getRepeatCount = () => {
                    try {
                        const clicks = useAgentStore.getState().telemetry.clicks || 0;
                        const rc = Math.max(1, Math.floor(Math.sqrt(Math.max(0, clicks))));
                        return Math.min(16, rc);
                    } catch { return 1; }
                };

                const minRep = (useAgentStore.getState().telemetry.clicks < 1) ? 4 : 1;

                const clicks = useAgentStore.getState().telemetry.clicks || 0;

                let base = osc(
                        // () => 1.0 + smoothAvg.energy*0.5,
                        // 0.05,
                        () => 1.0 + smoothAvg.energy*0.5 + amp*0.4,
                        () => 0.05 + amp*0.02,
                        0
                    )
                    .color(
                        () => mix(0.055 + smoothAvg.r*0.35, targetBias?.r ?? 0, biasW),
                        () => mix(0.055 + smoothAvg.g*0.35, targetBias?.g ?? 0, biasW),
                        () => mix(0.055 + smoothAvg.b*0.35, targetBias?.b ?? 0, biasW)
                    )
                    .rotate(
                        () => hydraState.hRotSpeed % (2*Math.PI) * -(hydraState.impact + amp*0.3),
                        () => hydraState.hRotSpeed % (2*Math.PI) *  (hydraState.impact + amp*0.3)
                    )
                    .scale(hydraState.impact + 1.0)
                    // Kaleid sides increase as kaleidRamp grows (gradual strengthening)
                    .kaleid(() => {
                            const dyn = 1 + Math.floor(Math.max(0, Math.min(1, hydraState.kaleidRamp)) * 15);
                            return Math.max(4, dyn);
                    })
                    // Repeat count grows with sqrt(clicks) symmetrically on X/Y
                        .repeat(
                            () => {
                                try {
                                    // const clicks = useAgentStore.getState().telemetry.clicks || 0;
                                    const past30 = useAgentStore.getState().telemetry.past30;
                                    const base = (clicks < 1 && !past30) ? 4 : 1;
                                    return Math.max(base, getRepeatCount());
                                } catch { return 4; }
                            },
                            () => {
                                try {
                                    const clicks = useAgentStore.getState().telemetry.clicks || 0;
                                    const past30 = useAgentStore.getState().telemetry.past30;
                                    const base = (clicks < 1 && !past30) ? 4 : 1;
                                    return Math.max(base, getRepeatCount());
                                } catch { return 4; }
                            }
                        )
                    .modulate(noise(() => 1.0 + smoothAvg.energy*1.0 + hydraState.impact*0.55 + backgroundState.pulse*0.035));
                // Optional post ops on base
                base = applyOps(base, ['saturate','contrast','brightness','hue','invert','colorama','posterize','pixelate','kaleid','rotate','scale','scrollX','scrollY','modulate','modulateHue','luma','modulateScale','modulateRotate','modulateKaleid','modulateRepeatX','modulateRepeatY','blend','add','mult','mask']);
                if (hydraCamReady && typeof gAny.src === 'function' && gAny.s0) {
                    // Output ONLY the video/camera source, with stained glass effect, no blend/add with procedural texture
                    try {
                        const hydraControls = useHydraControlsStore.getState();
                        const meydaData = (window as any).__meydaData;
                        
                        // Helper function to apply a single chain operation to a base chain
                        function applyRootChainOperation(
                            baseChain: any,
                            chain: any,
                            allChains: any[],
                            hydraControls: any,
                            meydaData: any
                        ): any {
                            if (!baseChain || !chain.enabled) return baseChain;
                            
                            const getParamValue = (param: string) => {
                                return hydraControls.getChainValue(chain.id, param, meydaData);
                            };
                            
                            if (chain.type === 'transform') {
                                switch (chain.operation) {
                                    case 'repeat':
                                        return baseChain.repeat(
                                            () => getParamValue('x'),
                                            () => getParamValue('y')
                                        );
                                    case 'kaleid':
                                        return baseChain.kaleid(() => getParamValue('sides'));
                                    case 'pixelate':
                                        const px = getParamValue('amount');
                                        return baseChain.pixelate(() => px, () => px);
                                    case 'rotate':
                                        return baseChain.rotate(
                                            () => getParamValue('angle'),
                                            () => getParamValue('speed')
                                        );
                                    case 'scale':
                                        return baseChain.scale(() => getParamValue('amount'));
                                    case 'scrollX':
                                        return baseChain.scrollX(
                                            () => getParamValue('amount'),
                                            () => getParamValue('speed')
                                        );
                                    case 'scrollY':
                                        return baseChain.scrollY(
                                            () => getParamValue('amount'),
                                            () => getParamValue('speed')
                                        );
                                    case 'colorama':
                                        return baseChain.colorama(() => getParamValue('amount'));
                                    case 'saturate':
                                        return baseChain.saturate(() => getParamValue('amount'));
                                    case 'contrast':
                                        return baseChain.contrast(() => getParamValue('amount'));
                                    case 'brightness':
                                        return baseChain.brightness(() => getParamValue('amount'));
                                    case 'hue':
                                        return baseChain.hue(() => getParamValue('amount'));
                                    case 'posterize':
                                        return baseChain.posterize(() => getParamValue('levels'));
                                    case 'invert':
                                        return baseChain.invert(() => getParamValue('amount'));
                                    case 'luma':
                                        return baseChain.luma(() => getParamValue('threshold'));
                                    default:
                                        return baseChain;
                                }
                            } else if (chain.type === 'compositor') {
                                let innerSource: any = null;
                                
                                if (chain.innerSourceId) {
                                    const innerChain = allChains.find(c => c.id === chain.innerSourceId);
                                    if (innerChain && innerChain.enabled) {
                                        // Build the inner source chain recursively
                                        // Start from null to build a new source chain
                                        innerSource = buildChainFromNested(allChains, innerChain.id, null, new Set(), `inner_${chain.innerSourceId}`);
                                    }
                                }
                                
                                // If no inner source was built, use noise as default
                                if (!innerSource) {
                                    innerSource = noise(() => 0.6 + smoothAvg.energy * 0.8);
                                }
                                
                                // Apply the compositor operation
                                switch (chain.operation) {
                                    case 'modulate':
                                        return baseChain.modulate(innerSource, () => getParamValue('amount'));
                                    case 'modulateHue':
                                        return baseChain.modulateHue(innerSource, () => getParamValue('amount'));
                                    case 'modulateScale':
                                        return baseChain.modulateScale(innerSource, () => getParamValue('amount'));
                                    case 'modulateRotate':
                                        return baseChain.modulateRotate(innerSource, () => getParamValue('amount'));
                                    case 'blend':
                                        return baseChain.blend(innerSource, () => getParamValue('amount'));
                                    case 'add':
                                        return baseChain.add(innerSource);
                                    case 'mult':
                                        return baseChain.mult(innerSource);
                                    case 'diff':
                                        return baseChain.diff(innerSource);
                                    case 'layer':
                                        return baseChain.layer(innerSource, () => getParamValue('amount'));
                                    case 'mask':
                                        return baseChain.mask(innerSource);
                                    default:
                                        return baseChain;
                                }
                            }
                            
                            return baseChain;
                        }
                        
                        // Build Hydra chain from nested structure with caching and cycle detection
                        function buildChainFromNested(
                            chains: any[], 
                            parentId: string | undefined, 
                            baseChain: any,
                            visited: Set<string> = new Set(),
                            cacheKey?: string
                        ): any {
                            // Create cache key for this specific build
                            const key = cacheKey || `chain_${parentId || 'root'}_${baseChain ? 'withBase' : 'noBase'}`;
                            
                            // Check cache first (but limit cache size to prevent memory leaks)
                            cacheAccessCount++;
                            cleanupCache(); // Check for cleanup every access
                            if (cacheAccessCount % 50 === 0) {
                                limitCacheSize(); // More frequent cleanup
                            }
                            if (chainCache.has(key)) {
                                return chainCache.get(key);
                            }
                            
                            // Get chains that belong to this parent, sorted by order
                            const childChains = chains
                                .filter(c => c.enabled && c.parentId === parentId)
                                .sort((a, b) => a.order - b.order);
                            
                            let result = baseChain;
                            
                            for (const chain of childChains) {
                                // Cycle detection: if we've already visited this chain, skip it
                                if (visited.has(chain.id)) {
                                    console.warn(`[Hydra] Circular reference detected for chain ${chain.id}, skipping`);
                                    continue;
                                }
                                
                                // Mark as visited
                                visited.add(chain.id);
                                
                                const getParamValue = (param: string) => {
                                    return hydraControls.getChainValue(chain.id, param, meydaData);
                                };
                                
                                // Apply the operation based on type
                                if (chain.type === 'source') {
                                    // If source is nested under video (baseChain exists), add it to video
                                    if (baseChain && chain.operation !== 'src') {
                                        // Build the nested source with its children
                                        const nestedSourceChain = buildChainFromNested(chains, chain.id, null, new Set(visited), `nested_source_${chain.id}`);
                                        if (nestedSourceChain) {
                                            // Add the nested source to the base chain (video)
                                            result = baseChain.add(nestedSourceChain);
                                            visited.delete(chain.id);
                                            continue;
                                        }
                                    }
                                    
                                    // If no baseChain, create a new source chain (root level or inner source)
                                    if (!baseChain) {
                                        // Check cache for this source chain
                                        const sourceCacheKey = `source_${chain.id}`;
                                        if (chainCache.has(sourceCacheKey)) {
                                            result = chainCache.get(sourceCacheKey);
                                            visited.delete(chain.id);
                                            continue;
                                        }
                                        
                                        let sourceChain: any = null;
                                        
                                        switch (chain.operation) {
                                            case 'osc':
                                                // osc(freq, sync, offset) - all can be dynamic
                                                sourceChain = gAny.osc(
                                                    () => getParamValue('freq'),
                                                    () => getParamValue('sync'),
                                                    () => getParamValue('offset')
                                                );
                                                break;
                                            case 'noise':
                                                sourceChain = gAny.noise(() => getParamValue('scale'));
                                                break;
                                            case 'shape':
                                                sourceChain = gAny.shape(
                                                    () => getParamValue('sides'),
                                                    () => getParamValue('radius')
                                                );
                                                break;
                                            case 'gradient':
                                                // gradient() can take a speed parameter
                                                const gradSpeed = getParamValue('speed') ?? 1;
                                                sourceChain = gAny.gradient(() => gradSpeed);
                                                break;
                                            case 'voronoi':
                                                // voronoi(scale, speed)
                                                sourceChain = gAny.voronoi(
                                                    () => getParamValue('scale'),
                                                    () => getParamValue('speed')
                                                );
                                                break;
                                            case 'src':
                                                // src() references the video source (s0)
                                                // Ensure s0 exists and has video
                                                if (gAny.s0) {
                                                    sourceChain = gAny.src(gAny.s0);
                                                } else {
                                                    // Fallback: try to get video from hydra synth
                                                    const hydraSynth = (window as any).hydra?.synth;
                                                    if (hydraSynth?.s0) {
                                                        sourceChain = hydraSynth.src(hydraSynth.s0);
                                                    } else {
                                                        // Last resort: create a solid color
                                                        sourceChain = gAny.solid(0.1, 0.1, 0.1);
                                                    }
                                                }
                                                break;
                                        }
                                        
                                        if (sourceChain) {
                                            // Recursively build children of this source
                                            result = buildChainFromNested(chains, chain.id, sourceChain, new Set(visited), sourceCacheKey);
                                            // Cache the source chain
                                            chainCache.set(sourceCacheKey, result);
                                        }
                                    }
                                } else if (chain.type === 'transform') {
                                    // Transforms chain onto the current result
                                    if (!result) {
                                        visited.delete(chain.id);
                                        continue; // Need a base chain to transform
                                    }
                                    
                                    // Check cache for this transform
                                    const transformCacheKey = `transform_${chain.id}_${result ? 'hasBase' : 'noBase'}`;
                                    if (chainCache.has(transformCacheKey)) {
                                        result = chainCache.get(transformCacheKey);
                                        visited.delete(chain.id);
                                        continue;
                                    }
                                    
                                    const beforeTransform = result;
                                    
                                    switch (chain.operation) {
                                        case 'repeat':
                                            result = result.repeat(
                                                () => getParamValue('x'),
                                                () => getParamValue('y')
                                            );
                                            break;
                                    case 'kaleid':
                                        // kaleid(sides) - segments parameter not used in basic kaleid
                                        result = result.kaleid(() => getParamValue('sides'));
                                        break;
                                    case 'rotate':
                                        result = result.rotate(
                                            () => getParamValue('angle'),
                                            () => getParamValue('speed')
                                        );
                                        break;
                                    case 'scale':
                                        result = result.scale(() => getParamValue('amount'));
                                        break;
                                    case 'scrollX':
                                        result = result.scrollX(
                                            () => getParamValue('amount'),
                                            () => getParamValue('speed')
                                        );
                                        break;
                                    case 'scrollY':
                                        result = result.scrollY(
                                            () => getParamValue('amount'),
                                            () => getParamValue('speed')
                                        );
                                        break;
                                    case 'colorama':
                                        result = result.colorama(() => getParamValue('amount'));
                                        break;
                                    case 'pixelate':
                                        const px = getParamValue('amount');
                                        result = result.pixelate(() => px, () => px);
                                        break;
                                    case 'saturate':
                                            result = result.saturate(() => getParamValue('amount'));
                                            break;
                                        case 'contrast':
                                            result = result.contrast(() => getParamValue('amount'));
                                            break;
                                        case 'brightness':
                                            result = result.brightness(() => getParamValue('amount'));
                                            break;
                                        case 'hue':
                                            result = result.hue(() => getParamValue('amount'));
                                            break;
                                        case 'posterize':
                                            result = result.posterize(() => getParamValue('levels'));
                                            break;
                                        case 'invert':
                                            result = result.invert(() => getParamValue('amount'));
                                            break;
                                        case 'luma':
                                            result = result.luma(() => getParamValue('threshold'));
                                            break;
                                    }
                                    
                                    // Recursively build children of this transform
                                    result = buildChainFromNested(chains, chain.id, result, new Set(visited), transformCacheKey);
                                    
                                    // Cache the transform result
                                    if (result !== beforeTransform) {
                                        chainCache.set(transformCacheKey, result);
                                    }
                                } else if (chain.type === 'compositor') {
                                    // Compositors need inner sources
                                    if (!result) {
                                        visited.delete(chain.id);
                                        continue; // Need a base chain to composite
                                    }
                                    
                                    // Check cache for this compositor
                                    const compositorCacheKey = `compositor_${chain.id}_${chain.innerSourceId || 'noInner'}`;
                                    if (chainCache.has(compositorCacheKey)) {
                                        result = chainCache.get(compositorCacheKey);
                                        visited.delete(chain.id);
                                        continue;
                                    }
                                    
                                    let innerSource: any = null;
                                    
                                    if (chain.innerSourceId) {
                                        const innerChain = chains.find(c => c.id === chain.innerSourceId);
                                        if (innerChain && innerChain.enabled) {
                                            // Build the inner source chain recursively (start from null to build a new source)
                                            // Use a separate visited set for inner source to avoid false cycle detection
                                            innerSource = buildChainFromNested(chains, innerChain.id, null, new Set(), `inner_${chain.innerSourceId}`);
                                        }
                                    }
                                    
                                    // If no inner source, use noise as default
                                    if (!innerSource) {
                                        innerSource = noise(() => 0.6 + smoothAvg.energy * 0.8);
                                    }
                                    
                                    const beforeCompositor = result;
                                    
                                    switch (chain.operation) {
                                        case 'modulate':
                                            result = result.modulate(innerSource, () => getParamValue('amount'));
                                            break;
                                        case 'modulateHue':
                                            result = result.modulateHue(innerSource, () => getParamValue('amount'));
                                            break;
                                        case 'modulateScale':
                                            result = result.modulateScale(innerSource, () => getParamValue('amount'));
                                            break;
                                        case 'modulateRotate':
                                            result = result.modulateRotate(innerSource, () => getParamValue('amount'));
                                            break;
                                        case 'blend':
                                            result = result.blend(innerSource, () => getParamValue('amount'));
                                            break;
                                        case 'add':
                                            result = result.add(innerSource);
                                            break;
                                        case 'mult':
                                            result = result.mult(innerSource);
                                            break;
                                        case 'diff':
                                            result = result.diff(innerSource);
                                            break;
                                        case 'layer':
                                            result = result.layer(innerSource, () => getParamValue('amount'));
                                            break;
                                        case 'mask':
                                            result = result.mask(innerSource);
                                            break;
                                    }
                                    
                                    // Recursively build children of this compositor
                                    result = buildChainFromNested(chains, chain.id, result, new Set(visited), compositorCacheKey);
                                    
                                    // Cache the compositor result
                                    if (result !== beforeCompositor) {
                                        chainCache.set(compositorCacheKey, result);
                                    }
                                }
                                
                                // Remove from visited set after processing
                                visited.delete(chain.id);
                            }
                            
                            // Cache the final result
                            if (result && result !== baseChain) {
                                chainCache.set(key, result);
                            }
                            
                            return result;
                        }
                        
                        // Build chain from root chains (no parent)
                        // Use chains directly from store instead of getChainTree() to avoid creating new arrays
                        const allChains = hydraControls.chains;
                        const rootChains = allChains.filter(c => !c.parentId && c.enabled).sort((a, b) => a.order - b.order);
                        
                        let finalChain: any = null;
                        
                        // If chains exist, use them; otherwise use legacy system
                        if (rootChains.length > 0) {
                            // Separate root chains by type
                            const rootSources = rootChains.filter(c => c.type === 'source').sort((a, b) => a.order - b.order);
                            const rootTransforms = rootChains.filter(c => c.type === 'transform').sort((a, b) => a.order - b.order);
                            const rootCompositors = rootChains.filter(c => c.type === 'compositor').sort((a, b) => a.order - b.order);
                            
                            // ALWAYS start with video as base - it should never disappear
                            // Video is the foundation, procedural sources enhance it
                            // Check if s0 exists, if not create a fallback
                            if (gAny.s0) {
                                finalChain = gAny.src(gAny.s0).color(1, 1, 1);
                            } else {
                                // Fallback: use solid color if video not ready
                                console.warn('[Hydra] s0 not available, using solid fallback');
                                finalChain = gAny.solid(0.1, 0.1, 0.1);
                            }
                            
                            // Find video node (src) - it may be root or have children nested under it
                            const videoNode = rootSources.find(s => s.operation === 'src');
                            
                            if (videoNode) {
                                // Build video node with all its nested children (sources, transforms, compositors)
                                // This handles the case where sources are nested under video
                                finalChain = buildChainFromNested(allChains, videoNode.id, finalChain);
                            }
                            
                            // Also handle any procedural sources that are still at root level (for backward compatibility)
                            // But prefer nested sources under video node
                            for (const source of rootSources) {
                                if (source.operation !== 'src' && source.enabled && !videoNode) {
                                    // Only process root-level sources if there's no video node
                                    // (video node children are already processed above)
                                    const sourceChain = buildChainFromNested(allChains, source.id, null);
                                    if (sourceChain) {
                                        console.log(`[Hydra] Adding root-level ${source.operation}() source to video`);
                                        finalChain = finalChain.add(sourceChain);
                                    }
                                }
                            }
                            
                            // Apply root-level transforms to video (if not already applied via video node)
                            if (!videoNode) {
                                for (const transform of rootTransforms) {
                                    finalChain = applyRootChainOperation(finalChain, transform, allChains, hydraControls, meydaData);
                                    finalChain = buildChainFromNested(allChains, transform.id, finalChain);
                                }
                            }
                            
                            // Apply compositors to the final chain (these combine the chain with inner sources)
                            for (const compositor of rootCompositors) {
                                finalChain = applyRootChainOperation(finalChain, compositor, allChains, hydraControls, meydaData);
                                finalChain = buildChainFromNested(allChains, compositor.id, finalChain);
                            }
                            
                            // Output the final chain
                            if (finalChain) {
                                finalChain.out();
                            } else {
                                base.out();
                            }
                        } else {
                            // Legacy system: apply effects to camera
                            let camLuma = gAny.src(gAny.s0).color(1, 1, 1);
                            
                            const pixelateVal = hydraControls.getEffectValue('pixelate', 'amount', meydaData);
                            const modulateHueVal = hydraControls.getEffectValue('modulateHue', 'amount', meydaData);
                            const invertVal = hydraControls.getEffectValue('invert', 'amount', meydaData);
                            const kaleidSides = hydraControls.getEffectValue('kaleid', 'sides', meydaData);
                            const repeatX = hydraControls.getEffectValue('repeat', 'x', meydaData);
                            const repeatY = hydraControls.getEffectValue('repeat', 'y', meydaData);
                            
                            if (hydraControls.effects.pixelate.enabled) {
                                camLuma = camLuma.pixelate(() => pixelateVal, () => pixelateVal);
                            }
                            if (hydraControls.effects.modulateHue.enabled) {
                                camLuma = camLuma.modulateHue(noise(10), () => modulateHueVal);
                            }
                            if (hydraControls.effects.invert.enabled) {
                                camLuma = camLuma.invert(() => invertVal);
                            }
                            if (hydraControls.effects.kaleid.enabled) {
                                camLuma = camLuma.kaleid(() => kaleidSides);
                            }
                            if (hydraControls.effects.repeat.enabled) {
                                camLuma = camLuma.repeat(() => repeatX, () => repeatY);
                            }
                            
                        // Always apply camera ops
                        camLuma = applyOps(camLuma, ['saturate','contrast','brightness','hue','posterize','invert','modulateHue','luma']);
                        camLuma.out();
                        }
                    } catch (err) {
                        console.warn('[Hydra] camera branch error; falling back to base', err);
                        base.out();
                    }
                } else {
                    base.out();
                }
            }
            // Force global sources/functions available (makeGlobal: true passed above)
            // Use webcam via global s0 instead of indexing hydra internals which may not yet exist.
            // Guard in case globals were not created for some reason.
            const g: any = globalThis as any;
            if (typeof g.s0?.initCam === 'function') {
                try {
                    // await g.s0.initCam();
                   
                    // if (!isCameraOn) {
                    // Load video - use proxy directly (more reliable for CORS)
                    const videoUrl = "https://dn790002.ca.archive.org/0/items/0037_Gift_of_Green_13_00_46_00/0037_Gift_of_Green_13_00_46_00.mp4";
                    const proxyUrl = `/api/video-proxy?url=${encodeURIComponent(videoUrl)}`;
                    
                    try {
                        // Use proxy first (handles CORS properly)
                        hydraVideoEl = await g.s0.initVideo(proxyUrl);
                        console.log('[Hydra] Video loaded via proxy');
                    } catch (proxyErr: any) {
                        // If proxy fails, try direct (might work in some browsers)
                        try {
                            console.log('[Hydra] Proxy failed, trying direct load...');
                            hydraVideoEl = await g.s0.initVideo(videoUrl);
                            console.log('[Hydra] Video loaded directly');
                        } catch (directErr: any) {
                            console.error('[Hydra] Both proxy and direct load failed:', directErr);
                            hydraVideoEl = null;
                        }
                    }
                    // } else {
                        // StateVideoEl = await g.s0.initCam();
                    // } 
                    videoStartMs = performance.now();
                    hydraCamReady = hydraVideoEl !== null;
                    console.log('Hydra webcam started --> now for Audio');
                    try {
                        if (hydraVideoEl) {
                            // Improve autoplay chances
                            hydraVideoEl.muted = true;
                             hydraVideoEl.volume = 0;
                            await hydraVideoEl.play();
                        }
                    } catch {}
                    // Build pipeline now that camera/video is ready
                    buildHydraPipeline(hydraState.pattern);
                    // tryGetAudio();
                } catch (err) {
                    console.warn('Failed to init cam on s0:', err);
                }
            } else {
                console.warn('s0 global source not available yet; skipping webcam init');
            }

            // If Hydra globals exist but no camera yet, rely on our pipeline's osc base; else fall back to a faint osc.
            if (typeof (globalThis as any).osc === 'function' && !hydraCamReady) {
                // Optional: keep a faint baseline only if pipeline isn't built yet
            }

            console.log('Hydra instance ready (globals?):', { s0: g.s0, srcFn: typeof g.src });


            // initial pipeline build with zeroed averages
            buildHydraPipeline(0);

            // Minimal keyboard toggles for demo:
            const onKey = (e: KeyboardEvent) => {
                const k = e.key.toLowerCase();
                const store = useVisStore.getState();
                switch (k) {
                    case '1': store.setStrongMode(!store.strongMode); console.log('Strength scale', store.strengthScale()); break;
                    case 's': store.toggleOp('saturate' as any); break;
                    case 'c': store.toggleOp('contrast' as any); break;
                    case 'b': store.toggleOp('brightness' as any); break;
                    case 'h': store.toggleOp('hue' as any); break;
                    case 'i': store.toggleOp('invert' as any); break;
                    case 'o': store.toggleOp('posterize' as any); break;
                    case 'p': store.toggleOp('pixelate' as any); break;
                    case 'k': store.toggleOp('kaleid' as any); break;
                    case 'r': store.toggleOp('rotate' as any); break;
                    case 'l': store.toggleOp('scale' as any); break;
                    case 'x': store.toggleOp('scrollX' as any); break;
                    case 'y': store.toggleOp('scrollY' as any); break;
                    case 'm': store.toggleOp('modulate' as any); break;
                    case 'u': store.toggleOp('modulateHue' as any); break;
                    case 'g': store.toggleOp('colorama' as any); break;
                    default: return;
                }
            };
            window.addEventListener('keydown', onKey);

            // ------------------------------
            // Babylon setup
            // ------------------------------
            const engine = new BABYLON.Engine(canvasRef.current, true, {
                preserveDrawingBuffer: true,
                stencil: true,
            });
            const scene = new BABYLON.Scene(engine);
            // Lighten baseline background so cubes are discoverable
            // scene.clearColor = new BABYLON.Color4(0.06, 0.07, 0.085, 1);
            scene.clearColor = new BABYLON.Color4(0.10, 0.11, 0.13, 1)
            // Locked camera inside sphere
            const camera = new BABYLON.ArcRotateCamera('camera', Math.PI/2, Math.PI/2, 10, BABYLON.Vector3.Zero(), scene);
            camera.lowerRadiusLimit = 6;
            camera.upperRadiusLimit = 12;
            camera.panningSensibility = 0;
            camera.attachControl(canvasRef.current, true);

            new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);

            // Dynamic texture from Hydra - ensure it matches canvas size exactly
            const dynamicTexture = new BABYLON.DynamicTexture(
                'hydraTex',
                { width: hydraCanvas.width, height: hydraCanvas.height },
                scene,
                false
            );
            // Ensure texture size matches canvas initially
            dynamicTexture.scaleTo(hydraCanvas.width, hydraCanvas.height);
            const hydraMat = new BABYLON.StandardMaterial('hydraMat', scene);
            hydraMat.diffuseTexture = dynamicTexture;
            hydraMat.backFaceCulling = false;
            // Use WRAP so the texture maps naturally around the sphere and avoids the "zoomed" CLAMP effect
            (hydraMat.diffuseTexture as BABYLON.Texture).wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
            (hydraMat.diffuseTexture as BABYLON.Texture).wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
            // Flip only V to correct upside-down orientation on inside sphere (BACKSIDE)
            // Keep U at 1 to prevent text from reading backwards
            (hydraMat.diffuseTexture as BABYLON.Texture).uScale = 1;
            (hydraMat.diffuseTexture as BABYLON.Texture).vScale = -1;
            hydraMat.emissiveColor = new BABYLON.Color3(0.95,0.98,1.0);
            hydraMat.diffuseColor = new BABYLON.Color3(0.55,0.56,0.58);
            hydraMat.alpha = 1;

            // We do NOT use a foreground video plane anymore to avoid overlaying cubes at 22s

            const envInitialRadius = environSphereRadius;
            const envTargetRadius = 25;
            let sphereClickCount = 0;
            let envLerpActive = false;
            let envLerpFrom = environSphereRadius;
            let envLerpStart = 0; // ms
            // Camera LERP state
            let camLerpActive = false;
            let camLerpFrom = 0;
            const camTargetRadius = envTargetRadius + 7;
            let camLerpStart = 0; // ms

            // Large sphere environment
            const innerSphere = BABYLON.MeshBuilder.CreateSphere('innerSphere', {
                diameter: environSphereRadius * 2,
                segments: 128,
                sideOrientation: BABYLON.Mesh.BACKSIDE,
            });
            innerSphere.material = hydraMat;
            innerSphere.isPickable = true;

            const cubeCount = 2;
            // ------------------------------
            // CubeManager-based multi cube layout
            function incrementChannel(meta: CubeMeta, faceIndex: number) {
                // Map faces: 0/1 -> R, 2/3 -> G, 4/5 -> B
                const primary = (faceIndex === (0 * cubeCount) || faceIndex === (1 * cubeCount)) ? 'r' : (faceIndex === (2 * cubeCount) || faceIndex === (3 * cubeCount)) ? 'g' : 'b';
                meta.channels[primary] += INCREMENT;
                meta.pulse = Math.min(1, meta.pulse + 0.5); // slightly reduced pulse on click
                hydraState.impact = Math.min(1.1, hydraState.impact + INCREMENT * 0.9); // reduced uniform impact increment
                backgroundState.pulse = Math.min(1, backgroundState.pulse + 0.35);
                // Map cube's current rotation to Hydra rotate(angle, speed)
                const clamp = (v:number, lo:number, hi:number)=> Math.max(lo, Math.min(hi, v));
                const angle = clamp(meta.mesh.rotation.y, -Math.PI/4, Math.PI/4);
                const speed = clamp(meta.mesh.rotation.x * 0.05, -0.5, 0.5);
                hydraState.hRotAngle = angle;
                hydraState.hRotSpeed = speed;
                // neighbor diffusion: distance-based simple approach (any cube within 4 units)
                manager.cubes.forEach(n => {
                    if (n === meta) return;
                    const dist = BABYLON.Vector3.Distance(n.mesh.position, meta.mesh.position);
                    if (dist < 4) {
                        n.channels[primary] += INCREMENT * NEIGHBOR_FACTOR * (1 - dist/4);
                        n.pulse = Math.min(1, n.pulse + 0.25 * (1 - dist/4));
                    }
                });
            }
            // keep sphere pickable so clicks are detected for expansion trigger
            innerSphere.isPickable = true;
            const manager = CubeManager.get(scene);
            // Reposition cubes in front of the sphere so they are visible even when the sphere is small
            manager.spawn(new BABYLON.Vector3(-1.5, 0, 3));
            manager.spawn(new BABYLON.Vector3(1.5, 0, 3));
            // After spawn, assign hydra dynamic texture as diffuse for every face material
            manager.cubes.forEach(meta => {
                const c = meta.mesh;
                const mm = c.material as BABYLON.MultiMaterial;
                mm.subMaterials?.forEach(sm => {
                    if (sm instanceof BABYLON.StandardMaterial) {
                        sm.diffuseTexture = dynamicTexture; // shared hydra layer under letters
                        sm.disableLighting = true; // hydra vivid
                    }
                });
            });
            console.log('[CubeManager] Spawned cubes:', manager.cubes.map(m=>m.mesh.name));
            const registerUserClick = () => {
                // publish to store; visuals unaffected since pixelation is purely time-based now
                try { useVisStore.getState().registerUserClick(); } catch {}
                try { useAgentStore.getState().incrementClicks(); } catch {}
                // User gesture: attempt to start video if not playing
                try { if (hydraVideoEl && hydraVideoEl.paused) hydraVideoEl.play().catch(()=>{}); } catch {}
                // User gesture: resume WebChucK audio if needed
                try { (window as any).__resumeChuck?.(); } catch {}
            };
            // Track when we remove the video texture from cube faces (so video does not overlay cubes after 22s)
            let cubeVideoCleared = false;
            scene.onPointerObservable.add(pi => {
                if (pi.type !== BABYLON.PointerEventTypes.POINTERDOWN) return;
                const pick = pi.pickInfo;
                if (!pick?.hit || !pick.pickedMesh) return;
                const mesh = pick.pickedMesh as BABYLON.Mesh;
                // Handle sphere clicks first (count toward radius expansion trigger)
                if (mesh === innerSphere) {
                    registerUserClick();
                    sphereClickCount += 1;
                    return;
                }
                const meta = manager.cubes.find(m=>m.mesh === mesh);
                if (!meta) return;
                // Prefer subMeshId; if missing, derive face index from triangle faceId (2 triangles per cube face)
                let faceIndex = pick.subMeshId as number | undefined;
                if (faceIndex == null) {
                    const tri = typeof pick.faceId === 'number' ? pick.faceId : -1;
                    if (tri >= 0) {
                        faceIndex = Math.min(5, Math.floor(tri / 2));
                    }
                }
                if (faceIndex == null || faceIndex < 0) return;
                registerUserClick();
                incrementChannel(meta, faceIndex);
                const avg = manager.getAverageChannels();
                console.log('[Click] meta channels', meta.channels, 'avg', avg);
                // Use functional updater to avoid stale closures
                setClicksTotal((c) => {
                    const newCount = c + 1;
                    (window as any).__clickCount = newCount;
                    return newCount;
                });
            });
            // add some rotation animation
            scene.registerBeforeRender(() => {
                const now = performance.now();
                manager.cubes.forEach((meta,i) => {
                    const c = meta.mesh;
                    // rotation
                    c.rotation.y += 0.008 + i*0.0008 + meta.pulse * 0.007;
                    c.rotation.x += 0.004 + i*0.004 + meta.pulse * 0.035;
                    // pulse decay (non-linear for snappier falloff)
                    if (meta.pulse > 0) meta.pulse = Math.max(0, meta.pulse - 0.06 - meta.pulse * 0.06); // gentler decay
                    // scale with pulse
                    const baseBreath = 0.02 * Math.sin(performance.now()/2000 + i);
                    const s = 1 + meta.pulse * 0.32 + baseBreath;
                    c.scaling.set(s, s, s);
                    // decay
                    const dt = (now - meta.lastUpdate)/1000;
                    if (dt > 0) {
                        // Non-linear decay: higher values decay faster (exponential feel)
                        const base = DECAY_PER_SEC * dt;
                        const curve = (v:number)=> v - base * (0.4 + v*0.6); // portion depends on current value
                        meta.channels.r = Math.max(0, curve(meta.channels.r));
                        meta.channels.g = Math.max(0, curve(meta.channels.g));
                        meta.channels.b = Math.max(0, curve(meta.channels.b));
                        meta.lastUpdate = now;
                    }
                    meta.energy = (meta.channels.r + meta.channels.g + meta.channels.b)/3;
                    // update emissive color per face material (clamped 0..1)
                    const mm = c.material as BABYLON.MultiMaterial;
                    const clamp = (v:number)=> Math.min(1, v);
                    const r = clamp(meta.channels.r);
                    const g = clamp(meta.channels.g);
                    const b = clamp(meta.channels.b);
                    // Enhance prominence: each face shows dominant channel letter color scaled 1.33 for that component only
                    mm.subMaterials?.forEach((sm,faceIdx) => {
                        
                        if (sm instanceof BABYLON.StandardMaterial) {
                            // Baseline emissive hint so cube faces invite clicks
                            const baseGlow = 0.08;
                            let er = baseGlow, eg = baseGlow, eb = baseGlow;
                            if (faceIdx === 0 || faceIdx === 1) { er = Math.min(1, baseGlow + r * 1.2); }
                            else if (faceIdx === 2 || faceIdx === 3 ) { eg = Math.min(1, baseGlow + g * 1.2); }
                            else { eb = Math.min(1, baseGlow + b * 1.2); }
                            sm.emissiveColor = new BABYLON.Color3(er, eg, eb);
                        }
                    });
                });
                // recompute avg and maybe rebuild hydra
                const avg = manager.getAverageChannels();
                // update mutable avg for hydra dynamic callbacks
                currentAvg.r = avg.r; currentAvg.g = avg.g; currentAvg.b = avg.b; currentAvg.energy = avg.energy;
                // publish to signal bus (throttle implicitly by frame rate)
                try { setRGB({ r: avg.r, g: avg.g, b: avg.b, energy: avg.energy }); } catch {}
                applySmoothing();
                // Trigger kaleid ramp when energy is rising past threshold; otherwise decay slowly
                const rising = avg.energy > hydraState.lastEnergy;
                if (avg.energy > 1.0 && rising) {
                    // Ramp up faster when far above threshold
                    const excess = Math.max(0, avg.energy - 1.5);
                    hydraState.kaleidRamp = Math.min(1, hydraState.kaleidRamp + 0.05 + excess * 0.02);
                } else {
                    hydraState.kaleidRamp = Math.max(0, hydraState.kaleidRamp - 0.01);
                }
                hydraState.lastEnergy = avg.energy;
                // Ensure the video is clearly visible after 22s by swapping to a screen-facing plane
                // Use only actual media currentTime; avoid perf-now fallback to prevent early gating
                const vtimeSrcA = hydraVideoEl && Number.isFinite(hydraVideoEl.currentTime) ? hydraVideoEl.currentTime : undefined;
                const gAnyVT = (globalThis as any);
                const vtimeSrcB = Number.isFinite(gAnyVT?.s0?.video?.currentTime) ? gAnyVT.s0.video.currentTime
                                  : Number.isFinite(gAnyVT?.s0?.vid?.currentTime) ? gAnyVT.s0.vid.currentTime
                                  : undefined;
                const vtime = (vtimeSrcA ?? vtimeSrcB ?? 0);
                try { useAgentStore.getState().setTelemetry({ vtime, past30: vtime >= 30, cameraRadius: camera.radius, energy: avg.energy }); } catch {}
                if (!past30 && vtime >= 30) {
                    past30 = true;
                    // Rebuild to switch Hydra graph to camera-only branch
                    buildHydraPipeline(hydraState.pattern);
                }
                if (vtime >= 30 && !cubeVideoCleared) {
                    // Remove Hydra/dynamicTexture from cube faces so the video does NOT overlay cubes
                    manager.cubes.forEach(meta => {
                        const mm = meta.mesh.material as BABYLON.MultiMaterial;
                        mm.subMaterials?.forEach(sm => {
                            if (sm instanceof BABYLON.StandardMaterial) {
                                sm.diffuseTexture = null;
                            }
                        });
                    });
                    cubeVideoCleared = true;
                }
                // No time-based intro decay; pixel overlay is click-activated and ends when video reaches 22s
                // ---------------- Env sphere expansion LERP over a 4-count at current BPM ----------------
                if (envLerpActive) {
                    const elapsedSec = (now - envLerpStart) / 1000;
                    const durationSec = (4 * 60) / bpm; // 4 beats
                    const u = Math.min(1, Math.max(0, elapsedSec / durationSec));
                    // Logarithmic-style easing: log1p curve normalized to [0,1]
                    const ease = Math.log(1 + 9*u) / Math.log(10);
                    environSphereRadius = envLerpFrom + (envTargetRadius - envLerpFrom) * ease;
                    const scale = environSphereRadius / envInitialRadius;
                    innerSphere.scaling.set(scale, scale, scale);
                    if (u >= 1) envLerpActive = false;
                }
                if (camLerpActive) {
                    const elapsedSec = (now - camLerpStart) / 1000;
                    const durationSec = (4 * 60) / bpm; // 4 beats to match sphere expansion
                    const u = Math.min(1, Math.max(0, elapsedSec / durationSec));
                    const ease = Math.log(1 + 9*u) / Math.log(10);
                    camera.radius = camLerpFrom + (camTargetRadius - camLerpFrom) * ease;
                    if (u >= 1) camLerpActive = false;
                }

                // ---------------- Background mapping: pure per-channel (no cross-channel normalization) ----------------
                const clamp01 = (v:number)=> Math.min(1, Math.max(0, v));
                if (backgroundState.pulse > 0) backgroundState.pulse = Math.max(0, backgroundState.pulse - 0.0075 - backgroundState.pulse*0.042);
                const sphereR = clamp01(avg.r);
                const sphereG = clamp01(avg.g);
                const sphereB = clamp01(avg.b);
                hydraMat.emissiveColor = new BABYLON.Color3(sphereR, sphereG, sphereB);
                hydraMat.diffuseColor = new BABYLON.Color3(
                    0.35 + Math.min(1, sphereR)*0.65,
                    0.35 + Math.min(1, sphereG)*0.65,
                    0.35 + Math.min(1, sphereB)*0.65
                );
                // HydrState impact natural decay (slow) to let pulses stand out (slightly slower now for visible feedback)
                if (hydraState.impact > 0) hydraState.impact = Math.max(0, hydraState.impact - 0.022 - hydraState.impact*0.08);
                try { setImpactPulse({ impact: hydraState.impact, pulse: backgroundState.pulse }); } catch {}
                if (avg.energy > ENERGY_THRESHOLD && (now - manager.lastPatternSwitch) > ENTROPY_COOLDOWN_MS) {
                    manager.lastPatternSwitch = now;
                    const pattern = Math.floor(Math.random()*4);
                    buildHydraPipeline(pattern);
                }
            });











            // Determine selected layout name from UI for the 2D HexKeyboard overlay
            const numNotes = 57;
            const namesByCategory: Record<'isomorphic'|'tonnetz', string[]> = {
                isomorphic: ['Wicki-Hayden', 'Harmonic Table'],
                tonnetz: ['Tonnetz (P5 vs M3)', 'Tonnetz (P5 vs m3)'],
            };
            const nameList = namesByCategory[category as 'isomorphic'|'tonnetz'] ?? [];
            const chosenName = nameList[(layoutIndex % nameList.length + nameList.length) % nameList.length] || 'Wicki-Hayden';








            
            // ------------------------------
            // Render loop
            // ------------------------------
            let lastHudUpdate = 0;
            let frameCount = 0;
            let lastRenderTime = 0;
            const RENDER_THROTTLE_MS = 16; // ~60fps max to reduce CPU usage
            
            engine.runRenderLoop(() => {
                const now = performance.now();
                if (now - lastRenderTime < RENDER_THROTTLE_MS) {
                    return; // Skip frame if too soon to prevent excessive CPU usage
                }
                lastRenderTime = now;
                
                const ctx = dynamicTexture.getContext();
                if (hydraCanvasRef.current && ctx) {
                    const canvasWidth = hydraCanvasRef.current.width;
                    const canvasHeight = hydraCanvasRef.current.height;
                    const texSize = dynamicTexture.getSize();
                    
                    // Ensure texture size matches canvas size exactly (only check/resize when needed)
                    if (texSize.width !== canvasWidth || texSize.height !== canvasHeight) {
                        dynamicTexture.scaleTo(canvasWidth, canvasHeight);
                        // Get updated size after scaling
                        const newTexSize = dynamicTexture.getSize();
                        // Clear with the new size
                        ctx.clearRect(0, 0, newTexSize.width, newTexSize.height);
                    } else {
                        // Clear the entire texture context before drawing to prevent artifacts
                        ctx.clearRect(0, 0, texSize.width, texSize.height);
                    }
                    
                    // Draw the current Hydra canvas frame directly (no scaling needed if sizes match)
                    const finalTexSize = dynamicTexture.getSize();
                    if (finalTexSize.width === canvasWidth && finalTexSize.height === canvasHeight) {
                        // Direct copy when sizes match exactly
                        ctx.drawImage(hydraCanvasRef.current, 0, 0);
                    } else {
                        // Scale if sizes don't match
                    ctx.drawImage(
                        hydraCanvasRef.current,
                            0, 0, canvasWidth, canvasHeight,
                            0, 0, finalTexSize.width, finalTexSize.height
                        );
                    }
                    dynamicTexture.update();
                    // Debug: log a frame update every 2 seconds
                    if (typeof window !== 'undefined') {
                        if (!window.__hydraDebugLastLog) window.__hydraDebugLastLog = 0;
                        const now = performance.now();
                        if (now - window.__hydraDebugLastLog > 2000) {
                            window.__hydraDebugLastLog = now;
                            // console.log('[Hydra/Babylon] Frame update', {
                            //     hydraCanvas: hydraCanvasRef.current,
                            //     video: typeof hydraVideoEl !== 'undefined' ? hydraVideoEl : null,
                            //     videoPaused: hydraVideoEl ? hydraVideoEl.paused : undefined,
                            //     videoCurrentTime: hydraVideoEl ? hydraVideoEl.currentTime : undefined
                            // });
                        }
                    }
                    // Force video play if paused (browser may pause it)
                    if (typeof hydraVideoEl !== 'undefined' && hydraVideoEl && hydraVideoEl.paused) {
                        hydraVideoEl.muted = true;
                        hydraVideoEl.volume = 0;
                        hydraVideoEl.play().catch(()=>{});
                    }
                }
                scene.render();
                const t = performance.now();
                if (t - lastHudUpdate > 33) { // ~30fps HUD refresh
                    lastHudUpdate = t;
                    setHud({ r: currentAvg.r, g: currentAvg.g, b: currentAvg.b, energy: currentAvg.energy, impact: hydraState.impact, pulse: backgroundState.pulse });
                    setRGB({ r: currentAvg.r, g: currentAvg.g, b: currentAvg.b, energy: currentAvg.energy });
                    setImpactPulse({ impact: hydraState.impact, pulse: backgroundState.pulse });
                    frameCount++;
                    if (frameCount % 240 === 0) {
                        // Log Zustand store state every 240 HUD updates (~8s at 30fps)
                        try {
                            const visState = useVisStore.getState();
                            const busState = useSignalBus.getState();
                            console.log('[Zustand] visState:', visState, '[Zustand] busState:', busState);
                        } catch (e) {
                            console.warn('Could not log Zustand state', e);
                        }
                    }
                }
            });

            const handleResize = () => {
                hydraCanvas.width = window.innerWidth;
                hydraCanvas.height = window.innerHeight;
                // Update dynamic texture size to match Hydra canvas
                dynamicTexture.scaleTo(hydraCanvas.width, hydraCanvas.height);
                engine.resize();
            };
            window.addEventListener('resize', handleResize);
            // expose cleanup to the outer effect
            disposer = () => {
                window.removeEventListener('resize', handleResize);
                window.removeEventListener('keydown', onKey);
                try { unsubscribeVis(); } catch {}
                try { unsubscribeHydraControls(); } catch {}
                // Clear cache to prevent memory leaks
                chainCache.clear();
                try { engine.dispose(); } catch {}
            };
        })();
        return () => { if (typeof disposer === 'function') disposer(); };
    }, [category, layoutIndex, stepsPerOctave, showNoteLabels, tileScale, useSharps, showFraction]);


    const currentMicroTonalScale = (scale: any) => {
        // Guard: need a valid Tune instance and a scale descriptor with a name
        if (!tune) { console.warn('[microtonal] Tune not initialized yet'); return; }
        if (!scale || !scale.name) { console.warn('[microtonal] Invalid scale payload', scale); return; }

        try {
            // Load/retune
            tune.loadScale(scale.name);
            // Use A4=440 as baseline, then retune by selected key/octave max
            tune.tonicize(440);
            const getFreqVals: any = noteToFreq(selectedChordScaleOctaveRange.current.key, Number(+selectedChordScaleOctaveRange.current.octaveMax));
            tune.tonicize(getFreqVals);
        } catch (e) {
            console.warn('[microtonal] tune.loadScale/tonicize failed', e);
        }

        // If scale isn't available, abort before doing any work
        if (!tune.scale || !Array.isArray(tune.scale)) { console.warn('[microtonal] tune.scale not ready'); return; }
        setMTScaleLength(tune.scale.length);

        // Reset arrays before populating
        selectedChordScaleOctaveRange.current.freqs = [];
        selectedChordScaleOctaveRange.current.midi = [];
        selectedChordScaleOctaveRange.current.notes = [];

        // Build nested octave->degree map for optional flattening later
        const microFreqsObj: Record<number, Record<number, number>> = {};

        for (let i = -3; i < 6; i++) {
            for (let j = 0; j < tune.scale.length; j++) {
                // Frequency
                try {
                    (tune as any).mode.output = 'frequency';
                } catch {}
                const fRaw = Number(tune.note(j, i));
                const f = Number.isFinite(fRaw) ? Number(fRaw.toFixed(2)) : fRaw;
                selectedChordScaleOctaveRange.current.freqs.push(f);
                if (!microFreqsObj[i]) microFreqsObj[i] = {};
                microFreqsObj[i][j] = fRaw;

                // MIDI number (if supported). If not, leave as frequency-derived MIDI with helper if desired
                try { (tune as any).mode.output = 'MIDI'; } catch {}
                const mRaw = Number(tune.note(j, i));
                const m = Number.isFinite(mRaw) ? Number(mRaw.toFixed(4)) : mRaw;
                selectedChordScaleOctaveRange.current.midi.push(m);

                // Simple note label: For 12-TET, derive familiar name; else degree/octave
                const absStep = i * tune.scale.length + j;
                const label = (stepsPerOctave === 12)
                    ? formatNoteNameWithOctave(absStep, 12, { baseMidi: 60, sharps: useSharps })
                    : `${j}/${tune.scale.length}@${i >= 0 ? '+'+i : i}`;
                selectedChordScaleOctaveRange.current.notes.push(label);
            }
        }
        console.log('[microtonal] collected', {
            len: tune.scale.length,
            freqsCount: selectedChordScaleOctaveRange.current.freqs.length,
            midiCount: selectedChordScaleOctaveRange.current.midi.length,
            notesCount: selectedChordScaleOctaveRange.current.notes.length,
        });
        console.log('[microtonal] microFreqsObj sample', microFreqsObj[-1] || microFreqsObj[0] || {});
        const flattenFreqsInRange = (
            obj: Record<number, Record<number, number>>,
            minOctave: number,
            maxOctave: number
        ): number[] => {
            const result: number[] = [];

            for (let octave = minOctave; octave <= maxOctave; octave++) {
                const scale = obj[octave];
                if (!scale) continue;

                const positions = Object.keys(scale).map(Number).sort((a, b) => a - b);
                for (const pos of positions) {
                    result.push(scale[pos]);
                }
            }

            return result;
        };
        // finalMicroToneNotesRef.current = 
        console.log("WHAT ARE FLATTENED FREQS IN RANGE? : ", flattenFreqsInRange(microFreqsObj, +selectedChordScaleOctaveRange.current.octaveMin, +selectedChordScaleOctaveRange.current.octaveMax));
        // setMTFreqs([]);
        // setMTFreqs(finalMicroToneNotesRef.current.sort((a: any, b: any) => a - b).length > 0 ? finalMicroToneNotesRef.current.sort((a: any, b: any) => a - b).map((i: any) => Number(1.0 * (i).toFixed(2))) : '9999.2');

    // masterPatternsRef.current = {};

      

    };
    
    const isCameraOn = useHudStore((s: any) => s.isCameraOn);

    useEffect(() => {
        if (!busMetrics) return;
        const { echo, tension, drift, cache } = busMetrics;
        console.log(`[guide] echo=${echo.toFixed(2)} tension=${tension.toFixed(2)} drift=${drift.toFixed(2)}${cache ? ` cache=${cache}` : ''}`);
    }, [busMetrics]);


    useEffect(() => {
        if (clicksTotal === 1) {
            setTitleText('This is a small demo connecting some of my favorite packages...');
        }
        if (clicksTotal === 3) {
            setTitleText("The rules of this system still needs some detail");
        }
        if (clicksTotal === 4) {
            setTitleText('Plus the audio needs wiring in...');
        }
        if (clicksTotal === 5) {
            setTitleText('Expect more surprises by Tuesday (10/15)!');
        }
    }, [clicksTotal]);

    useEffect(() => {
        bpm && setBeatMs((60 / bpm) * 1000);
        (window as any).__bpm = bpm;
    }, [bpm]);

    

    const updateMicroTonalScale = (scale: any) => {
        console.log("OY SCALE! ", scale)
        // setCurrentMicroTonalScale(scale.value);
    };

    // Compute layout name for the 2D overlay from current dropdown selection
    const namesByCategory: Record<'isomorphic'|'tonnetz', string[]> = {
        isomorphic: ['Wicki-Hayden', 'Harmonic Table', 'Janko'],
        tonnetz: ['Tonnetz (P5 vs M3)', 'Tonnetz (P5 vs m3)'],
    };
    const overlayList = namesByCategory[category as 'isomorphic'|'tonnetz'] ?? [];
    const chosenOverlayName = overlayList.length
        ? overlayList[(layoutIndex % overlayList.length + overlayList.length) % overlayList.length]
        : 'Wicki-Hayden';

    // Memoized helpers for HexKeyboard to reduce prop churn and re-renders
    const Nloc = useMemo(() => mTScaleLength || stepsPerOctave || 12, [mTScaleLength, stepsPerOctave]);
    const resolveHexLabel = useCallback((absStep: number, _pitchIndex: number, octave: number) => {
        try {
            if (!tune || !Nloc) return undefined;
            // Frequency from Tune
            try { (tune as any).mode.output = 'frequency'; } catch {}
            const k = ((absStep % Nloc) + Nloc) % Nloc;
            // Use octave as-is (don't clamp - this was breaking pitch calculations)
            // MIDI range validation happens at MIDI conversion, not here
            const f = Number(tune.note(k, octave));
            const hasF = Number.isFinite(f);
            const fTxt = hasF ? `${f.toFixed(2)} Hz` : undefined;
            // Always show both letters and degree number
            const name12 = formatNoteNameWithOctave(absStep, 12, { baseMidi: 60, sharps: useSharps });
            const main = `${name12} · ${k}`;
            return { main, sub: fTxt };
        } catch { return undefined; }
    }, [tune, Nloc, useSharps]);

    const handleHexTileClick = useCallback(({ absStep }: { absStep: number }) => {
        try {
            const k = ((absStep % Nloc) + Nloc) % Nloc;
            const o = Math.floor(absStep / Nloc);
            // Use octave as-is (don't clamp - this was breaking pitch calculations)
            // MIDI range validation happens at MIDI conversion, not here
            try { (tune as any).mode.output = 'frequency'; } catch {}
            const f = Number(tune?.note?.(k, o));
            console.log('Hex click', { absStep, degree: k, octave: o, freq: f });

            // Format note name (e.g., "C-4" format to match beat grid options)
            const noteName = formatNoteNameWithOctave(absStep, Nloc, { baseMidi: 60, sharps: useSharps });
            // Convert to format used in beat grid (e.g., "C-4" or "C4")
            const noteNameFormatted = noteName.replace(/([A-G][#b]?)(\d+)/, '$1-$2');
            console.log('[HexTileClick] Formatted note name:', noteNameFormatted);

            // Update beat grid store if a cell is currently selected AND isEditing is on
            const beatGridState = useBeatGridStore.getState();
            const selectedCell = beatGridState.currentSelectedCell;
            if (selectedCell && beatGridState.isEditing) {
                // Get current notes for this cell
                const cell = beatGridState.masterPatternsHashHook?.[String(selectedCell.y)]?.[String(selectedCell.x)];
                const currentNotes: string[] = cell?.noteName ? Array.from(cell.noteName).filter((n): n is string => typeof n === 'string') : [];
                // Add the new note if it's not already there
                if (!currentNotes.includes(noteNameFormatted)) {
                    const updatedNotes = [...currentNotes, noteNameFormatted];
                    useBeatGridStore.getState().updateCellNotes(updatedNotes, selectedCell.x, selectedCell.y);
                    console.log('[HexTileClick] Added note to cell', selectedCell, 'notes:', updatedNotes);
                } else {
                    console.log('[HexTileClick] Note already in cell, removing');
                    // Toggle: remove if already present
                    const updatedNotes = currentNotes.filter(n => n !== noteNameFormatted);
                    useBeatGridStore.getState().updateCellNotes(updatedNotes, selectedCell.x, selectedCell.y);
                }
            } else {
                console.log('[HexTileClick] No cell selected in beat grid');
            }

            // Lightweight tone preview via WebAudio (optional, isolated from WebChucK)
            if (Number.isFinite(f) && typeof window !== 'undefined') {
                if (!previewCtxRef.current) previewCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
                const ctx = previewCtxRef.current!;
                if (ctx.state === 'suspended') ctx.resume().catch(()=>{});
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                try { osc.frequency.setValueAtTime(f, ctx.currentTime); } catch {}
                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.005);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
                osc.connect(gain).connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.2);
            }
        } catch (e) { console.log('Hex click err', e); }
    }, [Nloc, tune, useSharps]);

    // Watch for scale selection changes from MicrotonesSearch and update tune
    useEffect(() => {
        if (selectedScale && selectedScale.name && tune) {
            currentMicroTonalScale(selectedScale);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedScale]);

    // Center the scrollable hex area on first render and when dimensions/layout change
    useEffect(() => {
        const el = hexScrollRef.current;
        if (!el) return;
        
        let rafId1: number | null = null;
        let rafId2: number | null = null;
        
        // Wait for content to be laid out before centering
        const centerScroll = () => {
            try {
                // Always show the hex keyboard
                setHexVisible(true);
                
                // Ensure we have valid dimensions before centering
                if (el.scrollWidth > el.clientWidth && el.scrollHeight > el.clientHeight) {
                    const centerX = (el.scrollWidth - el.clientWidth) / 2;
                    const centerY = (el.scrollHeight - el.clientHeight) / 2;
                    el.scrollLeft = Math.max(0, centerX);
                    el.scrollTop = Math.max(0, centerY);
                } else {
                    // If dimensions aren't ready yet, try again on next frame
                    rafId2 = requestAnimationFrame(centerScroll);
                }
            } catch (e) {
                console.warn('[HexKeyboard] Error centering scroll:', e);
                // Still show even if centering fails
                setHexVisible(true);
            }
        };
        
        // Use double RAF to ensure layout is complete
        rafId1 = requestAnimationFrame(() => {
            rafId2 = requestAnimationFrame(centerScroll);
        });
        
        return () => {
            if (rafId1 !== null) cancelAnimationFrame(rafId1);
            if (rafId2 !== null) cancelAnimationFrame(rafId2);
        };
    }, [chosenOverlayName, mTScaleLength, stepsPerOctave]);

    // Cleanup preview audio context on unmount
    useEffect(() => {
        if (typeof window === 'undefined') return;

        let ctx: AudioContext | null = null;
        let stream: MediaStream | null = null;
        let source: MediaStreamAudioSourceNode | null = null;
        let node: any | null = null;

        (async () => {
          const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
          ctx = (window as any).__audioCtx ?? new AC();
          (window as any).__audioCtx = ctx;
          try { if (ctx && ctx.state === 'suspended') await ctx.resume(); } catch {}

          const { default: MeydaNode } = await import('../audio/AudioAnalysisNode.js');
          await MeydaNode.ensureModule(ctx, '/audio/meyda-audio-processor.js');

          stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false },
            video: false
          });
          await ctx;
          source = ctx && ctx.createMediaStreamSource(stream);
          node = new MeydaNode(ctx, { processorName: 'meyda-audio-processor' });

          node.ondata = (msg: any) => {
            const rms = typeof msg?.rms === 'number' ? msg.rms : 0;
            const prev = (window as any).__audioAmp ?? 0;
            (window as any).__audioAmp = prev + (Math.min(1, rms * 3) - prev) * 0.2;
            // Expose Meyda data globally for Hydra controls
            (window as any).__meydaData = msg;
          };

          // connect mic -> worklet only (no destination = no feedback)
          await source;
          source && source.connect(node);
        })().catch(err => console.warn('Audio analysis init failed', err));

        if (typeof window === 'undefined') return;
        let midiNode: any | null = null;

        (async () => {
          const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
          ctx = (window as any).__audioCtx ?? new AC();
          (window as any).__audioCtx = ctx;
          try { if (ctx && ctx.state === 'suspended') await ctx.resume(); } catch {}

          const { default: MidiAudioNode } = await import('../audio/MidiAudioNode.js');
          await MidiAudioNode.ensureModule(ctx, '/audio/midi-audio-processor.js'); // public/audio/...
          midiNode = new MidiAudioNode(ctx);
          // connect only if your processor outputs audio; otherwise keep it unconnected
        })().catch(err => console.warn('Midi worklet init failed', err));

        hexScrollRef.current && hexScrollRef.current.scrollTo({ left: Math.max(0, (hexScrollRef.current.scrollWidth - hexScrollRef.current.clientWidth) / 2), top: Math.max(0, (hexScrollRef.current.scrollHeight - hexScrollRef.current.clientHeight) / 2), behavior: 'smooth' });
        return () => {
          try { previewCtxRef.current?.close(); } catch {}
          try { source?.disconnect(); } catch {}
          try { node?.disconnect?.(); } catch {}
          try { stream?.getTracks().forEach(t => t.stop()); } catch {}
          try { midiNode?.disconnect?.(); } catch {}
        };
    }, []);
    
        return (
        <>
            {/* Bottom-left clickable hex keyboard in a fixed square, SSR-safe (no window refs) */}
            <div
                style={{
                    position: 'absolute',
                    left: 0,
                    bottom: 0,
                    // width: 350 * (16/9), //512
                    // height: 350, //512
                    width: 400,
                    height: 400 * (9/16),
                    zIndex: 5,
                    overflow: 'auto',
                    pointerEvents: 'none',
                    // Make this a containing block so HexKeyboard's absolute inset fills this box
                    // and allow it to capture pointer events for clicks
                    // pointerEvents: 'auto',
                }}
                ref={hexScrollRef}
            >
                {/* Ensure this container is the positioned ancestor */}
                <div 
                style={{ 
                    position: 'relative', 
                    width: '100%', 
                    height: '100%', 
                    opacity: hexVisible ? 1 : 0, 
                    transition: 'opacity 240ms ease' }}>
                    {(() => {
                        const N = mTScaleLength || stepsPerOctave || 12;
                        // Use original range, but ensure it doesn't exceed MIDI 0-127 limits
                        const oMin = Number(selectedChordScaleOctaveRange.current?.octaveMin ?? 1);
                        const oMax = Number(selectedChordScaleOctaveRange.current?.octaveMax ?? 4);
                        const overlayNotes = Math.max(1, (oMax - oMin + 1) * N);
                        const keyboardMode = useOldMonolithStore.getState().keyboardMode;
                        return (
                   tune?.scale?.length > 0 && keyboardMode === 'hex' && <HexKeyboard
                        width={800}
                        height={450}
                        tileRadius={40}
                        numNotes={overlayNotes}
                        stepsPerOctave={N}
                        presetName={chosenOverlayName as any}
                        useSharps={useSharps}
                        showFraction={showFraction}
                        paddingR={0.2}
                        interactive={true}
                        resolveLabel={resolveHexLabel}
                        onTileClick={handleHexTileClick}
                    />
                        );
                    })()}
                </div>
            </div>
            {/* <Box sx={{ display: 'flex', flexDirection: 'row', gap: '8px', position: 'absolute', top: '104px', left: '8px', zIndex: 9999 }}>
                <MicrotonesWrapper 
                    tune={tune}
                    currentMicroTonalScale={currentMicroTonalScale}
                    updateMicroTonalScale={updateMicroTonalScale}
                />
        
            </Box> */}
            {telemetry?.past30 && <Title text={titleText} />}
            <canvas
                ref={canvasRef}
                id="babylonCanvas"
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    display: 'block',
                    zIndex: 1,
                    pointerEvents: 'auto',
                }}
            />
            <ControlPanel />
            {/* <HydraControlsPopup open={hydraControlsOpen} onClose={() => setHydraControlsOpen(false)} /> */}
            <div style={{
                position:'absolute', 
                top:8, 
                left:8, 
                padding:'6px 10px', 
                background:'rgba(0,0,0,0.45)', 
                color:'#fff', 
                fontFamily:'monospace', 
                fontSize:12, 
                lineHeight:1.3, 
                border:'1px solid rgba(255,255,255,0.1)', 
                borderRadius:4, 
                pointerEvents:'none',
                zIndex:9999
            }}>
                <div>r: {hud.r.toFixed(2)} g: {hud.g.toFixed(2)} b: {hud.b.toFixed(2)}</div>
                <div>energy: {hud.energy.toFixed(2)}</div>
                <div>impact: {hud.impact.toFixed(2)} bgPulse: {hud.pulse.toFixed(2)}</div>
                {/* <div style={{opacity:0.8}}>debug: clicks=clicksTotal is local, so we show N/A here unless we lift to store 
                {/* <div style={{opacity:0.85, marginTop:6}}>
                    toggles: 1=strength, s/c/b, h, i, o=posterize, p=pixel, k=kaleid, r=rotate, l=scale, x/y=scroll, m, u=modHue, g=colorama
                </div> */}
                <div style={{marginTop:6, fontWeight: 700, display:'flex', alignItems:'center', gap:6}}>
                </div>
            </div>
        </>
    );
}

