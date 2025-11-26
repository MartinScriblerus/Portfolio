// Type override for d3-dispatch to fix TypeScript 4.9.5 compatibility
// The @types/d3-dispatch package uses TS 5.0+ syntax (const in type params)
// This override removes the const modifier for compatibility

declare module 'd3-dispatch' {
  export interface Dispatch<This, EventMap> {
    on<T extends keyof EventMap>(
      type: T,
      listener: (this: This, ...args: EventMap[T]) => void
    ): this;
    on(type: string, listener: (this: This, ...args: any[]) => void): this;
    call<T extends keyof EventMap>(
      type: T,
      that?: This,
      ...args: EventMap[T]
    ): void;
    call(type: string, that?: This, ...args: any[]): void;
    apply<T extends keyof EventMap>(
      type: T,
      that?: This,
      args?: EventMap[T]
    ): void;
    apply(type: string, that?: This, args?: any[]): void;
    copy(): Dispatch<This, EventMap>;
  }

  export function dispatch<
    This extends object,
    EventMap extends Record<EventNames, any[]>,
    EventNames extends keyof any = keyof EventMap
  >(
    ...types: EventNames[]
  ): Dispatch<This, EventMap>;
}





