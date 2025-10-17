'use client';

import { useEffect, useRef, useState } from 'react';
import { useSignalBus } from '../store/useSignalBus';
import * as BABYLON from '@babylonjs/core';
import { tryGetAudio } from '../utils/utils';
import { useVisStore } from '../store/useVisStore';
import { BLUE_CHANNEL, GREEN_CHANNEL, RED_CHANNEL } from '../constants';
import Title from './Title';
import { useAgentStore } from '../agent/useAgentStore';
import { DECAY_PER_SEC, ENERGY_THRESHOLD, ENTROPY_COOLDOWN_MS, INCREMENT, NEIGHBOR_FACTOR } from './constants';


export default function BabylonHydraCanvas() {

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const hydraCanvasRef = useRef<HTMLCanvasElement>(null);
    
    const [titleText, setTitleText] = useState("Find a cube and click it!");
    const [hud, setHud] = useState({ r:0, g:0, b:0, energy:0, impact:0, pulse:0 });
    const [bpm, setBpm] = useState<number>(120);
    const [clicksTotal, setClicksTotal] = useState<number>(0);
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

    function makeLetterOverlay(scene: BABYLON.Scene, text: string, color: string) {
        const size = 256;
        const letterDT = new BABYLON.DynamicTexture(`letter-${text}-${color}-${Date.now()}`, { width: size, height: size }, scene, false);
        const lctx = letterDT.getContext();
        lctx.clearRect(0,0,size,size);
        lctx.font = 'bold 140px sans-serif';
        (lctx as CanvasRenderingContext2D).textAlign = 'center';
        (lctx as CanvasRenderingContext2D).textBaseline = 'middle';
        lctx.fillStyle = color;
        lctx.fillText(text, size/2, size/2);
        letterDT.hasAlpha = true;
        letterDT.update();
        return letterDT;
    }

    type CubeMeta = {
        mesh: BABYLON.Mesh;
        channels: { r: number; g: number; b: number };
        energy: number;
        lastUpdate: number;
        pulse: number;
    };

    // const chuckRef = useRef<any>(null);

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
                const letterDT = makeLetterOverlay(this.scene, letter, col);
                m.emissiveTexture = letterDT;
                m.emissiveColor = new BABYLON.Color3(1,1,1);
                m.alpha = 1;
                mats.push(m);
            });
            const mm = new BABYLON.MultiMaterial(`${c.name}-mm`, this.scene);
            mm.subMaterials.push(...mats);
            c.material = mm;
            const vC = c.getTotalVertices();
            c.subMeshes = [];
            c.subMeshes.push(new BABYLON.SubMesh(0, 0, vC, 0, 6, c));
            c.subMeshes.push(new BABYLON.SubMesh(1, 0, vC, 6, 6, c));
            c.subMeshes.push(new BABYLON.SubMesh(2, 0, vC, 12, 6, c));
            c.subMeshes.push(new BABYLON.SubMesh(3, 0, vC, 18, 6, c));
            c.subMeshes.push(new BABYLON.SubMesh(4, 0, vC, 24, 6, c));
            c.subMeshes.push(new BABYLON.SubMesh(5, 0, vC, 30, 6, c));
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
        if (!busMetrics) return;
        const { echo, tension, drift, cache } = busMetrics;
        console.log(`[guide] echo=${echo.toFixed(2)} tension=${tension.toFixed(2)} drift=${drift.toFixed(2)}${cache ? ` cache=${cache}` : ''}`);
    }, [busMetrics]);

    useEffect(() => {
        if (!canvasRef.current) return;
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
            const hydraState = { pattern:0, impact:0, hRotAngle: 0, hRotSpeed: 0, kaleidRamp: 0.3, lastEnergy: 0 };
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
            const SMOOTH_ALPHA = 0.08; // lower = smoother (more temporal damping for calmer background)
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
                                    const px = 2 + Math.floor(s * 180);
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
            function buildHydraPipeline(pattern: number) {
                hydraState.pattern = pattern;
                const gAny: any = globalThis as any;
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

                let base = osc(
                        () => 1.0 + smoothAvg.energy*0.5,
                        0.05,
                        0
                    )
                    .color(
                        () => mix(0.055 + smoothAvg.r*0.35, targetBias?.r ?? 0, biasW),
                        () => mix(0.055 + smoothAvg.g*0.35, targetBias?.g ?? 0, biasW),
                        () => mix(0.055 + smoothAvg.b*0.35, targetBias?.b ?? 0, biasW)
                    )
                    .rotate(
                        () => hydraState.hRotSpeed % (2*Math.PI) * -hydraState.impact,
                        () => hydraState.hRotSpeed % (2*Math.PI) * hydraState.impact
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
                                    const clicks = useAgentStore.getState().telemetry.clicks || 0;
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
                    // Guard against Hydra errors so Babylon still renders
                    try {
                        const vtime = (hydraVideoEl?.currentTime)
                            ?? (gAny.s0?.video?.currentTime)
                            ?? (gAny.s0?.vid?.currentTime)
                            ?? (videoStartMs != null ? (performance.now() - videoStartMs)/1000 : 0);
                        let camLuma = src(s0).color(1,1,1);
                        
                        if (vtime < 10) {
                            camLuma = camLuma.pixelate(() => PX_HEAVY, () => PX_HEAVY).modulateHue(noise(10), 0.1).invert(0.2).kaleid(6).repeat(16);
                        }
                        // Apply camera ops excluding pixelate to avoid double effect
                        camLuma = applyOps(camLuma, ['saturate','contrast','brightness','hue','posterize','invert','modulateHue','luma']);
                        if (vtime >= 30) {
                            // After credits, show clear camera feed
                            camLuma.out();
                        } else {
                            if (pattern % 2 === 0) {
                                // lighter blend to preserve Hydra color saturation
                                base.blend(camLuma, () => 0.35 + currentAvg.energy*0.72).out();
                            } else {
                                // lighter add to avoid washing out
                                base.add(camLuma, () => 0.06 + currentAvg.energy*0.78).out();
                            }
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
                    hydraVideoEl = await g.s0.initVideo("https://dn790002.ca.archive.org/0/items/0037_Gift_of_Green_13_00_46_00/0037_Gift_of_Green_13_00_46_00.mp4");
                    videoStartMs = performance.now();
                    hydraCamReady = true;
                    console.log('Hydra webcam started --> now for Audio');
                    try {
                        if (hydraVideoEl) {
                            // Improve autoplay chances
                            hydraVideoEl.muted = true;
                            await hydraVideoEl.play();
                        }
                    } catch {}
                    // Build pipeline now that camera/video is ready
                    buildHydraPipeline(hydraState.pattern);
                    tryGetAudio();
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

            // Dynamic texture from Hydra
            const dynamicTexture = new BABYLON.DynamicTexture(
                'hydraTex',
                { width: hydraCanvas.width, height: hydraCanvas.height },
                scene,
                false
            );
            const hydraMat = new BABYLON.StandardMaterial('hydraMat', scene);
            hydraMat.diffuseTexture = dynamicTexture;
            hydraMat.backFaceCulling = false;
            // Use WRAP so the texture maps naturally around the sphere and avoids the "zoomed" CLAMP effect
            (hydraMat.diffuseTexture as BABYLON.Texture).wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
            (hydraMat.diffuseTexture as BABYLON.Texture).wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
            // Flip U to correct orientation on inside sphere
            (hydraMat.diffuseTexture as BABYLON.Texture).uScale = -1;
            (hydraMat.diffuseTexture as BABYLON.Texture).vScale = 1;
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

            // tryStartChucKIntro?.(bpm);

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
                    if (sphereClickCount === 10 && !envLerpActive) {
                        envLerpActive = true;
                        envLerpFrom = environSphereRadius;
                        envLerpStart = performance.now();
                        // Kick off intro once the expansion begins
                        // tryStartChucKIntro?.(bpm);
                        // Prepare camera LERP
                        camLerpActive = true;
                        camLerpFrom = camera.radius;
                        camLerpStart = envLerpStart;
                        // Ensure camera can reach target radius
                        camera.upperRadiusLimit = Math.max(camera.upperRadiusLimit ?? camTargetRadius, camTargetRadius + 2);
                    }
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
                setClicksTotal((c) => c + 1);
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

            // ------------------------------
            // Render loop
            // ------------------------------
            let lastHudUpdate = 0;
            engine.runRenderLoop(() => {
                const ctx = dynamicTexture.getContext();
                if (hydraCanvasRef.current && ctx) {
                    ctx.drawImage(
                        hydraCanvasRef.current,
                        0,
                        0,
                        dynamicTexture.getSize().width,
                        dynamicTexture.getSize().height
                    );
                    dynamicTexture.update();
                }
                scene.render();
                const t = performance.now();
                if (t - lastHudUpdate > 33) { // ~30fps HUD refresh
                    lastHudUpdate = t;
                    setHud({ r: currentAvg.r, g: currentAvg.g, b: currentAvg.b, energy: currentAvg.energy, impact: hydraState.impact, pulse: backgroundState.pulse });
                    setRGB({ r: currentAvg.r, g: currentAvg.g, b: currentAvg.b, energy: currentAvg.energy });
                    setImpactPulse({ impact: hydraState.impact, pulse: backgroundState.pulse });
                  
                }
            });

            const handleResize = () => {
                hydraCanvas.width = window.innerWidth;
                hydraCanvas.height = window.innerHeight;
                engine.resize();
            };
            window.addEventListener('resize', handleResize);

            return () => {
                window.removeEventListener('resize', handleResize);
                window.removeEventListener('keydown', onKey);
                try { unsubscribeVis(); } catch {}
                engine.dispose();
            };
        })();
    }, []);

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

    return (
        <>
            {telemetry?.past30 && <Title text={titleText} />}
            <canvas
                ref={canvasRef}
                id="babylonCanvas"
                style={{
                    width: '100vw',
                    height: '100vh',
                    display: 'block',
                }}
            />
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
                pointerEvents:'none'
            }}>
                <div>r: {hud.r.toFixed(2)} g: {hud.g.toFixed(2)} b: {hud.b.toFixed(2)}</div>
                <div>energy: {hud.energy.toFixed(2)}</div>
                <div>impact: {hud.impact.toFixed(2)} bgPulse: {hud.pulse.toFixed(2)}</div>
                {/* <div style={{opacity:0.8}}>debug: clicks=clicksTotal is local, so we show N/A here unless we lift to store 
                {/* <div style={{opacity:0.85, marginTop:6}}>
                    toggles: 1=strength, s/c/b, h, i, o=posterize, p=pixel, k=kaleid, r=rotate, l=scale, x/y=scroll, m, u=modHue, g=colorama
                </div> */}
                {/* <div style={{marginTop:6, fontWeight: 700, display:'flex', alignItems:'center', gap:6}}>
                    <span style={{color: RED_CHANNEL}}>BPM:</span>
                    <input
                        type="number"
                        value={bpm}
                        min={40}
                        max={240}
                        step={1}
                        onChange={(e)=> setBpm(Number(e.target.value) || 0)}
                        style={{
                            width: 64,
                            background: 'rgba(0,0,0,0.35)',
                            color: '#fff',
                            border: `1px solid ${BLUE_CHANNEL}`,
                            borderRadius: 4,
                            padding: '2px 6px'
                        }}
                    />
                </div> */}
            </div>
        </>
    );
}
