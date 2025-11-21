// import { Box, FormLabel, Slider, useTheme, Autocomplete, TextField } from "@mui/material";
// import React, { useEffect, useMemo, useRef, useState } from "react";
// import * as d3 from "d3";
// import { Tooltip } from "./BeatGridTooltip";
// import SubdivisionsPicker from "./SubdivisionsPicker";
// import { CORDUROY_RUST, HERITAGE_GOLD, OBERHEIM_TEAL, NEON_PINK } from "../../constants";
// // Shared inline controls (MultiSelect/Slider) will replace older inset dropdowns in this file
// import MingusPopup from "./MingusPopup";
// import GenericRadioButtons from "./GenericRadioButtons";
// import NoteBuilderToggle from "./NoteBuilderToggle";
// import VelocityLengthSliders from "./VelocityLengthSliders";
// import StepRadioButtons from "./StepRadioButton";
// import FileWindow from "../OldParentMonolith/OldFileWindow";
// import { valuetext } from "../../utils/knobsHelper";
// import { Tune } from "../../tune";

// type QuickDashProps = {
//     isChuckRunning: boolean;
//     featuresLegendData: any[];
//     universalSources: any;
//     handleSourceToggle: (name: string, val: any) => void;
//     vizSource: string;
//     // currentNumerCount: any;
//     currentBeatSynthCount: any;
//     handleOsc1RateUpdate: any;
//     // handleOsc2RateUpdate: any;
//     handleMasterFastestRate: any;
//     handleStkRateUpdate: any;
//     handleSamplerRateUpdate: any;
//     handleAudioInRateUpdate: any;
//     currentNoteVals: any;
//     filesToProcess: any;
//     numeratorSignature: any;
//     denominatorSignature: any;
//     editPattern: any;
//     masterPatternsHashHook: any;
//     masterPatternsHashHookUpdated: any;
//     inPatternEditMode: any;
//     selectFileForAssignment: any;
//     handleChangeCellSubdivisions: any;
//     cellSubdivisions: any;
//     resetCellSubdivisionsCounter: any;
//     handleClickUploadedFiles: any;
//     parentDiv: any;
//     masterFastestRate: number;

//     currentBeatCountToDisplay: number;
//     currentNumerCountColToDisplay: number;
//     currentDenomCount: number;
//     currentPatternCount: number;

//     clickHeatmapCell: any;

//     exitEditMode: () => void;
//     isInPatternEditMode: boolean;

//     handleLatestSamples: (  
//         fileNames: string[],
//         xVal: number,
//         yVal: number,
//     ) => void;
//     handleLatestNotes: (  
//         notes: string[],
//         xVal: number,
//         yVal: number,
//     ) => void;

//     mTFreqs:number[];
//     mTMidiNums:number[];
//     updateKeyScaleChord: (a:any, b:any, c: any, d: any, e: any, f: any, g: any) => void;
//     handleAssignPatternNumber: (e: any) => void;
//     doAutoAssignPatternNumber: number;
//     setStkValues: React.Dispatch<React.SetStateAction<any>>; 
//     tune: Tune;
//     currentMicroTonalScale: (scale: any) => void;
//     setFxKnobsCount: React.Dispatch<React.SetStateAction<number>>;
//     doUpdateBabylonKey: any;
//     babylonKey: string;
//     currentScreen: React.MutableRefObject<string>;
//     currentFX: React.MutableRefObject<any>;
//     currentStkTypeVar: React.MutableRefObject<string>;
//     updateCurrentFXScreen: any;
//     getSTK1Preset: (x: string) => any; 
//     universalSourcesRef: React.MutableRefObject<any>;
//     updateMicroTonalScale: (scale: any) => void;
//     mingusKeyboardData: any;
//     mingusChordsData: any;
//     updateMingusData: (data: any) => void;
//     handleChangeNotesAscending: (order: string) => void;
//     mTNames: string[];
//     fxRadioValue: string;
//     noteBuilderFocus: string;
//     handleNoteBuilder: (focus: string) => void;
//     handleNoteLengthUpdate: (e: any, cellData: any, newValue: any) => void;
//     handleNoteVelocityUpdate: (e: any, cellData: any) => void;
//     currentSelectedCell: { x: number; y: number };
//     octaveMax: number;
//     octaveMin: number;
//     uploadedBlob: React.MutableRefObject<any>;
//     getMeydaData: (fileData: ArrayBuffer) => Promise<any>;
//     clickedFile: React.MutableRefObject<string | null>;
//     chuckRef: React.MutableRefObject<any>;
//     onBpmDetected: (bpm: number | null) => void;
// }

