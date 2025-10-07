import React, { useEffect, useRef } from "react";
import BabylonCanvas from "./components/BabylonCanvas";
import MicroverseHydra from "./components/MicroverseHydra";
import useWebChuck from "./hooks/useWebChuck";
import "./App.css";

export default function App() {
  const { initChuck, isWebChuckLoaded, isLoading } = useWebChuck();
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    // TICK LOOP
    const tick = (time: number) => {
      
      frameRef.current = requestAnimationFrame(tick);
    };

    // start loop
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <div className="app-container">
      <BabylonCanvas />
      <MicroverseHydra frameRef={frameRef.current} />

      <button
        onClick={initChuck}
        disabled={!isWebChuckLoaded || isLoading}
        className="audio-button"
      >
        {!isWebChuckLoaded 
          ? 'Loading WebChucK...' 
          : isLoading 
            ? 'Starting Audio...' 
            : 'Start Audio'
        }
      </button>
    </div>
  );
}