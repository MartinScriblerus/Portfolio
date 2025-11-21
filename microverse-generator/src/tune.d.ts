export interface Tune {
  scale: number[];
  mode: {
    output: string;
    input: string;
  };
  etmajor: number[];
  [key: string]: any;
}

export interface TuneConstructor {
  new (): Tune;
}

export const Tune: TuneConstructor;
