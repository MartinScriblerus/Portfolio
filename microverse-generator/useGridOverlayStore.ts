'use client';

import { create } from 'zustand';

type CellVisibility = Record<string, boolean>;

type GridOverlayState = {
  cellVisibility: CellVisibility;
  toggleCell: (cellId: string) => void;
  setCellVisibility: (cellId: string, visible: boolean) => void;
  showAllCells: () => void;
  hideAllCells: () => void;
};

export const useGridOverlayStore = create<GridOverlayState>((set) => ({
  cellVisibility: {
    '0-0': true,
    '0-1': true,
    '0-2': true,
    '1-0': true,
    '1-1': true,
    '1-2': true,
    '2-0': true,
    '2-1': true,
    '2-2': true,
  },
  toggleCell: (cellId) =>
    set((state) => ({
      cellVisibility: {
        ...state.cellVisibility,
        [cellId]: !state.cellVisibility[cellId],
      },
    })),
  setCellVisibility: (cellId, visible) =>
    set((state) => ({
      cellVisibility: {
        ...state.cellVisibility,
        [cellId]: visible,
      },
    })),
  showAllCells: () =>
    set({
      cellVisibility: {
        '0-0': true,
        '0-1': true,
        '0-2': true,
        '1-0': true,
        '1-1': true,
        '1-2': true,
        '2-0': true,
        '2-1': true,
        '2-2': true,
      },
    }),
  hideAllCells: () =>
    set({
      cellVisibility: {
        '0-0': false,
        '0-1': false,
        '0-2': false,
        '1-0': false,
        '1-1': false,
        '1-2': false,
        '2-0': false,
        '2-1': false,
        '2-2': false,
      },
    }),
}));

