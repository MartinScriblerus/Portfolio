import { useState, useCallback, useEffect } from "react";
import type { Filename } from "webchuck";

const wasmFiles: Filename[] = ["/webchuck.wasm"];
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
  if (typeof window === "undefined") return;
  const { Chuck } = await import("webchuck");
  const chuck: any = await Chuck.init(wasmFiles);
  if (chuck.audioContext.state === "suspended") await chuck.audioContext.resume();
  setChuck(chuck);
  return chuck;
}, []);

  return {
    chuck,
    initChuck,
    isLoading,
    isWebChuckLoaded
  };
}