// const NotesQuickDash = (props:QuickDashProps) => {
//     // const theme = useTheme();
//     const {
//         isChuckRunning,
//         featuresLegendData, 
//         vizSource,
//         currentBeatSynthCount,
//         handleOsc1RateUpdate,
//         handleMasterFastestRate,
//         handleStkRateUpdate,
//         handleSamplerRateUpdate,
//         handleAudioInRateUpdate,
//         currentNoteVals,
//         filesToProcess,
//         numeratorSignature,
//         denominatorSignature,
//         editPattern,
//         masterPatternsHashHook,
//         masterPatternsHashHookUpdated,
//         inPatternEditMode,
//         selectFileForAssignment,
//         handleChangeCellSubdivisions,
//         cellSubdivisions,
//         resetCellSubdivisionsCounter,
//         handleClickUploadedFiles,
//         parentDiv,
//         currentBeatCountToDisplay,
//         currentNumerCountColToDisplay,
//         currentDenomCount,
//         currentPatternCount,
//         masterFastestRate,
//         exitEditMode,
//         isInPatternEditMode,
//         clickHeatmapCell,
//         handleLatestSamples,
//         handleLatestNotes,
//         mTFreqs,
//         mTMidiNums,
//         updateKeyScaleChord,
//         handleAssignPatternNumber,
//         doAutoAssignPatternNumber,
//         setStkValues,
//         tune,
//         currentMicroTonalScale,
//         setFxKnobsCount,
//         doUpdateBabylonKey,
//         babylonKey,
//         currentScreen,
//         currentFX,
//         currentStkTypeVar,
//         updateCurrentFXScreen,
//         getSTK1Preset,
//         universalSources,    
//         updateMicroTonalScale,
//         mingusKeyboardData,
//         mingusChordsData,
//         updateMingusData,
//         handleChangeNotesAscending,
//         mTNames,
//         fxRadioValue,
//         noteBuilderFocus,
//         handleNoteBuilder,
//         handleNoteLengthUpdate,
//         handleNoteVelocityUpdate,
//         currentSelectedCell,
//         octaveMax,
//         octaveMin,
//         uploadedBlob,
//         getMeydaData,
//         clickedFile,
//         chuckRef,
//         onBpmDetected
//     } = props;
//     const [updateCellColorBool, setUpdateCellColorBool] = useState<boolean>(false);
//     const [width, setWidth] = useState<number | undefined>(undefined);
//     const [height, setHeight] = useState<number | undefined>(undefined);
//     const theme = useTheme();

//     const updateCellColor = (msg: any) => {
//         console.log("UPDATE CELL COLOR: ", msg);
//         setUpdateCellColorBool(msg);
//     }

//     const parentDivRef = useRef<any>(null);

//     useEffect(() => {
//         let mounted = true;
//         try {
//             if (parentDiv && parentDiv.getBoundingClientRect()) {
//                 setWidth(parentDiv.getBoundingClientRect().width);
//                 setHeight(parentDiv.getBoundingClientRect().height);
//             }
//         } catch (error) {
//             console.error("Error getting parent div dimensions: ", error);
//         }
//         return () => {
//             mounted = false;
//         }
//     }, [parentDiv]);

//     // ---- Flattened Heatmap logic below ----
//     type InteractionData = { xLabel: string; yLabel: string; xPos: number; yPos: number; value: number; instrument: string; };
//     const [hoveredCell, setHoveredCell] = useState<InteractionData | null>(null);
//     const [doRebuildHeatmap, setDoRebuildHeatmap] = useState<boolean>(false);
//     useEffect(() => { setDoRebuildHeatmap(true); }, [doRebuildHeatmap]);

//     type HeatmapData = { x: string; y: string; value: number }[];
//     const nCol = Number(numeratorSignature) * Number(denominatorSignature);
//     const nRow = Number(denominatorSignature);
//     const xLabels = Array.from({ length: nCol }, (_, i) => i);
//     const yLabels = Array.from({ length: nRow }, (_, i) => i + 1);
//     const heatmapData: HeatmapData = [];
//     for (let x of xLabels) { for (let y of yLabels) { heatmapData.push({ x: x.toString(), y: y.toString(), value: x }); } }

