// src/workers/meydaBridgeClient.ts
export type FeaturePacket = {
  type: 'features';
  ts: number;
  features: Record<string, any>;
};

export function createMeydaWorkerClient(worker: Worker) {
  const listeners = new Set<(pkt: FeaturePacket) => void>();
  const onMessage = (ev: MessageEvent) => {
    const d = ev.data;
    if (d?.type === 'features') {
      listeners.forEach(fn => fn(d as FeaturePacket));
    }
  };
  worker.addEventListener('message', onMessage);

  return {
    start: (opts: { sampleRate: number; hopSize: number; features: string[] }) =>
      worker.postMessage({ type: 'init', ...opts }),
    pushAudio: (f32: Float32Array, ts?: number) =>
      worker.postMessage({ type: 'audio', f32, ts: ts || performance.now() }, [f32.buffer]),
    subscribe: (fn: (pkt: FeaturePacket) => void) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    stop: () => {
      try { worker.terminate(); } catch {}
      listeners.clear();
    }
  };
}