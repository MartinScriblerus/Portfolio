import { OBERHEIM_TEAL } from '../../constants';
import { Box, FormControl, Button, useTheme } from '@mui/material';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useBeatGridStore } from '../../store/useBeatGridStore';

interface SubdivisionsPickerProps {
    xVal: number;
    yVal: number;
    masterPatternsHashHook?: Record<string, Record<string, any>>; // Optional, will read from store instead
    cellSubdivisions?: number | ((x: number, y: number) => number);
    handleChangeCellSubdivisions: (num: number, x: number, y: number) => void;
}

const SubdivisionsPicker = (props: SubdivisionsPickerProps) => {
    const {  xVal, yVal, handleChangeCellSubdivisions } = props;
    
    const theme = useTheme();
    
    // Subscribe ONLY to this specific cell's subdivisions value
    // Use custom equality to prevent re-renders when other cells change
    const rawCellSubdivisions = useBeatGridStore(
        (s) => {
            const yKey = String(yVal);
            const xKey = String(xVal);
            return s.masterPatternsHashHook?.[yKey]?.[xKey]?.subdivisions ?? 1;
        }
    );
    
    // Use useMemo with equality check to prevent unnecessary updates
    const prevSubdivisionsRef = useRef<number>(rawCellSubdivisions);
    const cellSubdivisions = useMemo(() => {
        if (prevSubdivisionsRef.current === rawCellSubdivisions) {
            return prevSubdivisionsRef.current;
        }
        prevSubdivisionsRef.current = rawCellSubdivisions;
        return rawCellSubdivisions;
    }, [rawCellSubdivisions]);
    
    // Local state - only updates when cell coordinates or this cell's value changes
    const [localValue, setLocalValue] = useState<number>(cellSubdivisions);
    
    const lastCellRef = useRef<string>(`${xVal}_${yVal}`);
    const isUserEditingRef = useRef<boolean>(false);
    const lastStoreValueRef = useRef<number>(cellSubdivisions); // Track what's in the store
    const updateInProgressRef = useRef<boolean>(false); // Prevent duplicate store updates
    
    // Update local state when cell coordinates change OR when this cell's value changes externally
    useEffect(() => {
        // Don't update if user is currently editing OR if we're in the middle of an update
        if (isUserEditingRef.current || updateInProgressRef.current) {
            return;
        }
        
        const currentCell = `${xVal}_${yVal}`;
        
        // Cell changed - reset to new cell's value
        if (currentCell !== lastCellRef.current) {
            lastCellRef.current = currentCell;
            lastStoreValueRef.current = cellSubdivisions;
            setLocalValue(cellSubdivisions);
        }
        // Same cell but value changed externally - sync from store
        // Only sync if the store value actually changed (not just a re-render)
        else if (cellSubdivisions !== lastStoreValueRef.current) {
            lastStoreValueRef.current = cellSubdivisions;
            setLocalValue(cellSubdivisions);
        }
    }, [xVal, yVal, cellSubdivisions]); // Removed localValue from deps - only react to store changes
    
    return (
        <Box 
            sx={{
                display: "flex", 
                flexDirection: "row", 
                justifyContent: "flex-end",
            }}
        >
            <FormControl
                sx={{
                    // margin: '8px',
                    padding: '0px',
                    color: 'rgba(228,225,209,1)',
                    maxWidth: '76px',
                    width: '50%',
                    // height: 'auto', // ✅
                }}
            >
                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                            <Button
                                size="small"
                                onClick={() => {
                                    const next = Math.max(1, Math.floor(localValue - 1));
                                    setLocalValue(next);
                                    if (!updateInProgressRef.current && next !== lastStoreValueRef.current) {
                                        updateInProgressRef.current = true;
                                        lastStoreValueRef.current = next;
                                        handleChangeCellSubdivisions(next, xVal, yVal);
                                        requestAnimationFrame(() => { updateInProgressRef.current = false; });
                                    }
                                }}
                                sx={{ minWidth: 28, height: 28, padding: '4px' }}
                            >
                                -
                            </Button>
                            <Box sx={{ width: 56, textAlign: 'center', color: 'primary.contrastText', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 1, py: '6px', backgroundColor: OBERHEIM_TEAL }}>
                                {localValue}
                            </Box>
                            <Button
                                size="small"
                                onClick={() => {
                                    const next = Math.max(1, Math.floor(localValue + 1));
                                    setLocalValue(next);
                                    if (!updateInProgressRef.current && next !== lastStoreValueRef.current) {
                                        updateInProgressRef.current = true;
                                        lastStoreValueRef.current = next;
                                        handleChangeCellSubdivisions(next, xVal, yVal);
                                        requestAnimationFrame(() => { updateInProgressRef.current = false; });
                                    }
                                }}
                                sx={{ minWidth: 28, height: 28, padding: '4px' }}
                            >
                                +
                            </Button>
                        </Box>
            </FormControl>
        </Box>
    )
}
export default SubdivisionsPicker;