//     const rebuildHeatmap = () => setDoRebuildHeatmap(true);

//     const MARGIN = { top: 10, right: 30, bottom: 30, left: 30 };
//     type CellData = { note: number[] | any, notesHz: number[] | any, velocity: number[] | any, subdivisions: number; length: number[] | any; on: boolean; xVal?: number | null; yVal?: number | null; zVal?: number | null; };

//     const [showPatternEditorPopup, setShowPatternEditorPopup] = useState<boolean>(false);
//     const [noteVelocityValue, setNoteVelocityValue] = useState<number>(0.5);
//     const currentXVal = useRef<number>(0);
//     const currentYVal = useRef<number>(0);
//     const cellData = useRef<CellData[]>(null);
//     const [instrument, setInstrument] = useState<string>("");
//     const widthSvg = 540;
//     const heightSvg = 200;
//     const [boundsWidth, setBoundsWidth] = useState<number>(widthSvg - MARGIN.right - MARGIN.left || 0);
//     const [boundsHeight, setBoundsHeight] = useState<number>(heightSvg - MARGIN.top - MARGIN.bottom || 0);
//     useEffect(() => {
//         if (widthSvg > 0 && heightSvg > 0) {
//             widthSvg !== boundsWidth && setBoundsWidth(widthSvg - MARGIN.right - MARGIN.left);
//             heightSvg !== boundsHeight && setBoundsHeight(heightSvg - MARGIN.top - MARGIN.bottom);
//         }
//     }, [boundsHeight, boundsWidth]);

