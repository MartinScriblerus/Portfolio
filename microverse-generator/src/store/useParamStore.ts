import { create } from 'zustand';

type Curve = 'linear' | 'log';
type ParamMeta = { id: string; label?: string; min: number; max: number; default: number; step?: number; curve?: Curve };
type ParamState = { base: number; value: number }; // value can include modulation later
type Store = {
  meta: Record<string, ParamMeta>;
  values: Record<string, ParamState>;
  defineParams: (defs: ParamMeta[]) => void;
  setParam: (id: string, next: number) => void;
};

export const useParamStore = create<Store>((set:any, get:any) => ({
  meta: {},
  values: {},
  defineParams: (defs: any) => set((s: { meta: any; values: any; }) => {
    const meta = { ...s.meta };
    const values = { ...s.values };
    for (const d of defs) {
      meta[d.id] = d;
      if (!values[d.id]) values[d.id] = { base: d.default, value: d.default };
    }
    return { meta, values };
  }),
  setParam: (id: string | number, next: number) => set((s: { meta: { [x: string]: any; }; values: any; }) => {
    const m = s.meta[id]; if (!m) return s;
    const v = Math.min(m.max, Math.max(m.min, next));
    return { values: { ...s.values, [id]: { base: v, value: v } } };
  }),
}));

export function useParam(id: string): [number, (v: number) => void, ParamMeta | undefined] {
  const meta = useParamStore((s:any) => s.meta[id]);
  const value = useParamStore((s:any) => s.values[id]?.base ?? meta?.default ?? 0);
  const setParam = useParamStore((s:any) => s.setParam);
  return [value, (v) => setParam(id, v), meta];
}