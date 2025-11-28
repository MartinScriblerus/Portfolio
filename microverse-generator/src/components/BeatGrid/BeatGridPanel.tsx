import { Box, FormLabel, Slider, Autocomplete, TextField, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch, Button, ButtonGroup } from "@mui/material";
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { Tooltip } from "./BeatGridTooltip";
import SubdivisionsPicker from "./SubdivisionsPicker";
import { CORDUROY_RUST, HERITAGE_GOLD, OBERHEIM_TEAL, NEON_PINK } from "../../constants";
import MingusPopup from "./MingusPopup";
import GenericRadioButtons from "./GenericRadioButtons";
import NoteBuilderToggle from "./NoteBuilderToggle";
import VelocityLengthSliders from "./VelocityLengthSliders";
import StepRadioButtons from "./StepRadioButton";
import DiscreteSlider from "./ArpSpeedSliders";
import FileWindow from "../OldParentMonolith/OldFileWindow";
import { Tune } from "../../tune";
import { useRhythmCache } from "../../hooks/useRhythmCache";
import { useOldMonolithStore } from "../../store/useOldMonolithStore";
import { useBeatGridStore } from "../../store/useBeatGridStore";
import { formatNoteNameWithOctave } from "../../utils/utils";
import type { MingusSelections } from "./MingusPopup";
import MicrotonesWrapper from "../MicrotonesWrapper";

type BeatGridPanelProps = {
    bpm: number;
    beatsPerMeasure: number;
    stepsPerMeasure: number;
    stepsPerBeat: number;
    isChuckRunning: boolean;
    featuresLegendData: any[];
    universalSources: any;
    handleSourceToggle: (name: string, val: any) => void;
    vizSource: string;
    currentBeatSynthCount: any;
    handleOsc1RateUpdate: any;
    handleMasterFastestRate: any;
    handleStkRateUpdate: any;
    handleSamplerRateUpdate: any;
    handleAudioInRateUpdate: any;
    currentNoteVals: any;
    filesToProcess: any;
    numeratorSignature: any;
    denominatorSignature: any;
    editPattern: any;
    masterPatternsHashHook: any;
    masterPatternsHashHookUpdated: any;
    inPatternEditMode: any;
    selectFileForAssignment: any;
    handleChangeCellSubdivisions: any;
    cellSubdivisions: any;
    resetCellSubdivisionsCounter: any;
    handleClickUploadedFiles: any;
    parentDiv: any;
    masterFastestRate: number;

    currentBeatCountToDisplay: number;
    currentNumerCountColToDisplay: number;
    currentDenomCount: number;
    currentPatternCount: number;

    clickHeatmapCell: any;

    exitEditMode: () => void;
    isInPatternEditMode: boolean;

    handleLatestSamples: (
        fileNames: string[],
        xVal: number,
        yVal: number,
    ) => void;
    handleLatestNotes: (
        notes: string[],
        xVal: number,
        yVal: number,
    ) => void;

    mTFreqs: number[];
    mTMidiNums: number[];
    updateKeyScaleChord: (a: any, b: any, c: any, d: any, e: any, f: any, g: any) => void;
    handleAssignPatternNumber: (e: any) => void;
    doAutoAssignPatternNumber: number;
    setStkValues: React.Dispatch<React.SetStateAction<any>>;
    tune: Tune;
    currentMicroTonalScale: (scale: any) => void;
    setFxKnobsCount: React.Dispatch<React.SetStateAction<number>>;
    doUpdateBabylonKey: any;
    babylonKey: string;
    currentScreen: React.MutableRefObject<string>;
    currentFX: React.MutableRefObject<any>;
    currentStkTypeVar: React.MutableRefObject<string>;
    updateCurrentFXScreen: any;
    getSTK1Preset: (x: string) => any;
    universalSourcesRef: React.MutableRefObject<any>;
    updateMicroTonalScale: (scale: any) => void;
    mingusKeyboardData: any;
    mingusChordsData: any;
    updateMingusData: (data: any) => void;
    handleChangeNotesAscending: (order: string) => void;
    mTNames: string[];
    fxRadioValue: string;
    noteBuilderFocus: string;
    handleNoteBuilder: (focus: string) => void;
    handleNoteLengthUpdate: (e: any, cellData: any, newValue: any) => void;
    handleNoteVelocityUpdate: (e: any, cellData: any) => void;
    currentSelectedCell: { x: number; y: number };
    octaveMax: number;
    octaveMin: number;
    uploadedBlob: React.MutableRefObject<any>;
    getMeydaData: (fileData: ArrayBuffer) => Promise<any>;
    clickedFile: React.MutableRefObject<string | null>;
    chuckRef: React.MutableRefObject<any>;
    onBpmDetected: (bpm: number | null) => void;
}