//     const xScale = useMemo(() => d3.scaleBand().domain(xLabels.map((d: any) => d.toString())).range([0, boundsWidth]).padding(0.01), [xLabels, boundsWidth]);
//     const yScale = useMemo(() => d3.scaleBand().domain(yLabels.map((d: any) => d.toString())).range([boundsHeight, 0]).padding(0.01), [yLabels, boundsHeight]);
//     const handleNoteVelocityUpdateLocal = (e: any, newValue: number | number[]) => { setNoteVelocityValue(newValue as number); handleNoteVelocityUpdate(e, cellData); };
//     const didSetupHeatmap = useRef<boolean>(false);
//     const getInstrumentName = (yVal: number) => { switch (yVal) { case 0: return setInstrument("Sample 1"); case 1: return setInstrument("Sample 1"); case 2: return setInstrument("Sample 2"); case 3: return setInstrument("Sample 3"); case 4: return setInstrument("Sample 4"); case 5: return setInstrument("Osc 1"); case 6: return setInstrument("Osc 2"); case 7: return setInstrument("STK"); } };
//     const triggerEditPattern = async (e: any, num: any) => {
//         const string: any = e && Object.values(e.target)[1] || null;
//         const isFill = e && string && string.id && string.id.includes("fill");
//         const vals = !e || (string.length < 1) || (string && !string.id) ? ["1", "1"] : !isFill ? string.id.split("_") : string.id.replace("fill_", "").split("_");
//         const xVal = Number(num);
//         const yVal = Number(vals[1]) || 1;
//         clickHeatmapCell(xVal, yVal);
//         const zVal = vals[2] || null;
//         xVal && yVal && resetCellSubdivisionsCounter(xVal, yVal);
//         currentXVal.current = Number(xVal);
//         currentYVal.current = Number(yVal);
//         cellData.current = { xVal: Number(xVal), yVal: Number(yVal), zVal: zVal, ...masterPatternsHashHook[`${Number(yVal)}`][`${Number(xVal)}`] } as any;
//         yVal && getInstrumentName(yVal);
//         setShowPatternEditorPopup(true);
//         const elToChange: any = document.getElementById(`fill_${xVal}_${yVal}`);
//         if (elToChange && elToChange !== null && elToChange.style.fill !== "black") { elToChange.style.fill = "black"; } else if (elToChange) { elToChange.style.fill = CORDUROY_RUST; }
//     };
//     useEffect(() => { if (!currentXVal.current && !didSetupHeatmap.current) { triggerEditPattern(null, 0); didSetupHeatmap.current = true; } }, []);
//     const allShapes = heatmapData.map((d) => {
//         const x = xScale(d.x); const y = yScale(d.y); if (d.value === null || !x || !y) { return null; }
//         const patOptions = [0, 2, 4, 8, 16];
//         return (
//             <React.Fragment key={`rectFillsWrapper_${d.x}_${d.y}`}>
//                 {masterPatternsHashHook && masterPatternsHashHook[`${d.y}`] && masterPatternsHashHook[`${d.y}`][`${d.x}`] &&
//                     Array.from({ length: masterPatternsHashHook[`${d.y}`][`${d.x}`].subdivisions }).map((_, idx) => (
//                         <React.Fragment key={`overlay_note_${idx}_${d.x}_${d.y}`}>
//                             <rect
//                                 width={xScale.bandwidth() / (masterPatternsHashHook[`${d.y}`][d.x].subdivisions * (1 / (masterPatternsHashHook[`${d.y}`][d.x].length)))}
//                                 height={yScale.bandwidth() / 2.5}
//                                 key={`main_cell_noteEl_${d.x}_${d.y}`}
//                                 r={4}
//                                 opacity={masterPatternsHashHook[`${d.y}`][`${d.x}`].velocity}
//                                 fill={masterPatternsHashHook[`${d.y}`][`${d.x}`].noteName?.join().length > 0 ? HERITAGE_GOLD : "transparent"}
//                                 id={`fill_noteEl_${d.x}_${d.y}`}
//                                 x={(xScale(d.x)! + (xScale.bandwidth() * idx) / masterPatternsHashHook[d.y][d.x].subdivisions)}
//                                 y={yScale(d.y)}
//                             />
//                             <rect
//                                 width={(xScale.bandwidth() / masterPatternsHashHook[Number(d.y) - 1][d.x].subdivisions) * (masterPatternsHashHook[Number(d.y) - 1][d.x].length * currentNumerCountColToDisplay)}
//                                 height={yScale.bandwidth() / 2.5}
//                                 key={`main_cell_sampleEl_${d.x}_${d.y}`}
//                                 r={4}
//                                 opacity={masterPatternsHashHook[`${Number(d.y) - 1}`][`${d.x}`].velocity * 2}
//                                 fill={masterPatternsHashHook[`${Number(d.y) - 1}`][`${d.x}`].fileNums.join().length > 0 ? OBERHEIM_TEAL : "transparent"}
//                                 id={`fill_sampleEl_${d.x}_${d.y}`}
//                                 x={(xScale(d.x)! + (xScale.bandwidth() * idx) / masterPatternsHashHook[`${Number(d.y) - 1}`][d.x].subdivisions)}
//                                 y={(yScale(d.y) || 0) + yScale.bandwidth() / 3}
//                                 style={{ background: OBERHEIM_TEAL, zIndex: 9999, width: `${(xScale.bandwidth() / masterPatternsHashHook[d.y][d.x].subdivisions)}px` }}
//                             />
//                             {masterPatternsHashHook[`${d.y}`][`${d.x}`].noteName?.join().length > 0 && (
//                                 <text x={x! + 2} y={y! + 10 + idx * 10} key={`${masterPatternsHashHook[`${d.y}`][`${d.x}`].noteName}_text1_${d.x}_${d.y}`} fontSize={8} fill={'white'}>
//                                     {masterPatternsHashHook[`${d.y}`][`${d.x}`].noteName}
//                                 </text>
//                             )}
//                             {masterPatternsHashHook[`${Number(d.y) - 1}`][`${d.x}`].fileNums?.join().length > 0 && (
//                                 <text x={x! + 2} y={y! + 10 + idx * 10 + yScale.bandwidth() / 3} key={`${masterPatternsHashHook[`${d.y}`][`${d.x}`].noteName}_text2_${d.x}_${d.y}`} fontSize={8} fill={'white'}>
//                                     {1 / masterPatternsHashHook[`${Number(d.y)}`][`${d.x}`].length}
//                                 </text>
//                             )}
//                             <rect
//                                 key={`main_cell_${d.x}_${d.y}`}
//                                 r={4}
//                                 id={`fill_${d.x}_${d.y}`}
//                                 x={(xScale(d.x)! + (xScale.bandwidth() * idx) / masterPatternsHashHook[d.y][d.x].subdivisions)}
//                                 y={yScale(d.y)}
//                                 width={(xScale.bandwidth() / masterPatternsHashHook[d.y][d.x].subdivisions)}
//                                 height={yScale.bandwidth()}
//                                 opacity={
//                                     (patOptions[doAutoAssignPatternNumber] > 0 && ((16 * (Number(d.y) - 1) + Number(d.x)) - (16 * currentSelectedCell.y + currentSelectedCell.x)) % (16 / patOptions[doAutoAssignPatternNumber]) === 0) ||
//                                     (patOptions[doAutoAssignPatternNumber] === 0 && currentSelectedCell.x === Number(d.x) && currentSelectedCell.y === Number(d.y)) ||
//                                     currentBeatCountToDisplay === Number(d.x) && currentNumerCountColToDisplay === Number(d.y)
//                                         ? 0.8 : 0.5
//                                 }
//                                 fill={
//                                     currentBeatCountToDisplay === Number(d.x) && currentNumerCountColToDisplay === Number(d.y) ||
//                                     currentSelectedCell.x === Number(d.x) && currentSelectedCell.y === Number(d.y)
//                                         ? NEON_PINK
//                                         : currentBeatCountToDisplay === Number(d.x)
//                                             ? CORDUROY_RUST
//                                             : (Number(d.y) > 0) ? OBERHEIM_TEAL : NEON_PINK
//                                 }
//                                 stroke={'rgba(245,245,245,0.78)'}
//                                 onClick={(e: any) => triggerEditPattern(e, d.x)}
//                                 onMouseEnter={() => { setHoveredCell({ xLabel: d.x, yLabel: d.y, xPos: x, yPos: y, value: Math.round(d.value * 100) / 100, instrument: d.y && getInstrumentName(parseInt(d.y)) || "None" }); }}
//                                 onMouseLeave={() => setHoveredCell(null)}
//                                 cursor="pointer"
//                                 style={{ zIndex: 1, pointerEvents: "auto" }}
//                             >
//                                 <text>{d.x} {d.y}</text>
//                             </rect>
//                         </React.Fragment>
//                     ))}
//             </React.Fragment>
//         );
//     });

