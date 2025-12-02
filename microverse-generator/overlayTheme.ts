// Standardized theme for UI overlay components
import { HERITAGE_GOLD, CORDUROY_RUST, NEON_PINK, OBERHEIM_TEAL, IVORY_WHITE, SLATE_GRAY } from './src/constants';

export const overlayTheme = {
  colors: {
    background: 'rgba(10, 10, 14, 0.85)',
    backgroundSolid: 'rgba(10, 10, 14, 0.95)',
    border: 'rgba(255, 255, 255, 0.15)',
    borderHover: 'rgba(255, 255, 255, 0.3)',
    text: 'rgba(245, 245, 245, 0.9)',
    textSecondary: 'rgba(245, 245, 245, 0.6)',
    textMuted: 'rgba(245, 245, 245, 0.4)',
    accent: HERITAGE_GOLD,
    accentHover: CORDUROY_RUST,
    primary: OBERHEIM_TEAL,
    primaryHover: NEON_PINK,
    error: NEON_PINK,
    success: OBERHEIM_TEAL,
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
  },
  borderRadius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
  },
  shadows: {
    sm: '0 2px 4px rgba(0, 0, 0, 0.2)',
    md: '0 4px 8px rgba(0, 0, 0, 0.3)',
    lg: '0 8px 16px rgba(0, 0, 0, 0.4)',
  },
  typography: {
    fontFamily: 'monospace, system-ui, -apple-system, sans-serif',
    fontSize: {
      xs: '10px',
      sm: '12px',
      md: '14px',
      lg: '16px',
      xl: '18px',
    },
  },
  zIndex: {
    grid: 1000,
    cell: 1001,
    modal: 2000,
    tooltip: 3000,
  },
  transitions: {
    fast: '150ms ease',
    normal: '250ms ease',
    slow: '350ms ease',
  },
};

export type OverlayTheme = typeof overlayTheme;

