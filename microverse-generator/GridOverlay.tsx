'use client';

import React, { useState, useMemo } from 'react';
import { Box } from '@mui/material';
import { overlayTheme } from './overlayTheme';
import GridCell from './GridCell';
import { useGridOverlayStore } from './useGridOverlayStore';
import Cell00_HUDControls from './Cell00_HUDControls';
import dynamic from 'next/dynamic';

// Lazy load heavy components

type GridOverlayProps = {
  children?: React.ReactNode;
};

/**
 * 3x3 Grid Overlay System
 * Overlays Babylon canvas with click-through capability
 * Each cell can be toggled visible/hidden
 */
export default function GridOverlay({ children }: GridOverlayProps) {
  const cellVisibility = useGridOverlayStore(s => s.cellVisibility);
  const toggleCell = useGridOverlayStore(s => s.toggleCell);

  // Grid cell configurations with their content components

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(3, 1fr)',
        gap: 0,
        pointerEvents: 'none', // Allow click-through by default
        zIndex: overlayTheme.zIndex.grid,
      }}
    >
      {children}
    </Box>
  );
}

