'use client';

import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';

export default function BabylonHydraCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hydraCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    (async () => {
      const HydraModule = await import('hydra-synth');
      const Hydra = HydraModule.default;

      // ------------------------------
      // Hydra setup
      // ------------------------------
      const hydraCanvas = document.createElement('canvas');
      hydraCanvas.width = window.innerWidth;
      hydraCanvas.height = window.innerHeight;
      hydraCanvasRef.current = hydraCanvas;

      const hydra = new Hydra({ canvas: hydraCanvas, detectAudio: false });

      const { osc, noise, shape } = hydra.synth;
      console.log("test shape? ", shape);
      osc(10, 0.1, 1.2)
        .color(1, 0.5, 0.7)
        .rotate(() => Math.sin(Date.now() / 1000) * 0.5)
        .modulate(noise(3))
        .out();

      // ------------------------------
      // Babylon setup
      // ------------------------------
      const engine = new BABYLON.Engine(canvasRef.current, true, {
        preserveDrawingBuffer: true,
        stencil: true,
      });
      const scene = new BABYLON.Scene(engine);
      scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

      // Locked camera inside sphere
      const camera = new BABYLON.ArcRotateCamera(
        'camera',
        Math.PI / 2,
        Math.PI / 2,
        10,
        BABYLON.Vector3.Zero(),
        scene
      );
      camera.lowerRadiusLimit = 0.1;
      camera.upperRadiusLimit = 0.1;
      camera.panningSensibility = 0;
      camera.attachControl(canvasRef.current, true);

      new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);

      // Dynamic texture from Hydra
      const dynamicTexture = new BABYLON.DynamicTexture(
        'hydraTex',
        { width: 2048, height: 1024 }, // wider for smoother wrap
        scene,
        false
      );
      const hydraMat = new BABYLON.StandardMaterial('hydraMat', scene);
      hydraMat.diffuseTexture = dynamicTexture;
      hydraMat.backFaceCulling = false;
      hydraMat.diffuseTexture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
      hydraMat.diffuseTexture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;

      // Large sphere environment
      const innerSphere = BABYLON.MeshBuilder.CreateSphere('innerSphere', {
        diameter: 50,
        segments: 128,
      });
      innerSphere.material = hydraMat;

      // ------------------------------
      // Add an inner Hydra-wrapped mesh
      // ------------------------------
      const cube = BABYLON.MeshBuilder.CreateBox('cube', { size: 1 }, scene);
      cube.position = new BABYLON.Vector3(0, 0, -5); 
      const cubeMat = new BABYLON.StandardMaterial('cubeMat', scene);
      cubeMat.diffuseTexture = dynamicTexture; // same hydra feed
      cube.material = cubeMat;

      // add some rotation animation
      scene.registerBeforeRender(() => {
        cube.rotation.y += 0.01;
        cube.rotation.x += 0.005;
      });

      // ------------------------------
      // Render loop
      // ------------------------------
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
      });

      const handleResize = () => {
        hydraCanvas.width = window.innerWidth;
        hydraCanvas.height = window.innerHeight;
        engine.resize();
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        engine.dispose();
      };
    })();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="babylonCanvas"
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    />
  );
}