//     // ---- Inline shared controls ----
//     type Option = { value: string; label: string };

//     const ParameterMultiSelect: React.FC<{
//         options: Option[];
//         value: Option[];
//         placeholder?: string;
//         onChange: (value: Option[]) => void;
//     }> = ({ options, value, placeholder = "Select...", onChange }) => (
//         <Autocomplete
//             multiple
//             disableCloseOnSelect
//             options={options}
//             value={value}
//             onChange={(_e, v) => onChange(v as Option[])}
//             getOptionLabel={(opt) => opt.label}
//             isOptionEqualToValue={(opt, val) => opt.value === val.value}
//             renderInput={(params) => (
//                 <TextField {...params} variant="outlined" size="small" placeholder={placeholder} />
//             )}
//         />
//     );

//     const ParameterSlider: React.FC<{
//         label?: string;
//         value: number;
//         min: number;
//         max: number;
//         step?: number;
//         onChange: (e: any, v: number) => void;
//     }> = ({ label, value, min, max, step = 0.01, onChange }) => (
//         <Box sx={{ width: "100%" }}>
//             {label && (
//                 <FormLabel sx={{ color: 'rgba(245,245,245,0.78)', fontSize: '11px', mb: 0.5 }}>
//                     {label}
//                 </FormLabel>
//             )}
//             <Slider
//                 value={value}
//                 min={min}
//                 max={max}
//                 step={step}
//                 valueLabelDisplay="auto"
//                 onChange={onChange}
//                 sx={{ width: "80%", color: 'rgba(245,245,245,0.78)', backgroundColor: 'rgba(28,28,28,0.78)' }}
//             />
//         </Box>
//     );

//     // Build options and preselected values for Samples
//     const sampleOptions: Option[] = useMemo(() => {
//         const names = Array.from(new Set<string>((filesToProcess || []).map((f: any) => String(f.filename)))) as string[];
//         return names.map((name) => ({ value: name, label: name }));
//     }, [filesToProcess]);

