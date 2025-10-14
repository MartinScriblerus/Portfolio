'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAgentStore } from '../agent/useAgentStore';
import { stepAgent, registerTasks } from '../agent/taskEngine';

export default function PhilosopherGuide() {
  // Select fields individually to avoid creating new objects every render
  const currentTaskId = useAgentStore((s) => s.currentTaskId);
  const tasks = useAgentStore((s) => s.tasks);
  const status = useAgentStore((s) => s.status);
  const [text, setText] = useState<string>('');

  const task = useMemo(() => tasks.find((t) => t.id === currentTaskId), [tasks, currentTaskId]);

  // For now, use a deterministic placeholder. Later, call /api/utter to style.
  useEffect(() => {
    if (!task) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/utter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task: { id: task.id, name: task.name } }),
        });
        if (!res.ok) throw new Error('utter failed');
        const j = await res.json();
        if (!cancelled) setText(j.text ?? task.name);
      } catch {
        if (!cancelled) setText(task.name);
      }
    })();
    return () => { cancelled = true; };
  }, [task?.id]);

  // Register a small default sequence of tasks once
  useEffect(() => {
    const s = useAgentStore.getState();
    if (s.tasks.length === 0) {
      registerTasks([
        {
          id: 't1',
          name: 'Tap upon the surface thrice to awaken the image',
          check: (t) => t.clicks >= 3,
          onSuccess: () => console.log('[Agent] t1 success'),
        },
        {
          id: 't2',
          name: 'Hold the world steady—bring your gaze to the proper distance',
          check: (t) => t.cameraRadius >= 14, // reached after the expansion lerp
          onSuccess: () => console.log('[Agent] t2 success'),
        },
        {
          id: 't3',
          name: 'Resolve the veil—wait until the image clears on its own',
          check: (t) => t.past23 === true, // after the video clears
          onSuccess: () => console.log('[Agent] t3 success'),
        },
      ]);
    }
  }, []);

  // Poll agent checks lightly
  useEffect(() => {
    const id = setInterval(() => stepAgent(), 200);
    return () => clearInterval(id);
  }, []);

  if (!task) return null;

  return (
    <div style={{ position:'absolute', bottom: 16, left: 16, right: 16, maxWidth: 540, padding:'12px 14px', background:'rgba(0,0,0,0.5)', color:'#e9f1ff', fontFamily:'serif', border:'1px solid rgba(255,255,255,0.15)', borderRadius:8 }}>
      <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 6 }}>Guide</div>
      <div style={{ whiteSpace:'pre-wrap', fontSize: 16 }}>{text}</div>
      <div style={{ marginTop:8, fontSize: 12, opacity: 0.8 }}>Status: {status}</div>
    </div>
  );
}
