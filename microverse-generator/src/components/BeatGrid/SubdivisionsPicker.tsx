import { OBERHEIM_TEAL } from '../../constants';
import { Box, FormControl, TextField, useTheme } from '@mui/material';
import React, { useState, useEffect, useRef, useMemo } from 'react';
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
    
    // Update local state when cell coordinates change OR when this cell's value changes externally
    useEffect(() => {
        // Don't update if user is currently editing
        if (isUserEditingRef.current) {
            return;
        }
        
        const currentCell = `${xVal}_${yVal}`;
        
        // Cell changed - reset to new cell's value
        if (currentCell !== lastCellRef.current) {
            lastCellRef.current = currentCell;
            setLocalValue(cellSubdivisions);
        }
        // Same cell but value changed externally (e.g., from another control)
        else if (cellSubdivisions !== localValue) {
            setLocalValue(cellSubdivisions);
        }
    }, [xVal, yVal, cellSubdivisions, localValue]);
    
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
            <TextField
                type="number"
                value={localValue}
                inputProps={{
                    step: 1,
                    min: 1,
                    style: {
                        color: 'primary.contrastText',
                        fontFamily: 'monospace',
                        fontSize: '16px',
                        width: '100%',
                    },
                }}
                onChange={(event) => {
                    isUserEditingRef.current = true;
                    const val = Math.max(1, Math.floor(Number(event.target.value) || 1));
                    if (val !== localValue) {
                        setLocalValue(val);
                        handleChangeCellSubdivisions(val, xVal, yVal);
                    }
                    // Reset editing flag after a short delay
                    setTimeout(() => {
                        isUserEditingRef.current = false;
                    }, 100);
                }}
                onBlur={() => {
                    isUserEditingRef.current = false;
                }}
                sx={{
                    input: { color: 'primary.contrastText' },
                    backgroundColor: OBERHEIM_TEAL,
                    maxWidth: "6rem",
                    width: '72px',
                }}
            />
            </FormControl>
        </Box>
    )
}
export default SubdivisionsPicker;