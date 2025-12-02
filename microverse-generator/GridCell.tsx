// GridCell component removed - using direct Box components in GridOverlay for flexibility

'use client';

import React from 'react';
import { Box, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { overlayTheme } from './overlayTheme';

type GridCellProps = {
  id: string;
  row: number;
  col: number;
  label: string;
  visible: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
};

/**
 * Individual grid cell with toggle button
 * Allows click-through when no interactive elements are present
 */
export default function GridCell({
  id,
  row,
  col,
  label,
  visible,
  onToggle,
  children,
}: GridCellProps) {
  if (!visible) {
    return (
      <Box
        sx={{
          position: 'relative',
          pointerEvents: 'none',
        }}
      >
        {/* Toggle button always visible when hidden */}
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            zIndex: overlayTheme.zIndex.cell + 1,
            pointerEvents: 'auto',
            color: overlayTheme.colors.textMuted,
            backgroundColor: overlayTheme.colors.backgroundSolid,
            border: `1px solid ${overlayTheme.colors.border}`,
            borderRadius: overlayTheme.borderRadius.sm,
            padding: overlayTheme.spacing.xs,
            minWidth: 'auto',
            width: '24px',
            height: '24px',
            '&:hover': {
              color: overlayTheme.colors.text,
              backgroundColor: overlayTheme.colors.background,
              borderColor: overlayTheme.colors.borderHover,
            },
          }}
          size="small"
          aria-label={`Show ${label}`}
        >
          <VisibilityOffIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: 'none', // Click-through by default
        border: `1px solid ${overlayTheme.colors.border}`,
        overflow: 'hidden',
      }}
    >
      {/* Toggle button - top right */}
      <IconButton
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        sx={{
          position: 'absolute',
          top: 4,
          right: 4,
          zIndex: overlayTheme.zIndex.cell + 1,
          pointerEvents: 'auto',
          color: overlayTheme.colors.textSecondary,
          backgroundColor: overlayTheme.colors.backgroundSolid,
          border: `1px solid ${overlayTheme.colors.border}`,
          borderRadius: overlayTheme.borderRadius.sm,
          padding: overlayTheme.spacing.xs,
          minWidth: 'auto',
          width: '24px',
          height: '24px',
          '&:hover': {
            color: overlayTheme.colors.text,
            backgroundColor: overlayTheme.colors.background,
            borderColor: overlayTheme.colors.borderHover,
          },
        }}
        size="small"
        aria-label={`Hide ${label}`}
      >
        <CloseIcon sx={{ fontSize: 14 }} />
      </IconButton>

      {/* Cell content - interactive elements have pointer-events: auto */}
      <Box
        sx={{
          width: '100%',
          height: '100%',
          pointerEvents: 'auto', // Enable interactions for content
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

