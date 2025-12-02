import { LayoutPreset } from "./interfaces/interfaces";

export const RED_CHANNEL = 'rgba(255,0,0,1)';
export const GREEN_CHANNEL = 'rgba(0,255,0,1)';
export const BLUE_CHANNEL = 'rgba(0,0,255,1)'; 
type LayoutVector = { dx: number; dy: number; interval: number };

export const IVORY_WHITE   = "#FAF7F0"; // warmer, like an oxford shirt
export const SLATE_GRAY    = "#B0B7C3"; // wool suiting, shabby-chic gray
export const HERITAGE_GOLD = "#E2A437"; // brass buttons, vintage blazer yellow
export const CORDUROY_RUST = "#C95B2C"; // terracotta, fall tweed/cable knit
export const NEON_PINK     = "#FF4FA0"; // keep the Juno sizzle
export const OBERHEIM_TEAL = "#1CA9A6"; // synth panel aqua/teal

export const EFFECTS = [
    'Grain',
    'Tape',
    'Random Reverse',
    'Clapping',
    // 'Lisa Trigger',
    // 'Asymptotic Chopper',
    // 'Mosaic Synth',
];

// Examples from Jeff Kaufman survey
export const LAYOUTS: LayoutPreset[] = [
    {
        name: "Harmonic Table",
        vector1: { dx: 1, dy: 0, interval: 2 },   // 2 semitone steps along row
        vector2: { dx: 0.5, dy: Math.sqrt(3)/2, interval: 3 }, // diagonal vector
        category: 'isomorphic'
    },
    {
        name: "Wicki-Hayden",
        vector1: { dx: 1, dy: 0, interval: 1 }, 
        vector2: { dx: 0.5, dy: Math.sqrt(3)/2, interval: 7 },
        category: 'isomorphic'
    },
    {
        name: "Janko",
        vector1: { dx: 1, dy: 0, interval: 1 },
        vector2: { dx: 0, dy: Math.sqrt(3)/2, interval: 2 },
        category: 'isomorphic'
    },
    // Tonnetz-inspired layouts (axes mapped to perfect fifths and thirds)
    {
        name: "Tonnetz (P5 vs M3)",
        vector1: { dx: 1, dy: 0, interval: 7 }, // perfect fifths along row
        vector2: { dx: 0.5, dy: Math.sqrt(3)/2, interval: 4 }, // major thirds diagonal
        category: 'tonnetz'
    },
    {
        name: "Tonnetz (P5 vs m3)",
        vector1: { dx: 1, dy: 0, interval: 7 }, // perfect fifths along row
        vector2: { dx: 0.5, dy: Math.sqrt(3)/2, interval: 3 }, // minor thirds diagonal
        category: 'tonnetz'
    }
];

