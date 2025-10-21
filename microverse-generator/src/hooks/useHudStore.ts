import { create } from 'zustand';

type HudState = {
  hud: { r: number; g: number; b: number; energy: number; impact: number; pulse: number };
  setHud: (hud: { r: number; g: number; b: number; energy: number; impact: number; pulse: number }) => void;
  isCameraOn: boolean;
  setIsCameraOn: (v: boolean) => void;
};

export const useHudStore = create<HudState>(set => ({
  hud: { r: 0, g: 0, b: 0, energy: 0, impact: 0, pulse: 0 },
  setHud: hud => set({ hud }),
  isCameraOn: false,
  setIsCameraOn: v => set({ isCameraOn: v }),
}));