//     const sampleSelected: Option[] = useMemo(() => {
//         const cell = masterPatternsHashHook?.[`${currentYVal.current}`]?.[`${currentXVal.current}`];
//         const idxs = cell?.fileNums ? Array.from(cell.fileNums) : [];
//         return (idxs as number[]).map((i) => sampleOptions[i]).filter(Boolean);
//     }, [masterPatternsHashHook, currentXVal.current, currentYVal.current, sampleOptions]);

//     const handleSamplesChange = (vals: Option[]) => {
//         handleLatestSamples(vals.map((o) => o.value), currentXVal.current, currentYVal.current - 1);
//     };

//     // Build options and preselected values for Notes
//     const notesOptions: Option[] = useMemo(() => {
//         const minOct = Number(octaveMin);
//         const maxOct = Number(octaveMax);
//         const out: Option[] = [];
//         for (let o = minOct; o <= maxOct; o++) {
//             for (const n of mTNames) {
//                 const v = `${n}-${o}`;
//                 out.push({ value: v, label: v });
//             }
//         }
//         return out;
//     }, [mTNames, octaveMin, octaveMax]);

//     const notesSelected: Option[] = useMemo(() => {
//         const cell = masterPatternsHashHook?.[`${currentYVal.current}`]?.[`${currentXVal.current}`];
//         const names = cell?.noteName ? Array.from(cell.noteName).filter(Boolean) : [];
//         return (names as string[]).map((name) => notesOptions.find((o) => o.value === String(name))!).filter(Boolean) as Option[];
//     }, [masterPatternsHashHook, currentXVal.current, currentYVal.current, notesOptions]);

//     const handleNotesChange = (vals: Option[]) => {
//         handleLatestNotes(vals.map((o) => o.value), currentXVal.current, currentYVal.current);
//     };

//     return (
//         <Box 
//             sx={{
//                 top: '36px',
//                 textAlign: "center",
//                 color: 'rgba(245,245,245,0.78)',
//                 zIndex: "1",
//                 right: "0",
//                 width: "100%",
//             }}
//         >
//             <Box>
//                 <Box sx={{
//                     top: '0px !important',
//                     left: '0px !important',
//                     color: 'rgba(245,245,245,0.78)',
//                     zIndex: 9001,
//                     width: "-webkit-fill-available",

//                 }}>
//                     <div
//                         style={{
//                             width: "fit-content",
//                             maxWidth: "100%",
//                             overflowX: "auto"
//                         }}
//                     >
//                     </div>

