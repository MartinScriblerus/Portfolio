// declare global {
//   const s0: any;
//   const s1: any;
//   const s2: any;
//   const s3: any;
//   const o0: any;
//   const o1: any;
//   const o2: any;
//   const o3: any;
//   const osc: any;
//   const src: any;
//   const noise: any;
//   const shape: any;
// }

// export {};

// global-hydra.d.ts
export {};

declare global {
  // Output buffers
  const o0: HydraSource;
  const o1: HydraSource;
  const o2: HydraSource;
  const o3: HydraSource;

  const s0: HydraSource;
  const s1: HydraSource;
  const s2: HydraSource;
  const s3: HydraSource;

  // Visual sources
  function osc(freq?: number, sync?: number, offset?: number): HydraSource;
  function shape(sides?: number, radius?: number, smoothing?: number): HydraSource;
  function gradient(speed?: number): HydraSource;
  function noise(scale?: number, offset?: number): HydraSource;
  function voronoi(scale?: number, speed?: number): HydraSource;
  function camera(): HydraSource;
  function video(src: HTMLVideoElement): HydraSource;
  function src(buffer: any): HydraSource; // for arrays / external sources
  function solid(r?: number, g?: number, b?: number): HydraSource;

  // Sequencing & arrays
  type HydraArray = any; // extend later if needed
  function array(...items: any[]): HydraArray;

  // Audio-reactive
  const a: any; // fft audio buffer
  const aSmoothing: number;
  function fft(channel?: number): number;

  // Interactivity
  const mouse: { x: number; y: number; click: boolean };
  function key(keyCode: string): boolean;
  const midi: any;

  // HydraSource class
  class HydraSource {
    // Color & luminosity
    color(r?: number, g?: number, b?: number): HydraSource;
    colorama(amount?: number): HydraSource;
    invert(amount?: number): HydraSource;
    contrast(amount?: number): HydraSource;
    luma(threshold?: number, tolerance?: number): HydraSource;
    thresh(threshold?: number, tolerance?: number): HydraSource;
    brightness(amount?: number): HydraSource;
    saturation(amount?: number): HydraSource;

    // Geometry / visual transforms
    rotate(angle?: number, speed?: number): HydraSource;
    scale(x?: number, y?: number): HydraSource;
    scrollX(x?: number, speed?: number): HydraSource;
    scrollY(y?: number, speed?: number): HydraSource;
    pixelate(x?: number, y?: number): HydraSource;
    kaleid(nSides?: number): HydraSource;
    repeat(x?: number, y?: number): HydraSource;
    invertRepeat(): HydraSource;

    // Blending & composition
    add(src: HydraSource): HydraSource;
    mult(src: HydraSource): HydraSource;
    diff(src: HydraSource): HydraSource;
    blend(src: HydraSource, amount?: number): HydraSource;

    // Modulation / warping
    modulate(src: HydraSource, amount?: number): HydraSource;
    modulateScale(src: HydraSource, amount?: number): HydraSource;
    modulateRotate(src: HydraSource, amount?: number): HydraSource;
    modulatePixelate(src: HydraSource, multiple?: number, offset?: number): HydraSource;
    modulateScrollX(src: HydraSource, reps?: number, speed?: number): HydraSource;
    modulateScrollY(src: HydraSource, reps?: number, speed?: number): HydraSource;
    modulateHue(src: HydraSource, amount?: number): HydraSource;
    modulateKaleid(src: HydraSource, nSides?: number): HydraSource;

    // Sequencing / arrays
    fast(amount?: number): HydraSource;
    smooth(amount?: number): HydraSource;

    // Output
    out(buffer?: any): HydraSource;
    render(): HydraSource;
  }

  // Settings / state
  function init(): void;
  function reset(): void;
}
