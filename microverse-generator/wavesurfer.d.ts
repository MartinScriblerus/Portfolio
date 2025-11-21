declare module 'wavesurfer.js' {
    import { default as Wavesurfer } from 'wavesurfer.js/dist/wavesurfer.esm.js';
    export = Wavesurfer;
  }
  
  declare module 'wavesurfer.js/dist/plugins/*' {
    import { default as Plugin } from 'wavesurfer.js/dist/plugins/*';
    export = Plugin;
  }