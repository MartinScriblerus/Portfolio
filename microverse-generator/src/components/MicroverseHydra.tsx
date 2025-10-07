// components/HydraInit.tsx
import { useEffect, useRef } from 'react'
import Hydra from 'hydra-synth'

type HydraProps = {
    frameRef: number | null;  
}

export default function MicroverseHydra(props: HydraProps) {
    const { frameRef } = props;
    const hydraRef = useRef<any>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const hydraTickRef = useRef<number>(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        let destroyed = false
    
        const initHydra = async () => {
          if (hydraRef.current) return
        //   const hydraCanvas = document.querySelector('#hydraCanvas') as unknown as HTMLCanvasElement
          const babylonCanvas = document.querySelector('#babylonCanvas') as unknown as HTMLCanvasElement
          if (!babylonCanvas) return
    
          const hydra = new Hydra({
            detectAudio: false,
            canvas: canvasRef.current ,
            width: 320,
            height: 180,
          })
    
          hydraRef.current = hydra
    
          //const stream = babylonCanvas.captureStream()
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          const video = document.createElement('video')
    
          video.srcObject = stream
          video.autoplay = true
          video.muted = true
          video.playsInline = true
          video.style.display = 'none'
          document.body.appendChild(video)
          videoRef.current = video
    
          video.onloadedmetadata = () => {
            if (destroyed) return
            video.play()
            hydraRef.current.s[0].init({ src: video })
          }
        }
    
        initHydra()
    
        return () => {
          // Cleanup: stop video, remove DOM node, nullify refs
          destroyed = true
          if (videoRef.current) {
            const tracks = (videoRef.current.srcObject as MediaStream)?.getTracks()
            tracks?.forEach(track => track.stop())
            videoRef.current.remove()
            videoRef.current = null
          }
    
          if (hydraRef.current) {
            hydraRef.current = null
          }
        }
      }, [])
        
      // Beat tick updates
      useEffect(() => {
        if (
          frameRef && 
          hydraRef.current
        ) {
      
          hydraTickRef.current = hydraTickRef.current + 1;
        
          const { synth } = hydraRef.current
          // console.log('synth#### ', synth);
          // console.log('hydra#### ', hydraRef.current);
          synth.initCam();
          synth.src(hydraRef.current.s[0]).modulate(synth.osc(10)).out()
          
     
          synth.osc(5, 0.09, 0.001)
          .kaleid([hydraTickRef.current % 16 === 0 ? 3 : 40])
          .color(0.5, 0.3)
          .colorama(0.4)
          .rotate(0.009, hydraTickRef.current % 16 ? ()=>Math.sin(synth.time)* -0.001 : ()=>Math.sin(synth.time)* 0.01 )
          .modulateRotate(synth.o0,()=>Math.sin(synth.time) * 0.003)
          .modulate(synth.o0, hydraTickRef.current % 4 !== 0 ? 0.29 : 0.89)
          .scale(0.9)
      // .blend(synth.src(hydraRef.current.s[0]))
          .out(synth.o0)
        }
      }, [frameRef])
    
      return (
        <canvas
          id="hydraCanvas"
          ref={canvasRef}
          style={{
            position: 'relative',
            top: '0px',
            left: '0px',
            zIndex: 2,
            pointerEvents: 'none',
            width: `140px`,
            height: '80px',
          }}
        />
      )
}