//                     {width && height && (
//                         <Box
//                             key={`outerbox__${currentBeatCountToDisplay}_${currentNumerCountColToDisplay}_${currentDenomCount}_${currentPatternCount}`}
//                             sx={{ display: "flex", width: '100%', flexDirection: "column", textAlign: "center", justifyContent: "center" }}
//                         >
//                             {showPatternEditorPopup && (
//                                 <>
//                                     <Box>
//                                         {mingusKeyboardData && mingusKeyboardData.length > 0 && mingusKeyboardData.data[0].toString()}
//                                         {mingusKeyboardData && mingusKeyboardData.length > 0 && mingusKeyboardData.data[2].toString()}
//                                     </Box>
//                                     <Box key={`wrapnewvals__${currentBeatCountToDisplay}_${currentNumerCountColToDisplay}_${currentDenomCount}_${currentPatternCount}`} sx={{ display: "flex", flexDirection: "column", fontFamily: 'monospace', fontWeight: "100", textAlign: 'left', padding: "8px" }}>
//                                         <Box style={{ fontFamily: 'monospace', fontWeight: '100', color: 'rgba(245,245,245,0.78)', paddingLeft: '8px', width: '100%', height: '100%', background: 'rgba(245,245,245,0.078)', display: 'inline-block', whiteSpace: 'nowrap', border: `1px solid rgba(0,0,0,0.78)` }}>
//                                             <span style={{ marginRight: "12px" }}>Cell: {`${currentXVal.current} | ${currentYVal.current}`}</span>
//                                             <Box sx={{ display: "inline-flex", flexDirection: "row", justifyContent: "stretch", alignItems: "center", paddingTop: "8px", fontSize: '16px', borderRadius: '5px', blur: "8px" }}>
//                                                 Subdivs: <SubdivisionsPicker xVal={currentXVal.current} yVal={currentYVal.current} masterPatternsHashHook={masterPatternsHashHook} handleChangeCellSubdivisions={handleChangeCellSubdivisions} cellSubdivisions={cellSubdivisions} />
//                                             </Box>
//                                         </Box>
//                                         <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", maxHeight: "180px", border: '1px solid rgba(0,0,0,0.78)' }}>
//                                             {widthSvg && heightSvg && boundsWidth && boundsHeight && (
//                                                 <svg key={`heatmapSVG_${currentXVal.current}_${currentYVal.current}`} width={widthSvg} height={heightSvg} style={{ pointerEvents: "none" }}>
//                                                     <g key={`heatmapGelement_${currentXVal.current}_${currentYVal.current}`} width={boundsWidth} height={boundsHeight} transform={`translate(${[MARGIN.left, MARGIN.top].join(",")})`} style={{ pointerEvents: "none" }}>
//                                                         {allShapes}
//                                                     </g>
//                                                 </svg>
//                                             )}
//                                         </Box>
//                                         {fxRadioValue && fxRadioValue.toLowerCase().includes("sample") && (
//                                             <Box sx={{ display: "flex", flexDirection: "column", alignItems: "top" }}>
//                                                 <Box sx={{ display: 'inline-flex' }}>
//                                                     <Box sx={{ display: "inline-flex", flexDirection: "column", justifyContent: "stretch", alignItems: "left", width: "100%", padding: "16px", height: "fit-content" }}>
//                                                         <span style={{ paddingTop: "4px", paddingBottom: "8px" }}>
//                                                             {uploadedBlob.current && fxRadioValue.includes("sample") && (
//                                                                 <FileWindow 
//                                                                     uploadedBlob={uploadedBlob} 
//                                                                     getMeydaData={getMeydaData} 
//                                                                     clickedFile={clickedFile} 
//                                                                     chuck={chuckRef.current} 
//                                                                     onBpmDetected={onBpmDetected}
//                                                                     autoAnalyze={false}
//                                                                 />
//                                                             )}
//                                                         </span>
//                                                         <ParameterMultiSelect
//                                                             options={sampleOptions}
//                                                             value={sampleSelected}
//                                                             placeholder="Select samples"
//                                                             onChange={handleSamplesChange}
//                                                         />
//                                                     </Box>
//                                                 </Box>
//                                                 <Box sx={{ display: "inline-flex", width: '100%', flexDirecton: "row" }}>
//                                                     <Box sx={{ width: "58%", margin: "4px", marginLeft: "16px", border: `1px solid ${NEON_PINK}`, borderRadius: "5px", justifyContent: "center", alignItems: "center", paddingLeft: "16px", paddingTop: "8px", height: "100%" }}>
//                                                         <StepRadioButtons doAutoAssignPatternNumber={doAutoAssignPatternNumber} handleAssignPatternNumber={handleAssignPatternNumber} />
//                                                     </Box>
//                                                     <Box sx={{ display: "inline-flex", flexDirection: "column", justifyContent: "stretch", alignItems: "right", width: "34%", border: `1px solid ${OBERHEIM_TEAL}`, borderRadius: "5px", margin: "4px", height: "100%", p: 1 }}>
//                                                         <ParameterSlider label="Velocity" value={0} min={0} max={12} step={0.01} onChange={() => {}} />
//                                                     </Box>
//                                                 </Box>
//                                             </Box>
//                                         )}
//                                         {fxRadioValue && fxRadioValue.toLowerCase().includes("osc") && (
//                                             <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center", height: "100% !important" }}>
//                                                 <Box sx={{ display: "inline-flex", flexDirection: "column", justifyContent: "stretch", alignItems: "left", width: "100%" }}>
//                                                     <NoteBuilderToggle noteBuilderFocus={noteBuilderFocus} handleNoteBuilderToggle={handleNoteBuilder} />
//                                                     <Box sx={{ width: "100%", height: "82px", display: "flex", flexDirection: "row", gap: 0.5, justifyContent: "space-between", alignItems: "top" }}>
//                                                         {masterPatternsHashHook && masterPatternsHashHook[`${currentYVal.current}`] && masterPatternsHashHook[`${currentYVal.current}`][`${currentXVal.current}`] && (
//                                                             <Box sx={{ padding: "2px 8px 2px 8px", borderRadius: "5px", width: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center", height: "100%", minWidth: "50%", border: `1px solid ${noteBuilderFocus !== "MIDI" ? CORDUROY_RUST : OBERHEIM_TEAL}` }} key={`notesDropdown_${mTFreqs}`}>
//                                                                 {!isChuckRunning ? (
//                                                                     <ParameterMultiSelect
//                                                                         options={notesOptions}
//                                                                         value={notesSelected}
//                                                                         placeholder="Select noteszzz"
//                                                                         onChange={handleNotesChange}
//                                                                     />
//                                                                 ) : (
//                                                                     <Box sx={{ height: "100%" }} />
//                                                                 )}
//                                                             </Box>
//                                                         )}
//                                                         {/* <Box sx={{ width: "50%" }}>
//                                                             <MingusPopup updateKeyScaleChord={updateKeyScaleChord} noteBuilderFocus={noteBuilderFocus} tune={tune} currentMicroTonalScale={currentMicroTonalScale} setFxKnobsCount={setFxKnobsCount} doUpdateBabylonKey={doUpdateBabylonKey} getSTK1Preset={getSTK1Preset} updateMicroTonalScale={updateMicroTonalScale} />
//                                                         </Box> */}
//                                                     </Box>
//                                                     <Box sx={{ display: "inline-flex", flexDirecton: "row", width: "100%" }}>
//                                                         <Box sx={{ borderRadius: "5px", border: `1px solid ${noteBuilderFocus !== "Chord" ? NEON_PINK : OBERHEIM_TEAL}`, padding: "2px 2px 2px 2px", marginTop: "4px", marginBottom: "4px", marginRight: "4px" }}>
//                                                             <StepRadioButtons doAutoAssignPatternNumber={doAutoAssignPatternNumber} handleAssignPatternNumber={handleAssignPatternNumber} />
//                                                         </Box>
//                                                         <Box sx={{ border: `1px solid ${noteBuilderFocus !== "Micro" ? HERITAGE_GOLD : OBERHEIM_TEAL}`, borderRadius: "5px", padding: "2px 4px", margin: "4px 0px 4px 0", justifyContent: "right", width: "fit-content", flex: "1 1 auto" }}>
//                                                             <GenericRadioButtons label={"ascending"} options={["asc", "desc"]} callback={handleChangeNotesAscending} />
//                                                         </Box>
//                                                     </Box>
//                                                     <Box sx={{ display: "inline-flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", maxWidth: "100%", width: "100%", whiteSpace: "nowrap" }}>
//                                                         <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: "50%", justifyContent: "space-between", borderRadius: "5px", border: `1px solid ${OBERHEIM_TEAL}`, height: "100%", padding: "12px", marginRight: "4px" }}>
//                                                             <ParameterSlider label="Note Velocity" value={noteVelocityValue} min={0} max={1} step={0.01} onChange={handleNoteVelocityUpdateLocal} />
//                                                         </Box>
//                                                         <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", justifyContent: "space-between", borderRadius: "5px", border: `1px solid ${CORDUROY_RUST}`, padding: "0 16px 0 16px" }}>
//                                                             <VelocityLengthSliders handleNoteLengthUpdate={handleNoteLengthUpdate} cellData={cellData.current} maxLen={Number(+doAutoAssignPatternNumber) !== 0 ? Number(+doAutoAssignPatternNumber) : 1} chuckIsRunning={isChuckRunning} masterPatterns={masterPatternsHashHook[`${currentYVal.current}`][`${currentXVal.current}`]} />
//                                                         </Box>
//                                                     </Box>
//                                                 </Box>
//                                             </Box>
//                                         )}
//                                     </Box>
//                                     <Tooltip interactionData={hoveredCell} width={width || 0} height={height || 0} masterPatternsHashHook={masterPatternsHashHook} isInPatternEditMode={isInPatternEditMode} />
//                                 </>
//                             )}
//                         </Box>
//                     )}
//                 </Box>

//                 {Object.entries(featuresLegendData).map((f) => (
//                     <div key={`${f[0]}`}>{f[0] + f[1]}</div>
//                 ))}
//             </Box>
//         </Box>
//     )
// }
// export default NotesQuickDash;