const BeatGridPanel = (props: BeatGridPanelProps) => {
    const {
        bpm,
        beatsPerMeasure,
        stepsPerMeasure,
        stepsPerBeat,
        isChuckRunning,
        featuresLegendData,
        vizSource,
        currentBeatSynthCount,
        handleOsc1RateUpdate,
        handleMasterFastestRate,
        handleStkRateUpdate,
        handleSamplerRateUpdate,
        handleAudioInRateUpdate,
        currentNoteVals,
        filesToProcess,
        numeratorSignature,
        denominatorSignature,
        editPattern,
        masterPatternsHashHook,
        masterPatternsHashHookUpdated,
        inPatternEditMode,
        selectFileForAssignment,
        handleChangeCellSubdivisions,
        cellSubdivisions,
        resetCellSubdivisionsCounter,
        handleClickUploadedFiles,
        parentDiv,
        currentBeatCountToDisplay,
        currentNumerCountColToDisplay,
        currentDenomCount,
        currentPatternCount,
        masterFastestRate,
        exitEditMode,
        isInPatternEditMode,
        clickHeatmapCell,
        handleLatestSamples,
        handleLatestNotes,
        mTFreqs,
        mTMidiNums,
        updateKeyScaleChord,
        handleAssignPatternNumber,
        doAutoAssignPatternNumber,
        setStkValues,
        tune,
        currentMicroTonalScale,
        setFxKnobsCount,
        doUpdateBabylonKey,
        babylonKey,
        currentScreen,
        currentFX,
        currentStkTypeVar,
        updateCurrentFXScreen,
        getSTK1Preset,
        universalSources,
        updateMicroTonalScale,
        mingusKeyboardData,
        mingusChordsData,
        updateMingusData,
        handleChangeNotesAscending,
        mTNames,
        fxRadioValue: fxRadioValueProp,
        noteBuilderFocus,
        handleNoteBuilder,
        handleNoteLengthUpdate,
        handleNoteVelocityUpdate,
        currentSelectedCell: currentSelectedCellProp,
        octaveMax,
        octaveMin,
        uploadedBlob,
        getMeydaData,
        clickedFile,
        chuckRef,
        onBpmDetected
    } = props;
    const [width, setWidth] = useState<number | undefined>(undefined);
    const [height, setHeight] = useState<number | undefined>(undefined);
    const containerRef = useRef<HTMLDivElement>(null);

    // Build rhythm DFS/next-event cache on load and on grid updates
    // Ensures cache is constructed before first audio run
    const { cacheRef, version } = useRhythmCache();

    // Safely capture and expose rhythm events when cache updates
    useEffect(() => {
        const cache = cacheRef.current;
        if (cache.version === -1 || cache.events.length === 0) {
            // Cache not yet built
            return;
        }

        // Cache is ready - events are available at cache.events
        // This is a linear/flattened array sorted by time (t)
        // Each event has: { y, x, t, length, velocity, fileIdxs?, noteNames? }
        console.log(`[RhythmCache] Cache updated (v${cache.version}), ${cache.events.length} events ready`);
        
        // TODO: Schedule audio events here or dispatch to audio system
        // Example: cache.events.forEach(evt => scheduleNote(evt));
        
    }, [version, cacheRef]);

    useEffect(() => {
        try {
            if (parentDiv && parentDiv.getBoundingClientRect()) {
                setWidth(parentDiv.getBoundingClientRect().width);
                setHeight(parentDiv.getBoundingClientRect().height);
            }
        } catch (error) {
            console.error("Error getting parent div dimensions: ", error);
        }
    }, [parentDiv]);

    // ---- Flattened Heatmap logic below ----
    type InteractionData = { xLabel: string; yLabel: string; xPos: number; yPos: number; value: number; instrument: string; };
    const [hoveredCell, setHoveredCell] = useState<InteractionData | null>(null);
    // Hover state for tooltip

    type HeatmapRow = { x: string; y: string; value: number };
    const nCol = Number(numeratorSignature) * Number(denominatorSignature) || 16;
    const nRow = Number(denominatorSignature) || 4;
    const xLabels = Number.isFinite(nCol) && nCol > 0 ? Array.from({ length: nCol }, (_, i) => i) : [];
    const yLabels = Number.isFinite(nRow) && nRow > 0 ? Array.from({ length: nRow }, (_, i) => i + 1) : [];
    const heatmapData: HeatmapRow[] = [];
    if (xLabels.length > 0 && yLabels.length > 0) {
        for (let x of xLabels) { for (let y of yLabels) { heatmapData.push({ x: x.toString(), y: y.toString(), value: x }); } }
    }

    const MARGIN = { top: 10, right: 30, bottom: 30, left: 30 };
    type CellData = { note: number[] | any, notesHz: number[] | any, velocity: number[] | any, volume: number[] | any, subdivisions: number; length: number[] | any; on: boolean; xVal?: number | null; yVal?: number | null; zVal?: number | null; };

    const [showPatternEditorPopup, setShowPatternEditorPopup] = useState<boolean>(false);
    const [noteVelocityValue, setNoteVelocityValue] = useState<number>(0.5);
    const [noteVolumeValue, setNoteVolumeValue] = useState<number>(0.5);
    const currentXVal = useRef<number>(0);
    const currentYVal = useRef<number>(0);
    const cellData = useRef<CellData[]>(null);
    const mingusSelectionsRef = useRef<MingusSelections | null>(null);

    // Get currentSelectedCell from store (prefer store over prop)
    const currentSelectedCellFromStore = useBeatGridStore((s) => s.currentSelectedCell);
    const currentSelectedCell = currentSelectedCellProp || currentSelectedCellFromStore || { x: 0, y: 0 };
    
    // Get keyboard mode from store
    const keyboardMode = useOldMonolithStore((s) => s.keyboardMode);
    const setKeyboardMode = useOldMonolithStore((s) => s.setKeyboardMode);
    const sampleVoiceEnabled = useOldMonolithStore((s) => s.sampleVoiceEnabled);
    const setSampleVoiceEnabled = useOldMonolithStore((s) => s.setSampleVoiceEnabled);
    const sampleFileName = useOldMonolithStore((s) => s.sampleFileName);
    const setSampleFileName = useOldMonolithStore((s) => s.setSampleFileName);
    
    // Get uploaded file names for sample selector
    // filesToProcess items have structure: { data, filename, processed }
    // Extract filename strings to avoid rendering objects
    const uploadedNames = filesToProcess ? (Array.isArray(filesToProcess) ? filesToProcess.map((f: any) => {
        // Try filename first (from useFileUploads), then name (from File API), then string
        const name = f?.filename || f?.name || (typeof f === 'string' ? f : null);
        return name;
    }).filter(Boolean) : []) : [];
    
    // Preloaded server files (DR-55Snare, Conga, etc.) - these are always available
    const preloadedFiles = [
        "DR-55Snare.wav",
        "DR-55Kick.wav", 
        "DR-55Hat.wav",
        "DR-55Pop.wav",
        "Conga.wav"
    ];
    
    // Combine preloaded files with uploaded files for the dropdown
    const allAvailableFiles = Array.from(new Set([...preloadedFiles, ...uploadedNames]));
    
    // Debug: log if files exist but names are empty
    if (filesToProcess && Array.isArray(filesToProcess) && filesToProcess.length > 0 && uploadedNames.length === 0) {
        console.warn('[BeatGrid] filesToProcess has items but uploadedNames is empty:', filesToProcess.map((f: any) => ({ hasFilename: !!f?.filename, hasName: !!f?.name, type: typeof f, keys: Object.keys(f || {}) })));
    }
    
    // local instrument label not used by Tooltip; omit extra state
    const widthSvg = 540;
    const heightSvg = 200;
    const [boundsWidth, setBoundsWidth] = useState<number>(widthSvg - MARGIN.right - MARGIN.left || 0);
    const [boundsHeight, setBoundsHeight] = useState<number>(heightSvg - MARGIN.top - MARGIN.bottom || 0);
    // Fixed: Removed boundsHeight/boundsWidth from deps to prevent infinite loop
    useEffect(() => {
        if (widthSvg > 0 && heightSvg > 0) {
            const newWidth = widthSvg - MARGIN.right - MARGIN.left;
            const newHeight = heightSvg - MARGIN.top - MARGIN.bottom;
            if (newWidth !== boundsWidth) setBoundsWidth(newWidth);
            if (newHeight !== boundsHeight) setBoundsHeight(newHeight);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [widthSvg, heightSvg]); // Only depend on widthSvg/heightSvg, not the state we're setting

    // Measure container dimensions using ResizeObserver for accurate, render-safe measurements
    useEffect(() => {
        if (!containerRef.current) return;

        // Set initial dimensions immediately
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
            setWidth(rect.width);
            setHeight(rect.height);
        }

        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { width: w, height: h } = entry.contentRect;
                if (w > 0 && h > 0) {
                    setWidth(w);
                    setHeight(h);
                }
            }
        });

        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    const xScale = useMemo(() => {
        if (!xLabels || xLabels.length === 0 || boundsWidth <= 0) return null;
        return d3.scaleBand().domain(xLabels.map((d: any) => d.toString())).range([0, boundsWidth]).padding(0.01);
    }, [xLabels, boundsWidth]);
    const yScale = useMemo(() => {
        if (!yLabels || yLabels.length === 0 || boundsHeight <= 0) return null;
        return d3.scaleBand().domain(yLabels.map((d: any) => d.toString())).range([boundsHeight, 0]).padding(0.01);
    }, [yLabels, boundsHeight]);
    const handleNoteVelocityUpdateLocal = (e: any, newValue: number | number[]) => { 
        setNoteVelocityValue(newValue as number);
        // Update velocity in cell data for currently selected cell
        const xKey = String(currentSelectedCell.x);
        const yKey = String(currentSelectedCell.y);
        const cell = (masterPatternsHashHook as any)?.[yKey]?.[xKey];
        if (cell) {
            // Update velocity in the cell data
            const updatedCell = { ...cell, velocity: Array.isArray(cell.velocity) ? cell.velocity.map(() => newValue as number) : newValue as number };
            (masterPatternsHashHook as any)[yKey][xKey] = updatedCell;
            // Trigger update
            useBeatGridStore.getState().setMasterPatternsHashHook({ ...masterPatternsHashHook });
        }
        // Also call the original handler for backward compatibility
        handleNoteVelocityUpdate(e, cellData); 
    };
    
    // Handle volume updates - similar to velocity but for volume
    const handleNoteVolumeUpdateLocal = (e: any, newValue: number | number[]) => {
        setNoteVolumeValue(newValue as number);
        // Update volume in cell data for currently selected cell
        const xKey = String(currentSelectedCell.x);
        const yKey = String(currentSelectedCell.y);
        const cell = (masterPatternsHashHook as any)?.[yKey]?.[xKey];
        if (cell) {
            // Update volume in the cell data
            const updatedCell = { ...cell, volume: Array.isArray(cell.volume) ? cell.volume.map(() => newValue as number) : [newValue as number] };
            (masterPatternsHashHook as any)[yKey][xKey] = updatedCell;
            // Trigger update
            useBeatGridStore.getState().setMasterPatternsHashHook({ ...masterPatternsHashHook });
        }
    };
    
    // Sync slider values with currently selected cell
    useEffect(() => {
        const xKey = String(currentSelectedCell.x);
        const yKey = String(currentSelectedCell.y);
        const cell = (masterPatternsHashHook as any)?.[yKey]?.[xKey];
        if (cell) {
            // Set velocity from cell (use first value if array, or the value itself)
            if (cell.velocity !== undefined) {
                const velValue = Array.isArray(cell.velocity) ? (cell.velocity[0] ?? 0.5) : (typeof cell.velocity === 'number' ? cell.velocity : 0.5);
                setNoteVelocityValue(velValue);
            } else {
                setNoteVelocityValue(0.5);
            }
            // Set volume from cell (use first value if array, or the value itself)
            if (cell.volume !== undefined) {
                const volValue = Array.isArray(cell.volume) ? (cell.volume[0] ?? 0.5) : (typeof cell.volume === 'number' ? cell.volume : 0.5);
                setNoteVolumeValue(volValue);
            } else {
                setNoteVolumeValue(0.5);
            }
        } else {
            // Reset to defaults if no cell selected
            setNoteVelocityValue(0.5);
            setNoteVolumeValue(0.5);
        }
    }, [currentSelectedCell.x, currentSelectedCell.y, masterPatternsHashHook]);
    const didSetupHeatmap = useRef<boolean>(false);

    // Subscribe to fxRadioValue from store to ensure reactivity - memoized to prevent re-renders
    const fxRadioValueFromStore = useOldMonolithStore((s) => s.fxRadioValue);
    const fxRadioValue = useMemo(() => fxRadioValueProp || fxRadioValueFromStore, [fxRadioValueProp, fxRadioValueFromStore]);
    const triggerEditPattern = async (e: any, num: any) => {
        const string: any = e && Object.values(e.target)[1] || null;
        const isFill = e && string && string.id && string.id.includes("fill");
        const vals = !e || (string.length < 1) || (string && !string.id) ? ["1", "1"] : !isFill ? string.id.split("_") : string.id.replace("fill_", "").split("_");
        const xVal = Number(num);
        const yVal = Number(vals[1]) || 1;
        clickHeatmapCell(xVal, yVal);
        const zVal = vals[2] || null;
        xVal && yVal && resetCellSubdivisionsCounter(xVal, yVal);
        currentXVal.current = Number(xVal);
        currentYVal.current = Number(yVal);
        // Update selected cell in store when a cell is clicked
        useBeatGridStore.getState().setCurrentSelectedCell({ x: Number(xVal), y: Number(yVal) });
        cellData.current = xVal && yVal && masterPatternsHashHook[`${Number(yVal)}`]?.length > 0 ? { xVal: Number(xVal), yVal: Number(yVal), zVal: zVal, ...masterPatternsHashHook[`${Number(yVal)}`][`${Number(xVal)}`] } as any : {};
        
        // Update slider values from cell data
        const currentCell = cellData.current as any;
        if (currentCell && currentCell.velocity !== undefined) {
            const vel = Array.isArray(currentCell.velocity) ? currentCell.velocity[0] : currentCell.velocity;
            setNoteVelocityValue(typeof vel === 'number' ? vel : 0.5);
        } else {
            setNoteVelocityValue(0.5);
        }
        
        if (currentCell && currentCell.volume !== undefined) {
            const vol = Array.isArray(currentCell.volume) ? currentCell.volume[0] : currentCell.volume;
            setNoteVolumeValue(typeof vol === 'number' ? vol : 0.5);
        } else {
            setNoteVolumeValue(0.5);
        }
        
        setShowPatternEditorPopup(true);
    };

    useEffect(() => { if (!currentXVal.current && !didSetupHeatmap.current) { triggerEditPattern(null, 0); didSetupHeatmap.current = true; } }, []);

    const allShapes = heatmapData.map((d) => {
        if (!xScale || !yScale) return null;
        const x = xScale(d.x); const y = yScale(d.y); if (d.value === null || !x || !y) { return null; }
        const patOptions = [0, 2, 4, 8, 16];


        return (
            <React.Fragment key={`rectFillsWrapper_${d.x}_${d.y}`}>
                {masterPatternsHashHook && masterPatternsHashHook[`${d.y}`] && masterPatternsHashHook[`${d.y}`][`${d.x}`] &&
                    Array.from({ length: masterPatternsHashHook[`${d.y}`][`${d.x}`].subdivisions }).map((_, idx) => (
                        <React.Fragment key={`overlay_note_${idx}_${d.x}_${d.y}`}>
                            <rect
                                width={xScale.bandwidth() / (masterPatternsHashHook[`${d.y}`][d.x].subdivisions * (1 / (Array.isArray(masterPatternsHashHook[`${d.y}`][d.x].length) ? masterPatternsHashHook[`${d.y}`][d.x].length[0] || 1 : masterPatternsHashHook[`${d.y}`][d.x].length || 1)))}
                                height={yScale.bandwidth() / 2.5}
                                key={`main_cell_noteEl_${d.x}_${d.y}`}
                                r={4}
                                opacity={masterPatternsHashHook[`${d.y}`][`${d.x}`].velocity}
                                fill={masterPatternsHashHook[`${d.y}`][`${d.x}`].noteName?.join().length > 0 ? HERITAGE_GOLD : "transparent"}
                                id={`fill_noteEl_${d.x}_${d.y}`}
                                x={(xScale(d.x)! + (xScale.bandwidth() * idx) / masterPatternsHashHook[d.y][d.x].subdivisions)}
                                y={yScale(d.y)}
                                style={{ pointerEvents: "none" }}
                            />
                            <rect
                                width={masterPatternsHashHook[`${Number(d.y) - 1}`] && masterPatternsHashHook[`${Number(d.y) - 1}`][d.x] ? (xScale.bandwidth() / masterPatternsHashHook[Number(d.y) - 1][d.x].subdivisions) * ((Array.isArray(masterPatternsHashHook[Number(d.y) - 1][d.x].length) ? masterPatternsHashHook[Number(d.y) - 1][d.x].length[0] || 1 : masterPatternsHashHook[Number(d.y) - 1][d.x].length || 1) * currentNumerCountColToDisplay) : 0}
                                height={yScale.bandwidth() / 2.5}
                                key={`main_cell_sampleEl_${d.x}_${d.y}`}
                                r={4}
                                opacity={masterPatternsHashHook[`${Number(d.y) - 1}`] && masterPatternsHashHook[`${Number(d.y) - 1}`][`${d.x}`] ? masterPatternsHashHook[`${Number(d.y) - 1}`][`${d.x}`].velocity * 2 : 0}
                                fill={masterPatternsHashHook[`${Number(d.y) - 1}`] && masterPatternsHashHook[`${Number(d.y) - 1}`][`${d.x}`] && masterPatternsHashHook[`${Number(d.y) - 1}`][`${d.x}`].fileNums?.join().length > 0 ? OBERHEIM_TEAL : "transparent"}
                                id={`fill_sampleEl_${d.x}_${d.y}`}
                                x={masterPatternsHashHook[`${Number(d.y) - 1}`] && masterPatternsHashHook[`${Number(d.y) - 1}`][d.x] ? (xScale(d.x)! + (xScale.bandwidth() * idx) / masterPatternsHashHook[`${Number(d.y) - 1}`][d.x].subdivisions) : 0}
                                y={(yScale(d.y) || 0) + yScale.bandwidth() / 3}
                                style={{ pointerEvents: "none" }}
                            />
                            {masterPatternsHashHook[`${d.y}`][`${d.x}`].noteName?.join().length > 0 && (
                                <text x={x! + 2} y={y! + 10 + idx * 10} key={`text1_${idx}_${d.x}_${d.y}`} fontSize={8} fill={'white'}>
                                    {masterPatternsHashHook[`${d.y}`][`${d.x}`].noteName}
                                </text>
                            )}
                            {masterPatternsHashHook[`${Number(d.y) - 1}`] && masterPatternsHashHook[`${Number(d.y) - 1}`][`${d.x}`] && masterPatternsHashHook[`${Number(d.y) - 1}`][`${d.x}`].fileNums?.join().length > 0 && (
                                <text x={x! + 2} y={y! + 10 + idx * 10 + yScale.bandwidth() / 3} key={`text2_${idx}_${d.x}_${d.y}`} fontSize={8} fill={'white'}>
                                    {1 / (Array.isArray(masterPatternsHashHook[`${Number(d.y)}`]?.[`${d.x}`]?.length) ? masterPatternsHashHook[`${Number(d.y)}`][`${d.x}`].length[0] || 1 : masterPatternsHashHook[`${Number(d.y)}`]?.[`${d.x}`]?.length || 1)}
                                </text>
                            )}
                            <rect
                                key={`main_cell_${d.x}_${d.y}`}
                                r={4}
                                id={`fill_${d.x}_${d.y}`}
                                x={(xScale(d.x)! + (xScale.bandwidth() * idx) / masterPatternsHashHook[d.y][d.x].subdivisions)}
                                y={yScale(d.y)}
                                width={(xScale.bandwidth() / masterPatternsHashHook[d.y][d.x].subdivisions)}
                                height={yScale.bandwidth()}
                                opacity={
                                    (patOptions[doAutoAssignPatternNumber] > 0 && ((16 * (Number(d.y) - 1) + Number(d.x)) - (16 * currentSelectedCell.y + currentSelectedCell.x)) % (16 / patOptions[doAutoAssignPatternNumber]) === 0) ||
                                        (patOptions[doAutoAssignPatternNumber] === 0 && currentSelectedCell.x === Number(d.x) && currentSelectedCell.y === Number(d.y)) ||
                                        currentBeatCountToDisplay === Number(d.x) && currentNumerCountColToDisplay === Number(d.y)
                                        ? 0.8 : 0.5
                                }
                                fill={
                                    currentBeatCountToDisplay === Number(d.x) && currentNumerCountColToDisplay === Number(d.y) ||
                                        Number(currentSelectedCell.x) === Number(d.x) && Number(currentSelectedCell.y) === Number(d.y)
                                        ? NEON_PINK
                                        : currentBeatCountToDisplay === Number(d.x)
                                            ? CORDUROY_RUST
                                            : (Number(d.y) > 0) ? OBERHEIM_TEAL : NEON_PINK
                                }
                                stroke={
                                    Number(currentSelectedCell.x) === Number(d.x) && Number(currentSelectedCell.y) === Number(d.y)
                                        ? HERITAGE_GOLD  // More recognizable gold border for selected cell
                                        : 'rgba(245,245,245,0.78)'
                                }
                                strokeWidth={
                                    Number(currentSelectedCell.x) === Number(d.x) && Number(currentSelectedCell.y) === Number(d.y)
                                        ? 3  // Thicker border for selected cell
                                        : 1
                                }
                                strokeDasharray={
                                    Number(currentSelectedCell.x) === Number(d.x) && Number(currentSelectedCell.y) === Number(d.y)
                                        ? '0'  // Solid border for selected cell
                                        : 'none'
                                }
                                onClick={(e: any) => {
                                    e.stopPropagation();
                                    // Pass y value in the event target value format that triggerEditPattern expects
                                    const fakeEvent = { ...e, target: { ...e.target, value: `${d.x}|${d.y}` } };
                                    triggerEditPattern(fakeEvent, d.x);
                                }}
                                onMouseEnter={() => {
                                    setHoveredCell({ xLabel: d.x, yLabel: d.y, xPos: x, yPos: y, value: Math.round(d.value * 100) / 100, instrument: "" });
                                }}
                                onMouseLeave={() => setHoveredCell(null)}
                                cursor="pointer"
                                style={{ zIndex: 1, pointerEvents: "auto" }}
                            >
                                <text>{d.x} {d.y}</text>
                            </rect>
                        </React.Fragment>
                    ))}
            </React.Fragment>
        );
    });

    // ---- Inline shared controls ----
    type Option = { value: string; label: string };

    const ParameterMultiSelect: React.FC<{
        options: Option[];
        value: Option[];
        placeholder?: string;
        onChange: (value: Option[]) => void;
    }> = ({ options, value, placeholder = "Select...", onChange }) => {
        // Debug: parameter multi-select
        // console.log('[ParameterMultiSelect] Options:', options.length, 'Value:', value.length);
        return (
            <Autocomplete
                multiple
                disableCloseOnSelect
                openOnFocus
                options={options}
                value={value}
                onChange={(_e, v) => {
                    // Debug: parameter multi-select onChange
                    // console.log('[ParameterMultiSelect] onChange called with:', v);
                    onChange(v as Option[]);
                }}
                getOptionLabel={(opt) => opt.label || opt.value || ''}
                isOptionEqualToValue={(opt, val) => opt.value === val.value}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        variant="outlined"
                        size="small"
                        placeholder={placeholder}
                        sx={{
                            color: 'rgba(245,245,245,0.78)',
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(245,245,245,0.3)',
                            },
                            '& .MuiInputBase-input': {
                                color: 'rgba(245,245,245,0.78)',
                            },
                        }}
                        onClick={(e) => {
                            // Debug: parameter multi-select click
                            // console.log('[ParameterMultiSelect] TextField clicked');
                            e.stopPropagation();
                        }}
                    />
                )}
                slotProps={{
                    popper: {
                        sx: {
                            zIndex: 99999,
                            '& .MuiAutocomplete-paper': {
                                backgroundColor: 'rgba(28,28,28,0.95)',
                                '& .MuiAutocomplete-listbox': {
                                    '& .MuiAutocomplete-option': {
                                        color: 'rgba(245,245,245,0.78)',
                                        '&:hover': {
                                            backgroundColor: 'rgba(255,255,255,0.1)',
                                        },
                                        '&[aria-selected="true"]': {
                                            backgroundColor: 'rgba(255,255,255,0.15)',
                                        },
                                    },
                                },
                            },
                        },
                        style: {
                            zIndex: 99999,
                        },
                        placement: 'bottom-start',
                        modifiers: [
                            {
                                name: 'offset',
                                options: {
                                    offset: [0, 4],
                                },
                            },
                        ],
                    },
                    paper: {
                        sx: {
                            zIndex: 99999,
                            backgroundColor: 'rgba(28,28,28,0.95)',
                            '& .MuiAutocomplete-listbox': {
                                '& .MuiAutocomplete-option': {
                                    color: 'rgba(245,245,245,0.78)',
                                    '&:hover': {
                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                    },
                                    '&[aria-selected="true"]': {
                                        backgroundColor: 'rgba(255,255,255,0.15)',
                                    },
                                },
                            },
                        },
                        style: {
                            zIndex: 99999,
                        },
                    },
                }}
                sx={{
                    width: '100%',
                    position: 'relative',
                    zIndex: 99999,
                    color: 'rgba(245,245,245,0.78)',
                    '& .MuiAutocomplete-inputRoot': {
                        color: 'rgba(245,245,245,0.78)',
                        backgroundColor: 'transparent',
                        '& .MuiAutocomplete-input': {
                            color: 'rgba(245,245,245,0.78)',
                        },
                        '& input': {
                            color: 'rgba(245,245,245,0.78)',
                        },
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(245,245,245,0.3)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(245,245,245,0.5)',
                    },
                    '& .MuiAutocomplete-popper': {
                        zIndex: '99999 !important',
                    },
                    '& .MuiAutocomplete-paper': {
                        backgroundColor: 'rgba(28,28,28,0.95)',
                        zIndex: 99999,
                        '& .MuiAutocomplete-listbox': {
                            '& .MuiAutocomplete-option': {
                                color: 'rgba(245,245,245,0.78) !important',
                                '&:hover': {
                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                },
                                '&[aria-selected="true"]': {
                                    backgroundColor: 'rgba(255,255,255,0.15)',
                                },
                            },
                        },
                    },
                    '& .MuiAutocomplete-option': {
                        color: 'rgba(245,245,245,0.78) !important',
                    },
                }}
            />
        );
    };

    const ParameterSlider: React.FC<{
        label?: string;
        value: number;
        min: number;
        max: number;
        step?: number;
        onChange: (e: any, v: number) => void;
    }> = ({ label, value, min, max, step = 0.01, onChange }) => (
        <Box sx={{ width: "100%" }}>
            {label && (
                <FormLabel sx={{ color: 'rgba(245,245,245,0.78)', fontSize: '11px', mb: 0.5 }}>
                    {label}
                </FormLabel>
            )}
            <Slider
                value={value}
                min={min}
                max={max}
                step={step}
                valueLabelDisplay="auto"
                onChange={onChange}
                sx={{ width: "80%", color: 'rgba(245,245,245,0.78)', backgroundColor: 'rgba(28,28,28,0.78)' }}
            />
        </Box>
    );

    // Build options and preselected values for Samples
    const sampleOptions: Option[] = useMemo(() => {
        const names = Array.from(new Set<string>((filesToProcess || []).map((f: any) => String(f.filename)))) as string[];
        return names.map((name) => ({ value: name, label: name }));
    }, [filesToProcess]);

    const sampleSelected: Option[] = useMemo(() => {
        const cell = masterPatternsHashHook?.[`${currentYVal.current}`]?.[`${currentXVal.current}`];
        const idxs = cell?.fileNums ? Array.from(cell.fileNums) : [];
        return (idxs as number[]).map((i) => sampleOptions[i]).filter(Boolean);
    }, [masterPatternsHashHook, currentXVal.current, currentYVal.current, sampleOptions]);

    const handleSamplesChange = (vals: Option[]) => {
        handleLatestSamples(vals.map((o) => o.value), currentXVal.current, currentYVal.current - 1);
    };

    // Build options and preselected values for Notes
    const notesOptions: Option[] = useMemo(() => {
        const minOct = Number(octaveMin);
        const maxOct = Number(octaveMax);
        const out: Option[] = [];
        for (let o = minOct; o <= maxOct; o++) {
            for (const n of mTNames) {
                const v = `${n}-${o}`;
                out.push({ value: v, label: v });
            }
        }
        return out;
    }, [mTNames, octaveMin, octaveMax]);

    // Fixed: Use gridVersion instead of full masterPatternsHashHook to prevent re-renders
    const gridVersion = useBeatGridStore((s) => s.gridVersion);
    const notesSelected: Option[] = useMemo(() => {
        const yKey = String(currentYVal.current);
        const xKey = String(currentXVal.current);
        const cell = masterPatternsHashHook?.[yKey]?.[xKey];
        const names = cell?.noteName ? (Array.isArray(cell.noteName) ? cell.noteName : [cell.noteName]).filter(Boolean) : [];

        // Debug: notes selected
        // console.log('[notesSelected] Cell:', { x: xKey, y: yKey }, 'noteName:', names, 'notesOptions count:', notesOptions.length);

        // Try to match stored note names with options (handle both "C-4" and "C4" formats)
        const matched = (names as string[]).map((name) => {
            const strName = String(name).trim();
            // Try exact match first
            let found = notesOptions.find((o) => o.value === strName);
            // If not found, try without dash (e.g., "C4" matches "C-4")
            if (!found) {
                found = notesOptions.find((o) => o.value.replace('-', '') === strName.replace('-', ''));
            }
            // If still not found, try with dash (e.g., "C-4" matches "C4")
            if (!found) {
                found = notesOptions.find((o) => o.value === strName.replace(/(\d)/, '-$1'));
            }
            // If still not found, try reverse (e.g., "C-4" matches "C4")
            if (!found && strName.includes('-')) {
                const withoutDash = strName.replace('-', '');
                found = notesOptions.find((o) => o.value === withoutDash);
            }
            if (!found) {
                console.warn('[notesSelected] Could not match note:', strName, 'available options sample:', notesOptions.slice(0, 5).map(o => o.value));
            }
            return found;
        }).filter(Boolean) as Option[];

        // Debug: notes matched
        // console.log('[notesSelected] Matched', matched.length, 'out of', names.length, 'notes');
        return matched;
    }, [masterPatternsHashHook, currentXVal.current, currentYVal.current, notesOptions, gridVersion]);

    const handleNotesChange = (vals: Option[]) => {
        handleLatestNotes(vals.map((o) => o.value), currentXVal.current, currentYVal.current);
    };

    // Helper: Generate chord notes from key + chord using Tune class
    const generateChordNotes = (key: string, chordValue: string, octave: number = 4): string[] => {
        if (!tune || !tune.scale || !Array.isArray(tune.scale)) {
            console.warn('[generateChordNotes] Tune or scale not available');
            return [];
        }

        try {
            // Map chord symbols to scale degrees (for major scale)
            // M = Major (1, 3, 5), m = minor (1, b3, 5), etc.
            const chordDegrees: Record<string, number[]> = {
                'M': [0, 2, 4],      // Major: 1, 3, 5
                'm': [0, 2, 3],      // Minor: 1, b3, 5 (approximate)
                '7': [0, 2, 4, 6],   // Dominant 7: 1, 3, 5, b7
                'm7': [0, 2, 3, 5],  // Minor 7: 1, b3, 5, b7
                'M7': [0, 2, 4, 6],  // Major 7: 1, 3, 5, 7
                'dim': [0, 1, 3],     // Diminished: 1, b3, b5
                'aug': [0, 2, 4],    // Augmented: 1, 3, #5
            };

            const degrees = chordDegrees[chordValue] || chordDegrees['M'];
            const notes: string[] = [];
            const stepsPerOctave = tune.scale.length;

            // Use Tune class to get proper note names
            for (const degree of degrees) {
                try {
                    // Get frequency from Tune
                    (tune as any).mode.output = 'frequency';
                    const freq = Number(tune.note(degree, octave));

                    if (Number.isFinite(freq)) {
                        // For 12-TET, generate note name in "C-4" format to match notesOptions
                        if (stepsPerOctave === 12) {
                            // Calculate MIDI note number (C4 = 60)
                            const midiNote = 60 + (octave - 4) * 12 + degree + getKeyOffset(key);
                            const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
                            const noteName = noteNames[midiNote % 12];
                            const noteOctave = Math.floor(midiNote / 12) - 1;
                            // Format as "C-4" to match notesOptions format
                            const formatted = `${noteName}-${noteOctave}`;
                            notes.push(formatted);
                        } else {
                            // For microtonal scales, use degree/octave format
                            notes.push(`${degree}/${stepsPerOctave}@${octave}`);
                        }
                    }
                } catch (e) {
                    console.warn('[generateChordNotes] Error generating note for degree', degree, e);
                }
            }

            return notes;
        } catch (e) {
            console.error('[generateChordNotes] Error:', e);
            return [];
        }
    };

    // Helper: Get key offset (C=0, C#=1, D=2, etc.)
    const getKeyOffset = (key: string): number => {
        const keyMap: Record<string, number> = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
            'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
            'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
        };
        return keyMap[key] || 0;
    };

    // Helper: Generate scale notes from key + scale using Tune class
    const generateScaleNotes = (key: string, scaleName: string, octaveMin: number, octaveMax: number): string[] => {
        if (!tune || !tune.scale || !Array.isArray(tune.scale)) {
            console.warn('[generateScaleNotes] Tune or scale not available');
            return [];
        }

        try {
            const notes: string[] = [];
            const stepsPerOctave = tune.scale.length;
            const keyOffset = getKeyOffset(key);

            // Generate all scale notes across the octave range
            for (let octave = octaveMin; octave <= octaveMax; octave++) {
                for (let degree = 0; degree < stepsPerOctave; degree++) {
                    try {
                        // Get frequency from Tune
                        (tune as any).mode.output = 'frequency';
                        const freq = Number(tune.note(degree, octave));

                        if (Number.isFinite(freq)) {
                            // For 12-TET, generate note name in "C-4" format to match notesOptions
                            if (stepsPerOctave === 12) {
                                // Calculate MIDI note number
                                const midiNote = 60 + (octave - 4) * 12 + degree + keyOffset;
                                const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
                                const noteName = noteNames[midiNote % 12];
                                const noteOctave = Math.floor(midiNote / 12) - 1;
                                // Format as "C-4" to match notesOptions
                                const formatted = `${noteName}-${noteOctave}`;
                                notes.push(formatted);
                            } else {
                                // For microtonal scales, use degree/octave format
                                notes.push(`${degree}/${stepsPerOctave}@${octave}`);
                            }
                        }
                    } catch (e) {
                        console.warn('[generateScaleNotes] Error generating note for degree', degree, 'octave', octave, e);
                    }
                }
            }

            return notes;
        } catch (e) {
            console.error('[generateScaleNotes] Error:', e);
            return [];
        }
    };

    // Handler: Assign chord to current cell
    const handleAssignChordToCell = () => {
        const selections = mingusSelectionsRef.current;
        if (!selections || !selections.key || !selections.chord) {
            console.warn('[BeatGridPanel] No chord selected');
            return;
        }

        const chordNotes = generateChordNotes(
            selections.key,
            selections.chord.value,
            Number(selections.octaveMin || 4)
        );

        console.log('[BeatGridPanel] Generated chord notes:', chordNotes, 'for key', selections.key, 'chord', selections.chord.value);

        if (chordNotes.length > 0) {
            const x = currentXVal.current;
            const y = currentYVal.current;
            console.log('[BeatGridPanel] Assigning chord notes to cell', x, y, 'notes:', chordNotes);
            handleLatestNotes(chordNotes, x, y);
            console.log('[BeatGridPanel] Assigned chord', selections.chord.label, 'to cell', x, y, 'notes:', chordNotes);

            // Force update of notesSelected by bumping grid version
            useBeatGridStore.getState().bumpGridVersion();
        } else {
            console.warn('[BeatGridPanel] No chord notes generated');
        }
    };

    // Handler: Assign scale to multiple cells based on pattern
    const handleAssignScaleToPattern = () => {
        const selections = mingusSelectionsRef.current;
        if (!selections || !selections.key || !selections.scale) {
            console.warn('[BeatGridPanel] No scale selected');
            return;
        }

        // Get pattern divisor from ArpSlider - this determines how many cells per note
        // Pattern values: 0=all in one cell, 1=every cell, 2=every 2nd, 3=every 3rd, 4=every 4th, etc.
        // For sixteenth notes: pattern = 4 means every 4th cell gets a note
        const patternMap: Record<number, number> = {
            0: 0,   // All notes in current cell
            1: 1,   // Every cell (1/1)
            2: 2,   // Every 2nd cell (1/2 = eighth notes)
            3: 4,   // Every 4th cell (1/4 = sixteenth notes)
            4: 8,   // Every 8th cell (1/8 = thirty-second notes)
            6: 16   // Every 16th cell (1/16 = sixty-fourth notes)
        };
        const patternDivisor = patternMap[doAutoAssignPatternNumber] ?? 1;

        const scaleNotes = generateScaleNotes(
            selections.key,
            selections.scale,
            Number(selections.octaveMin || 1),
            Number(selections.octaveMax || 4)
        );

        console.log('[BeatGridPanel] Generated scale notes:', scaleNotes.length, 'notes for key', selections.key, 'scale', selections.scale);

        if (scaleNotes.length === 0) {
            console.warn('[BeatGridPanel] No scale notes generated');
            return;
        }

        // Get grid dimensions
        const nCol = Number(numeratorSignature) * Number(denominatorSignature);
        const currentX = currentXVal.current;
        const currentY = currentYVal.current;

        // Assign scale notes to cells in the pattern
        // If patternDivisor === 0, assign all notes to current cell only
        // Otherwise, assign notes to every Nth cell (like a sixteenth note pattern)
        if (patternDivisor === 0) {
            // Assign all scale notes to current cell
            handleLatestNotes(scaleNotes, currentX, currentY);
            console.log('[BeatGridPanel] Assigned all scale notes to cell', currentX, currentY, 'notes:', scaleNotes.length);
        } else {
            // Assign notes to every Nth cell (pattern-based assignment)
            // Start from current cell and assign to every patternDivisor-th cell
            let noteIndex = 0;
            for (let x = currentX; x < nCol && noteIndex < scaleNotes.length; x += patternDivisor) {
                const note = scaleNotes[noteIndex % scaleNotes.length];
                handleLatestNotes([note], x, currentY);
                noteIndex++;
            }
            console.log('[BeatGridPanel] Assigned scale', selections.scale, 'to pattern starting at', currentX, currentY, 'pattern divisor:', patternDivisor, 'notes assigned:', noteIndex);
            // Force update of notesSelected by bumping grid version
            useBeatGridStore.getState().bumpGridVersion();
        }
    };

    return (
        <Box
            sx={{ top: '36px', textAlign: "center", color: 'rgba(245,245,245,0.78)', zIndex: "1", right: "0", width: "100%" }}
        >
            <Box>
                <Box
                    ref={containerRef}
                    sx={{ top: '0px !important', left: '0px !important', color: 'rgba(245,245,245,0.78)', zIndex: 9001, padding: '8px', width: "100%" }}
                >

                    {width && height && (
                        <Box key={`outerbox__${currentBeatCountToDisplay}_${currentNumerCountColToDisplay}_${currentDenomCount}_${currentPatternCount}`} sx={{ display: "flex", width: '100%', flexDirection: "column", textAlign: "center", justifyContent: "center" }}>


                            {/* Pattern Editor Popup - Only visible when cell is clicked */}
                            {showPatternEditorPopup && (
                                <>

                                    <Box key={`wrapnewvals__${currentBeatCountToDisplay}_${currentNumerCountColToDisplay}_${currentDenomCount}_${currentPatternCount}`} 
                                    sx={{ 
                                        display: "flex", 
                                        flexDirection: "column", 
                                        fontFamily: 'monospace', 
                                        fontWeight: "100", 
                                        textAlign: 'left', 
                                        position: 'relative', 
                                        zIndex: 10000, 
                                        padding: '0px', 
                                        overflow: 'visible',
                                        marginRight: '16px', 
                                    }}>
                                        <Box style={{ 
                                            fontFamily: 'monospace', 
                                            fontWeight: '100', 
                                            color: 'rgba(245,245,245,0.78)', 
                                            paddingLeft: '8px', 
                                            height: '100%', 
                                            background: 'rgba(245,245,245,0.078)', 
                                            display: 'inline-block', 
                                            whiteSpace: 'nowrap', 
                                            //background: 'red',
                                            border: `1px solid rgba(0,0,0,0.78)` }}
                                        >
                                            
                                            <span style={{ marginRight: "12px" }}>Cell: {`${currentXVal.current} | ${currentYVal.current}`}</span>
                                            <Box sx={{ 
                                                display: "inline-flex", 
                                                flexDirection: "row", 
                                                justifyContent: "stretch", 
                                                alignItems: "center", 
                                                paddingTop: "8px", 
                                                padding: "4px", 
                                                // fontSize: '16px', 
                                                borderRadius: '5px', 
                                                blur: "8px", 
                                                maxHeight: "24px" 
                                            }}>
                                                Subdivs: <SubdivisionsPicker 
                                                    xVal={currentXVal.current} 
                                                    yVal={currentYVal.current} 
                                                    masterPatternsHashHook={masterPatternsHashHook} 
                                                    handleChangeCellSubdivisions={handleChangeCellSubdivisions} 
                                                    cellSubdivisions={cellSubdivisions} 
                                                />
                                            </Box>
                                        </Box>
                                        {/* Main Grid SVG - Always visible */}
                                        <Box sx={{ 
                                            display: "flex", 
                                            flexDirection: "column", 
                                            alignItems: "center", 
                                            width: '100%', 
                                            border: '1px solid rgba(0,0,0,0.78)' }}
                                        >
                                            {width && height && boundsWidth && boundsHeight && xScale && yScale && (
                                                <svg
                                                    key={`heatmapSVG_main_${currentBeatCountToDisplay}_${currentNumerCountColToDisplay}`}
                                                    width="100%"
                                                    height="100%"
                                                    viewBox={`0 0 ${widthSvg} ${heightSvg}`}
                                                    preserveAspectRatio="xMidYMid meet"
                                                    style={{ width: '100%', pointerEvents: "auto" }}
                                                >
                                                    <g
                                                        key={`heatmapGelement_main_${currentBeatCountToDisplay}_${currentNumerCountColToDisplay}`}
                                                        width={boundsWidth}
                                                        height={boundsHeight}
                                                        transform={`translate(${[MARGIN.left, MARGIN.top].join(",")})`}
                                                        style={{ pointerEvents: "auto" }}
                                                    >
                                                        {allShapes}
                                                    </g>
                                                </svg>
                                            )}
                                        </Box>
                                        {fxRadioValue && fxRadioValue.toLowerCase().includes("sample") && (
                                            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "top" }}>
                                                <Box sx={{ display: 'inline-flex' }}>
                                                    <Box sx={{ display: "inline-flex", flexDirection: "column", justifyContent: "stretch", alignItems: "left", width: "100%", padding: "16px", height: "fit-content" }}>
                                                        <span style={{ paddingTop: "4px", paddingBottom: "8px" }}>
                                                            {uploadedBlob.current && fxRadioValue.includes("sample") && (
                                                                <FileWindow
                                                                    uploadedBlob={uploadedBlob}
                                                                    getMeydaData={getMeydaData}
                                                                    clickedFile={clickedFile}
                                                                    chuck={chuckRef.current}
                                                                    onBpmDetected={onBpmDetected}
                                                                    autoAnalyze={false}
                                                                />
                                                            )}
                                                        </span>
                                                        <ParameterMultiSelect options={sampleOptions} value={sampleSelected} placeholder="Select samples" onChange={handleSamplesChange} />
                                                    </Box>
                                                </Box>
                                                <Box sx={{ display: "inline-flex", width: '100%', flexDirecton: "row" }}>
                                                    <Box sx={{ width: "58%", margin: "4px", marginLeft: "16px", borderRadius: "5px", justifyContent: "center", alignItems: "center", paddingLeft: "16px", paddingTop: "8px", height: "100%" }}>
                                                        <Box sx={{ padding: "8px" }}>
                                                            <FormLabel sx={{ color: 'rgba(245,245,245,0.78)', fontSize: '11px', marginBottom: '4px' }}>Pattern Cells</FormLabel>
                                                            <Slider
                                                                value={doAutoAssignPatternNumber}
                                                                onChange={(e: Event, val: number | number[]) => {
                                                                    handleAssignPatternNumber({ target: { value: String(val) } } as any);
                                                                }}
                                                                marks={[{ value: 0, label: '0' }, { value: 1, label: '1' }, { value: 2, label: '2' }, { value: 3, label: '4' }, { value: 4, label: '8' }]}
                                                                min={0}
                                                                max={4}
                                                                step={1}
                                                                sx={{ color: NEON_PINK }}
                                                            />
                                                        </Box>
                                                    </Box>
                                                    <Box sx={{ display: "inline-flex", flexDirection: "column", justifyContent: "stretch", alignItems: "right", width: "34%", border: `1px solid ${OBERHEIM_TEAL}`, borderRadius: "5px", height: "100%", p: 1 }}>
                                                        <ParameterSlider label="Velocity" value={0} min={0} max={12} step={0.01} onChange={() => { }} />
                                                    </Box>
                                                </Box>
                                            </Box>
                                        )}



                                        {fxRadioValue && fxRadioValue.toLowerCase().includes("osc") && (




                                            <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center", height: "100% !important" }}>
                                                <Box sx={{ display: "inline-flex", flexDirection: "column", justifyContent: "stretch", alignItems: "left", width: "100%" }}>
                                                    {/* <NoteBuilderToggle noteBuilderFocus={noteBuilderFocus} handleNoteBuilderToggle={handleNoteBuilder} /> */}
                                                    
                                                    {/* Piano/Hex/None Keyboard Mode Buttons - Row underneath NoteBuilderToggle */}
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: '8px', marginBottom: '8px' }}>
                                                        <ButtonGroup sx={{ width: '100%', zIndex: 9999 }} size="small" color="primary" variant="outlined">
                                                            <Button 
                                                                sx={{ zIndex: 99999, pointerEvents: 'auto', cursor: 'pointer', flex: 1 }} 
                                                                onClick={() => setKeyboardMode('piano')} 
                                                                variant={keyboardMode === 'piano' ? 'contained' : 'outlined'}
                                                            >
                                                                Piano
                                                            </Button>
                                                            <Button 
                                                                sx={{ zIndex: 99999, pointerEvents: 'auto', cursor: 'pointer', flex: 1 }} 
                                                                onClick={() => setKeyboardMode('hex')} 
                                                                variant={keyboardMode === 'hex' ? 'contained' : 'outlined'}
                                                            >
                                                                Hex
                                                            </Button>
                                                            <Button 
                                                                sx={{ zIndex: 99999, pointerEvents: 'auto', cursor: 'pointer', flex: 1 }} 
                                                                onClick={() => setKeyboardMode('none')} 
                                                                variant={keyboardMode === 'none' ? 'contained' : 'outlined'}
                                                            >
                                                                None
                                                            </Button>
                                                        </ButtonGroup>
                                                    </Box>
                                                    
                                                    <Box sx={{ 
                                                        display: "flex", 
                                                        flexDirection: "column",
                                                        gap: 1 
                                                    }}>
                                                        <Box sx={{
                                                            display: 'block', 
                                                            flexDirection: 'column', 
                                                            gap: '8px', 
                                                            height: '100%', 
                                                            position: 'relative', 
                                                            zIndex: 9999,
                                                            justifyContent: 'stretch',
                                                            // padding: '4px',
                                               
                                                            background: "green"
                                                        }}>
                                                            <MicrotonesWrapper 
                                                                tune={tune}
                                                                currentMicroTonalScale={currentMicroTonalScale}
                                                                updateMicroTonalScale={updateMicroTonalScale}
                                                            />
                                                        </Box>
                                                        {/* Consolidated Note Controls: Notes, Velocity, Volume */}
                                                        <Box sx={{ display: "flex", flexDirection: "column", 
                                                            //gap: 2, 
                                                            width: "100%", 
                                                            padding: "0px", 
                                                            // border: `1px solid ${OBERHEIM_TEAL}`, 
                                                            borderRadius: "5px"}}>
                                                                
                                                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                                                {/* <FormLabel sx={{ color: 'rgba(245,245,245,0.78)', fontSize: '12px', fontWeight: 'bold' }}>Note Controls</FormLabel> */}

                                                                {/* Show Sample Input if noteBuilderFocus is "Sample" or "MIDI", otherwise show Notes Selector */}
                                                                {/* {(noteBuilderFocus === 'Sampler' || noteBuilderFocus === 'MIDI') ? ( */}
                                                                    <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 1 }}>
                                                                        <FormControl size="small" sx={{ minWidth: '100%' }} 
                                                                            disabled={
                                                                                // !sampleVoiceEnabled || 
                                                                                uploadedNames.length === 0}
                                                                        style={{ width: '100%' }}
                                                                        >
                                                                            <InputLabel id="sample-file-label" sx={{ color: 'rgba(245,245,245,0.78)' }}>Sample File</InputLabel>
                                                                            <Select
                                                                                labelId="sample-file-label"
                                                                                label="Sample File"
                                                                                value={sampleFileName || ''}
                                                                                onChange={(e) => setSampleFileName(e.target.value || null)}
                                                                                MenuProps={{
                                                                                    sx: {
                                                                                        zIndex: 99999,
                                                                                    },
                                                                                    style: {
                                                                                        zIndex: 99999,
                                                                                    },
                                                                                    PaperProps: {
                                                                                        sx: {
                                                                                            zIndex: 99999,
                                                                                            backgroundColor: 'rgba(28,28,28,0.95)',
                                                                                        },
                                                                                        style: {
                                                                                            zIndex: 99999,
                                                                                        },
                                                                                    },
                                                                                }}
                                                                                sx={{ 
                                                                                    color: 'rgba(245,245,245,0.78)',
                                                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                                                        borderColor: 'rgba(245,245,245,0.3)',
                                                                                    },
                                                                                }}
                                                                            >
                                                                                {allAvailableFiles.length === 0 ? (
                                                                                    <MenuItem sx={{ color: 'rgba(245,245,245,0.78)' }} value="" disabled>No files available</MenuItem>
                                                                                ) : (
                                                                                    allAvailableFiles.map((nm: string, idx: number) => (
                                                                                        <MenuItem sx={{ color: 'rgba(245,245,245,0.78)' }} key={`${nm}_${idx}`} value={nm}>{nm}</MenuItem>
                                                                                    ))
                                                                                )}
                                                                                
                                                                            </Select>
                                                                        </FormControl>
                                                                    </Box>

                                                                        <Box sx={{ width: "100%" }}>
                                                                            <ParameterMultiSelect options={notesOptions} value={notesSelected} placeholder="Select Notes" onChange={handleNotesChange} />
                                                                        </Box>
                                                                    {/* )
                                                                )} */}
                                                            </Box>
                                                            {/* Velocity and Volume Sliders */}
                                                            <Box sx={{ display: "flex", flexDirection: "row", gap: 2, width: "100%" }}>
                                                                <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
                                                                    <ParameterSlider label="Note Velocity" value={noteVelocityValue} min={0} max={1} step={0.01} onChange={handleNoteVelocityUpdateLocal} />
                                                                </Box>
                                                                <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
                                                                    <ParameterSlider label="Volume" value={noteVolumeValue} min={0} max={1} step={0.01} onChange={handleNoteVolumeUpdateLocal} />
                                                                </Box>
                                                            </Box>
                                                            {/* Velocity/Length Sliders (existing) */}
                                                            {cellData.current && Object.values(cellData.current).length > 0 && Object.values(cellData.current[0]).length > 0 && (
                                                                <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
                                                                    <VelocityLengthSliders handleNoteLengthUpdate={handleNoteLengthUpdate} cellData={cellData.current} maxLen={Number(+doAutoAssignPatternNumber) !== 0 ? Number(+doAutoAssignPatternNumber) : 1} chuckIsRunning={isChuckRunning} masterPatterns={masterPatternsHashHook[`${currentYVal.current}`][`${currentXVal.current}`]} />
                                                                </Box>
                                                            )}
                                                        </Box>


                                                        <Box sx={{ width: "100%" }}>
                                                            <MingusPopup
                                                                updateKeyScaleChord={updateKeyScaleChord}
                                                                noteBuilderFocus={noteBuilderFocus}
                                                                selectionsRef={mingusSelectionsRef}
                                                                tune={tune}
                                                                currentMicroTonalScale={currentMicroTonalScale}
                                                                setFxKnobsCount={setFxKnobsCount}
                                                                doUpdateBabylonKey={doUpdateBabylonKey}
                                                                getSTK1Preset={getSTK1Preset}
                                                                updateMicroTonalScale={updateMicroTonalScale}
                                                            />
                                                        </Box>
                                                        {/* Chord/Scale Assignment Buttons */}
                                                        <Box sx={{ display: "flex", flexDirection: "row", width: "100%" }}>
                                                            <button
                                                                onClick={handleAssignChordToCell}
                                                                style={{
                                                                    flex: 1,
                                                                    padding: '8px 12px',
                                                                    background: 'rgba(98, 245, 255, 0.2)',
                                                                    border: `1px solid ${OBERHEIM_TEAL}`,
                                                                    borderRadius: '4px',
                                                                    color: 'rgba(245,245,245,0.78)',
                                                                    cursor: 'pointer',
                                                                    fontSize: '12px',
                                                                    fontWeight: '500',
                                                                }}
                                                            >
                                                                Add Chord to Cell
                                                            </button>
                                                            <button
                                                                onClick={handleAssignScaleToPattern}
                                                                style={{
                                                                    flex: 1,
                                                                    padding: '8px 12px',
                                                                    background: 'rgba(255, 20, 147, 0.2)',
                                                                    border: `1px solid ${NEON_PINK}`,
                                                                    borderRadius: '4px',
                                                                    color: 'rgba(245,245,245,0.78)',
                                                                    cursor: 'pointer',
                                                                    fontSize: '12px',
                                                                    fontWeight: '500',
                                                                }}
                                                            >
                                                                Add Scale to Pattern
                                                            </button>
                                                        </Box>
                                                    </Box>
                                                    <Box sx={{ display: "inline-flex", flexDirecton: "row", width: "100%" }}>

                                                        <Box sx={{ borderRadius: "5px", width: "50%", border: `1px solid ${noteBuilderFocus !== "Chord" ? NEON_PINK : OBERHEIM_TEAL}`, padding: "2px 2px 2px 2px", marginTop: "4px", marginBottom: "4px", marginRight: "4px" }}>
                                                            <Box sx={{ padding: "4px", width: "100%" }}>
                                                                <FormLabel sx={{ color: 'rgba(245,245,245,0.78)', fontSize: '11px', marginBottom: '2px' }}>Pattern</FormLabel>
                                                                <Slider
                                                                    value={doAutoAssignPatternNumber === 0 ? 0 : doAutoAssignPatternNumber === 2 ? 4 : doAutoAssignPatternNumber === 3 ? 8 : doAutoAssignPatternNumber === 4 ? 16 : 4}
                                                                    onChange={(e, val) => {
                                                                        const patternMap: Record<number, number> = { 0: 0, 4: 2, 8: 3, 16: 4 };
                                                                        const mapped = patternMap[val as number] ?? 0;
                                                                        handleAssignPatternNumber({ target: { value: mapped.toString() } } as any);
                                                                    }}
                                                                    marks={[{ value: 0, label: '0' }, { value: 4, label: '1' }, { value: 8, label: '2' }, { value: 16, label: '4' }]}
                                                                    min={0}
                                                                    max={16}
                                                                    step={null}
                                                                    sx={{ color: NEON_PINK }}
                                                                />
                                                            </Box>
                                                        </Box>
                                                        <Box sx={{ border: `1px solid ${noteBuilderFocus !== "Micro" ? HERITAGE_GOLD : OBERHEIM_TEAL}`, borderRadius: "5px", padding: "2px 4px", margin: "4px 0px 4px 0", justifyContent: "right", width: "fit-content", flex: "1 1 auto" }}>
                                                            <GenericRadioButtons label={"ascending"} options={["asc", "desc"]} callback={handleChangeNotesAscending} />
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        )}




                                    </Box>
                                </>
                            )}
                            <Tooltip interactionData={hoveredCell} width={width || 0} height={height || 0} masterPatternsHashHook={masterPatternsHashHook} isInPatternEditMode={isInPatternEditMode} />
                        </Box>
                    )}
                </Box>

                {Object.entries(featuresLegendData).map((f) => (
                    <div key={`${f[0]}`}>{f[0] + f[1]}</div>
                ))}
            </Box>
        </Box>
    )
}
export default BeatGridPanel;