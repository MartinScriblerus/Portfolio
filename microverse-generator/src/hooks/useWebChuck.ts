import { useState, useCallback, useEffect } from "react";

declare global {
  interface Window {
    Chuck: {
      init: (wasmPaths: string[]) => Promise<any>;
    };
  }
}

export default function useWebChuck() {
  const [chuck, setChuck] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isWebChuckLoaded, setIsWebChuckLoaded] = useState(false);

  // Check whether WebChucK is loaded
  useEffect(() => {
    const checkWebChuckLoaded = () => {
      if (window.Chuck) {
        setIsWebChuckLoaded(true);
        return true;
      }
      return false;
    };

    // Check immediately
    if (checkWebChuckLoaded()) return;

    // Poll every 100ms for up to 10 seconds
    const pollInterval = setInterval(() => {
      if (checkWebChuckLoaded()) {
        clearInterval(pollInterval);
      }
    }, 100);

    // Cleanup after 10 seconds
    const timeout = setTimeout(() => {
      clearInterval(pollInterval);
      if (!isWebChuckLoaded) {
        console.error("WebChucK failed to load after 10 seconds");
      }
    }, 10000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [isWebChuckLoaded]);

  const initChuck = useCallback(async () => {
    if (!isWebChuckLoaded) {
      console.error("WebChucK not loaded yet! Please wait for it to load.");
      return null;
    }

    if (chuck) {
      console.log("WebChucK already initialized");
      return chuck;
    }

    setIsLoading(true);

    try {
      // Initialize Chuck with local WASM file from public/webchuck/
      const newChuck = await window.Chuck.init(["/webchuck/webchuck.wasm"]);

      // Resume AudioContext if needed (user gesture required)
      if (newChuck.audioContext.state === "suspended") {
        await newChuck.audioContext.resume();
      }

      // Temporary test tone
      await newChuck.runCode(`
        SinOsc s => dac;
        while(true) {
          Math.random2f(300,800) => s.freq;
          0.3::second => now;
        }
      `);

      setChuck(newChuck);
      console.log("WebChucK initialized successfully");
      return newChuck;
    } catch (error) {
      console.error("Failed to initialize WebChucK:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [chuck, isWebChuckLoaded]);

  return {
    chuck,
    initChuck,
    isLoading,
    isWebChuckLoaded
  };
}
