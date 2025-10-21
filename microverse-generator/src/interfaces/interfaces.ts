import * as BABYLON from '@babylonjs/core';
export type CubeMeta = {
    mesh: BABYLON.Mesh | any;
    channels: { r: number; g: number; b: number };
    energy: number;
    lastUpdate: number;
    pulse: number;
};
