import * as BABYLON from "babylonjs";

export class SceneManager {
  private engine: BABYLON.Engine | null = null;
  private scene: BABYLON.Scene | null = null;
  private microverses: BABYLON.AbstractMesh[] = [];
  private isInitialized = false;

  constructor() {
  }

  init(canvas: HTMLCanvasElement): void {
    if (this.isInitialized) {
      console.warn("SceneManager already initialized");
      return;
    }

    this.engine = new BABYLON.Engine(canvas, true);
    this.scene = new BABYLON.Scene(this.engine);
    this.scene.createDefaultCameraOrLight(true, true, true);
    this.scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);
    this.engine.runRenderLoop(() => this.scene?.render());
    this.isInitialized = true;
  }

  spawnMicroverse(): void {
    if (!this.scene) {
      console.warn("Scene not initialized. Call init() first.");
      return;
    }
    
    const sphere = BABYLON.MeshBuilder.CreateSphere(
      `microverse_${Date.now()}`,
      { diameter: Math.random() * 2 + 1 },
      this.scene
    );
    sphere.position = new BABYLON.Vector3(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10
    );
    this.microverses.push(sphere);
    setTimeout(() => this.disposeMicroverse(sphere), 5000 + Math.random() * 5000);
  }

  disposeMicroverse(mesh: BABYLON.AbstractMesh): void {
    mesh.dispose();
    this.microverses = this.microverses.filter(m => m !== mesh);
  }

  dispose(): void {
    // Dispose all microverses
    this.microverses.forEach(mesh => mesh.dispose());
    this.microverses = [];
    
    // Dispose scene and engine
    this.scene?.dispose();
    this.engine?.dispose();
    
    this.scene = null;
    this.engine = null;
    this.isInitialized = false;
  }

  // Getters for accessing private properties if needed
  get babylonScene(): BABYLON.Scene | null {
    return this.scene;
  }

  get babylonEngine(): BABYLON.Engine | null {
    return this.engine;
  }
}

// Default export as the class
export default SceneManager;