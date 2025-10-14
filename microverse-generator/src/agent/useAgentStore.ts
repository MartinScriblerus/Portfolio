'use client';

import { create } from 'zustand';

export type AgentStatus = 'idle' | 'asking' | 'checking' | 'success' | 'failed';

export type Telemetry = {
  clicks: number;
  cameraRadius: number;
  vtime: number;
  past23: boolean;
  energy: number;
};

export type Task = {
  id: string;
  name: string;
  description?: string;
  check: (t: Telemetry) => boolean;
  onSuccess?: () => void;
};

export interface AgentState {
  telemetry: Telemetry;
  tasks: Task[];
  currentTaskId: string | null;
  status: AgentStatus;
  startedAt: number | null;
  history: Array<{ id: string; at: number; status: 'success' | 'failed' }>
  // actions
  setTasks: (tasks: Task[]) => void;
  startTask: (id: string) => void;
  completeTask: () => void;
  failTask: () => void;
  nextTask: () => void;
  setTelemetry: (patch: Partial<Telemetry>) => void;
  incrementClicks: () => void;
}

const initialTelemetry: Telemetry = {
  clicks: 0,
  cameraRadius: 0,
  vtime: 0,
  past23: false,
  energy: 0,
};

export const useAgentStore = create<AgentState>((set, get) => ({
  telemetry: initialTelemetry,
  tasks: [],
  currentTaskId: null,
  status: 'idle',
  startedAt: null,
  history: [],

  setTasks: (tasks) => set({ tasks }),
  startTask: (id) => set({ currentTaskId: id, status: 'asking', startedAt: performance.now() }),
  completeTask: () => {
    const { currentTaskId, history } = get();
    if (!currentTaskId) return;
    set({
      status: 'success',
      history: [...history, { id: currentTaskId, at: performance.now(), status: 'success' }],
    });
  },
  failTask: () => {
    const { currentTaskId, history } = get();
    if (!currentTaskId) return;
    set({
      status: 'failed',
      history: [...history, { id: currentTaskId, at: performance.now(), status: 'failed' }],
    });
  },
  nextTask: () => {
    const { tasks, currentTaskId } = get();
    if (!tasks.length) return;
    const idx = Math.max(0, tasks.findIndex(t => t.id === currentTaskId));
    const next = tasks[(idx + 1) % tasks.length];
    set({ currentTaskId: next.id, status: 'asking', startedAt: performance.now() });
  },
  setTelemetry: (patch) => set(({ telemetry }) => ({ telemetry: { ...telemetry, ...patch } })),
  incrementClicks: () => set(({ telemetry }) => ({ telemetry: { ...telemetry, clicks: telemetry.clicks + 1 } })),
}));
