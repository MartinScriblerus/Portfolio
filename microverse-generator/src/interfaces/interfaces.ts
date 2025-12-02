import * as BABYLON from '@babylonjs/core';

export type CubeMeta = {
    mesh: BABYLON.Mesh | any;
    channels: { r: number; g: number; b: number };
    energy: number;
    lastUpdate: number;
    pulse: number;
};

export interface LayoutPreset {
  name: string;
  vector1: LayoutVector;  // horizontal / radial axis
  vector2: LayoutVector;  // diagonal / angular axis
  category?: 'isomorphic' | 'tonnetz' | string;
}

export interface HexNote { x: number; y: number; z: number; pitchIndex: number; absStep?: number; }

export type LayoutVector = { 
  dx: number;  // horizontal step in grid coordinates
  dy: number;  // vertical step in grid coordinates
  interval: number;  // how many tuning‑steps this vector represents
};

export interface BabylonGame {
    canvas: any;
    engine: any;
    scene: any;
    camera: any;
    light: any;
    gui: any;
    advancedTexture: any;
    panel: any; //GUI.StackPanel[] | undefined;
    header: any; // GUI.TextBlock[];
    slider: any; // GUI.Slider[] | undefined;
    knob: any;
    meshes: any;
    camera1: any;
    camera2: any;
    runRenderLoop: any;
}

import { SelectChangeEvent } from "@mui/material";
import { Chuck } from "webchuck";

export interface Osc1ToChuck {
    name: string;
    string: string;
}

/// THIS SHOULD BE CONVERTED TO SOMETHING IN AUDIOTYPES PATTERN
export interface AllSoundSourcesObject {
    master: Array<any>;
    osc1: Array<any>;
    // osc2: Array<any>;
    stks: Array<any>;
    samples: Array<any>;
    linesIn: Array<any>;
}

export interface FlowEdge {
    id: string;
    source: string,
    target: string,
}

export interface FlowNode {
    id: string; 
    data: { 
        label: string; 
    }; 
    position: { 
        x: number; 
        y: number; 
    }; 
    type: string; 
    style: { 
        height: number; 
        width: number; 
        backgroundColor: string; 
    };
    ports: { 
        input: Array<string>; 
        output: Array<string>; 
    };
}

export type Chord = string[];
export type ChordGroup = Chord[][] | Chord[];

export interface Progs {
  [degree: string]: string[];
}

export interface ProgsNumsEntry {
  [chordType: string]: ChordGroup;
}

export interface ProgsNums {
  [degree: string]: ProgsNumsEntry;
}

export interface QueryResponse {
  progs: Progs;
  progs_nums: ProgsNums;
}