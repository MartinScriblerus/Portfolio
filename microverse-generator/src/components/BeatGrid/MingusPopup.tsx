import { CORDUROY_RUST, OBERHEIM_TEAL, NEON_PINK, SLATE_GRAY, HERITAGE_GOLD } from '../../constants';
import { Box, FormControl, FormLabel, Input } from '@mui/material';
import React, { Dispatch, useEffect } from 'react';
// import dMicrotones from '../MicrotonesWrapper';
import { Tune } from '../../tune';

export interface MingusSelections {
    key: string | null;
    scale: string | null;
    chord: { label: string; value: string } | null;
    octaveMax: string | null;
    octaveMin: string | null;
}

interface Props {
    updateKeyScaleChord: (key: string, scale: string, chord: string, chordVal: string, octaveMax: any, octaveMin: any, val: string) => void;
    noteBuilderFocus: string;
    selectionsRef?: React.MutableRefObject<MingusSelections | null>;
    tune: Tune,
    currentMicroTonalScale: (scale: any) => void,
    setFxKnobsCount: Dispatch<React.SetStateAction<number>>,
    doUpdateBabylonKey: (value: string) => void,
    getSTK1Preset: (x: string) => any,
    updateMicroTonalScale: (scale: any) => void,
};

const MingusPopup = ({
    updateKeyScaleChord,
    noteBuilderFocus,
    selectionsRef,
    tune,
    currentMicroTonalScale,
    setFxKnobsCount,
    doUpdateBabylonKey,
    getSTK1Preset,
    updateMicroTonalScale,
}: Props) => {
    const [isKeySelectOpen, setIsKeySelectOpen] = React.useState(false);
    const [isScaleSelectOpen, setIsScaleSelectOpen] = React.useState(false);
    const [isChordSelectOpen, setIsChordSelectOpen] = React.useState(false);
    const [isOctaveMaxSelectOpen, setIsOctaveMaxSelectOpen] = React.useState(false);
    const [isOctaveMinSelectOpen, setIsOctaveMinSelectOpen] = React.useState(false);
    const [selectedKey, setSelectedKey] = React.useState<string | null>('C');
    const [selectedScale, setSelectedScale] = React.useState<string | null>('Diatonic');
    const [selectedChord, setSelectedChord] = React.useState<any>(null);
    const [selectedOctaveMax, setSelectedOctaveMax] = React.useState<string | null>('4');
    const [selectedOctaveMin, setSelectedOctaveMin] = React.useState<string | null>('1');

    const [searchKeyTerm, setSearchKeyTerm] = React.useState('');
    const [searchScaleTerm, setSearchScaleTerm] = React.useState('');
    const [searchChordTerm, setSearchChordTerm] = React.useState('');
    const [searchOctaveMaxTerm, setSearchOctaveMaxTerm] = React.useState('');
    const [searchOctaveMinTerm, setSearchOctaveMinTerm] = React.useState('');

    const selectKeyRef = React.useRef<HTMLDivElement | null>(null);
    const selectScaleRef = React.useRef<HTMLDivElement | null>(null);
    const selectChordRef = React.useRef<HTMLDivElement | null>(null);
    const dropdownOctaveMaxSelectRef = React.useRef<HTMLDivElement | null>(null);
    const dropdownOctaveMinSelectRef = React.useRef<HTMLDivElement | null>(null);
    const dropdownKeySelectRef = React.useRef<HTMLDivElement | null>(null);
    const dropdownScaleSelectRef = React.useRef<HTMLDivElement | null>(null);
    const dropdownChordSelectRef = React.useRef<HTMLDivElement | null>(null);
    const selectOctaveMaxRef = React.useRef<HTMLDivElement | null>(null);
    const selectOctaveMinRef = React.useRef<HTMLDivElement | null>(null);

    // Expose selections via ref for parent components
    useEffect(() => {
        if (selectionsRef) {
            selectionsRef.current = {
                key: selectedKey,
                scale: selectedScale,
                chord: selectedChord,
                octaveMax: selectedOctaveMax,
                octaveMin: selectedOctaveMin,
            };
        }
    }, [selectedKey, selectedScale, selectedChord, selectedOctaveMax, selectedOctaveMin, selectionsRef]);

    useEffect(() => {
        if (selectedKey &&
            selectedScale &&
            selectedChord &&
            selectedOctaveMax &&
            selectedOctaveMin) {
            updateKeyScaleChord(selectedKey, selectedScale, selectedChord.value, selectedChord.label, selectedOctaveMax, selectedOctaveMin, noteBuilderFocus);
        }
    }, [selectedKey, selectedScale, selectedChord, selectedOctaveMax, selectedOctaveMin, updateKeyScaleChord, noteBuilderFocus]);



    const handleKeySelect = (option: any) => {
        setSelectedKey(option);
        setIsKeySelectOpen(false);
    };

    const handleScaleSelect = (option: any) => {
        setSelectedScale(option.label);
        setIsScaleSelectOpen(false);
    };

    const handleChordSelect = (option: any) => {
        setSelectedChord(option);
        setIsChordSelectOpen(false);
        console.log("Selected Chord: ", option.label);
    };

    const handleOctaveMaxSelect = (option: any) => {
        setSelectedOctaveMax(option.label);
        setIsOctaveMaxSelectOpen(false);
    };

    const handleOctaveMinSelect = (option: any) => {
        setSelectedOctaveMin(option.label);
        setIsOctaveMinSelectOpen(false);
    };

    const keyOptions = [
        // {value: 'C', label: 'C'},
        // {value: 'C♯', label: 'C♯'},
        // {value: 'D', label: 'D'},
        // {value: 'D♯', label: 'D♯'},
        // {value: 'E', label: 'E'},
        // {value: 'F', label: 'F'},
        // {value: 'F♯', label: 'F♯'},
        // {value: 'G', label: 'G'},
        // {value: 'G♯', label: 'G♯'},
        // {value: 'A', label: 'A'},
        // {value: 'A♯', label: 'A♯'},
        // {value: 'B', label: 'B'},
        'C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'
    ];

    const scaleOptions = [
        { value: 'Diatonic', label: 'Diatonic' },
        { value: 'Major', label: 'Major' },
        { value: 'Harmonic Major', label: 'Harmonic Major' },
        { value: 'Natural Minor', label: 'Natural Minor' },
        { value: 'Harmonic Minor', label: 'Harmonic Minor' },
        { value: 'Melodic Minor', label: 'Melodic Minor' },
        { value: 'Bachian', label: 'Bachian' },
        { value: 'MinorNeapolitan', label: 'Minor Neapolitan' },
        { value: 'Chromatic', label: 'Chromatic' },
        { value: 'WholeTone', label: 'Whole Tone' },
        { value: 'Octatonic', label: 'Octatonic' },
        { value: 'Ionian', label: 'Ionian' },
        { value: 'Dorian', label: 'Dorian' },
        { value: 'Phrygian', label: 'Phrygian' },
        { value: 'Lydian', label: 'Lydian' },
        { value: 'Mixolydian', label: 'Mixolydian' },
        { value: 'Aeolian', label: 'Aeolian' },
        { value: 'Locrian', label: 'Locrian' },
        { value: 'Fifths', label: 'Fifths' },
    ];

    const chordOptions = [
        { value: 'M', label: 'Major Triad' },
        { value: 'm', label: 'Minor Triad' },
        { value: 'aug', label: 'Augmented Triad' },
        { value: 'dim', label: 'Diminished Triad' },
        // {value: 'dim7', label: 'Diminished Seventh'},
        { value: 'sus2', label: 'Suspended Second Triad' },
        { value: 'sus', label: 'Suspended Fourth Triad' },
        { value: 'susb9', label: 'Suspended Fourth Ninth' },
        { value: '7sus4', label: 'Suspended Seventh' },
        { value: 'sus47', label: 'Suspended Seventh' },

        { value: 'm2', label: 'Minor Second' },
        { value: 'm3', label: 'Minor Third' },
        { value: 'M4', label: 'Major Fourth' },
        { value: '4', label: 'Perfect Fourth' },

        // {value:'madd4', label: 'Minor Add Fourth'},
        { value: '5', label: 'Perfect Fifth' },
        { value: 'M5', label: 'Major Fifth' },
        { value: 'm5', label: 'Minor Fifth' },
        // {value:'7b5', label: 'Dominant Flat Five'},

        { value: '6', label: 'Major Sixth' },
        { value: 'm6', label: 'Minor Sixth' },
        { value: '67', label: 'Dominant Sixth' },
        { value: '69', label: 'Sixth Ninth' },

        { value: 'M7', label: 'Major Seventh' },
        { value: 'm7', label: 'Minor Seventh' },
        { value: 'M7+', label: 'Augmented Major Seventh' },
        { value: 'm7+', label: 'Augmented Minor Seventh' },

        { value: 'm7b5', label: 'Half Diminished Seventh' },
        // {value:'mM7', label: 'Minor Major Seventh'},
        // {value:'dom7', label: 'Dominant Seventh'},
        { value: '7+', label: 'Augmented Major Seventh' },
        { value: '7#5', label: 'Augmented Minor Seventh' },
        { value: '7#11', label: 'Lydian Dominant Seventh' },
        // {value:'m/M7', label: 'Minor Major Seventh'},

        { value: 'M9', label: 'Major Ninth' },
        { value: 'm9', label: 'Minor Ninth' },
        // {value:'add9', label: 'Dominant Ninth'},

        // {value:'sus4b9', label: 'Suspended Fourth Ninth 2'},
        { value: '9', label: 'Dominant Ninth' },
        // {value:'m9b5', label: 'Minor Ninth Flat Five'},
        { value: '7_#9', label: 'Dominant Sharp Ninth' },
        { value: '7b9', label: 'Dominant Flat Ninth' },
        // {value:'9#', label: 'Dominant Sharp Ninth'},
        { value: '11', label: 'Dominant Eleventh' },
        { value: 'm11', label: 'Minor Eleventh' },
        { value: 'add11', label: 'Dominant Eleventh' },
        { value: 'hendrix', label: 'Hendrix Chord' },
        { value: 'M13', label: 'Major Thirteenth' },
        { value: 'm13', label: 'Minor Thirteenth' },
        { value: '13', label: 'Dominant Thirteenth' },

    ];

    const octaveMaxOptions = [
        { value: '1', label: '1' },
        { value: '2', label: '2' },
        { value: '3', label: '3' },
        { value: '4', label: '4' },
        { value: '5', label: '5' },
        { value: '6', label: '6' },
        { value: '7', label: '7' },
        { value: '8', label: '8' },
    ];

    const octaveMinOptions = [
        { value: '1', label: '1' },
        { value: '2', label: '2' },
        { value: '3', label: '3' },
        { value: '4', label: '4' },
        { value: '5', label: '5' },
        { value: '6', label: '6' },
        { value: '7', label: '7' },
        { value: '8', label: '8' },
    ];



    useEffect(() => {
        // If modal is open, add event listener to detect outside clicks
        if (isKeySelectOpen || isScaleSelectOpen || isChordSelectOpen || isOctaveMaxSelectOpen || isOctaveMinSelectOpen) {

            const handleClickOutside = (event: MouseEvent) => {
                const refs = [
                    dropdownOctaveMaxSelectRef.current,
                    dropdownOctaveMinSelectRef.current,
                    dropdownKeySelectRef.current,
                    dropdownScaleSelectRef.current,
                    dropdownChordSelectRef.current,
                ];

                const clickedInside = refs.some(
                    (ref) => ref && ref.contains(event.target as Node)
                );

                if (!clickedInside) {
                    setIsChordSelectOpen(false);
                    setIsKeySelectOpen(false);
                    setIsScaleSelectOpen(false);
                    setIsOctaveMaxSelectOpen(false);
                    setIsOctaveMinSelectOpen(false);
                    console.log("Clicked outside");
                }
            };

            Array.from(document.getElementsByTagName('canvas')).forEach((i: any) => i.addEventListener("pointerdown", handleClickOutside));
            // Add the event listener
            document.addEventListener('mousedown', handleClickOutside);

            // Clean up the event listener when the component unmounts or when modal closes
            return () => {
                Array.from(document.getElementsByTagName('canvas')).forEach((i: any) => i.removeEventListener('pointerdown', handleClickOutside));
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [isChordSelectOpen, isKeySelectOpen, isScaleSelectOpen, isOctaveMaxSelectOpen, isOctaveMinSelectOpen]);

    return (
        <Box
            sx={{
                display: 'flex',
                height: '100%',
                outline: 'none',
                flexDirection: 'column',
                // minWidth: '128px',
                // width: 'calc(100% - 4px)',
                // width: '250px',
                width: '100%',
                alignItems: 'stretch',
                fontSize: '12px',
                border: () => {
                    if (noteBuilderFocus && noteBuilderFocus.toLowerCase() === "scale") return `1px solid ${OBERHEIM_TEAL}`;
                    if (noteBuilderFocus && noteBuilderFocus.toLowerCase() === "chord") return `1px solid ${NEON_PINK}`;
                    if (noteBuilderFocus && noteBuilderFocus.toLowerCase() === "micro") return `1px solid ${HERITAGE_GOLD}`;
                    if (noteBuilderFocus && noteBuilderFocus.toLowerCase() === "midi") return `1px solid ${CORDUROY_RUST}`;
                },
                borderRadius: '4px',
                marginRight: '4px',
            }}
        >
            {/* <FormLabel
                sx={{
                    color: 'rgba(245,245,245,0.78)',
                    fontSize: '11px',
                    paddingLeft: '8px',
                }}
                id="notebuilder-select-label"
            >Notes Builder</FormLabel> */}
            <Box sx={{width: '100%', height: '100%'}}>
                {
                //(noteBuilderFocus && (noteBuilderFocus.toLowerCase() === "scale" || noteBuilderFocus.toLowerCase() === "micro")) && 
                <Box sx={{
                    width: '100%',
                    padding: '0px !important',
                    margin: '0px !important',
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    boxSizing: 'border-box',
                    background: 'rgba(28,28,28,0.3)',
                    color: 'rgba(245,245,245,0.78)',
                }}>
                    <FormControl sx={{
                        width: '100% !important',
                        position: 'relative',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        display: 'flex',
                        backgroundColor: "rgba(245,245,245,0.078) !important",
                        // paddingLeft: '8px !important',
                        cursor: 'pointer',
                    }}
                        onClick={() => setIsOctaveMaxSelectOpen(!isOctaveMaxSelectOpen)}
                    >
                        <div
                            style={{
                                pointerEvents: 'none',
                                paddingTop: '8px',
                                paddingBottom: '8px',
                                // minWidth: "72px",
                                // paddingLeft: '0px',
                                paddingLeft: '8px',
                            }}
                        >
                            Max:</div>
                        <div
                            ref={selectOctaveMaxRef}
                            style={{
                                cursor: 'pointer',
                                fontFamily: 'monospace',
                                fontSize: '12px',
                                width: '100%',
                                justifyContent: 'center',
                                alignItems: 'center',
                                textAlign: 'center',
                                paddingTop: '8px',
                                paddingBottom: '8px',
                                paddingLeft: '18px',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                position: 'relative',
                                padding: '0px',
                                margin: '0px',
                            }}
                        >
                            {selectedOctaveMax}
                        </div>
                        {isOctaveMaxSelectOpen && (
                            <div
                                ref={dropdownOctaveMaxSelectRef}
                                style={{
                                    position: 'absolute',
                                    // top: '100%',
                                    bottom: 'calc(100% - 6px)',
                                    width: '100%',
                                    fontSize: '12px',
                                    maxHeight: '12rem',
                                    overflowY: 'auto',
                                    backgroundColor: OBERHEIM_TEAL,
                                    color: 'rgba(245,245,245,0.78)',
                                    zIndex: 99999,
                                    // minWidth: '180px',
                                }}
                            >
                                <Input
                                    placeholder="Search..."
                                    value={searchOctaveMaxTerm}
                                    onChange={(e) => setSearchOctaveMaxTerm(e.target.value)}
                                    style={{
                                        width: '100%',
                                        fontFamily: 'monospace',
                                        fontSize: '12px',
                                                                           bottom: 'calc(100% + 6px)',
                                    height: 'auto',
                                    display: 'inline-block',
                                        marginBottom: '8px',
                                        background: 'rgba(28,28,28,1)',
                                        color: 'rgba(245,245,245,0.78)',
                                    }}
                                />
                                {(
                                    searchOctaveMaxTerm.length > 0
                                        ?
                                        octaveMaxOptions.filter((x: any) => x.label.includes(searchOctaveMaxTerm))
                                        :
                                        octaveMaxOptions).map((option) => (
                                            <div
                                                key={option.value}
                                                onClick={() => handleOctaveMaxSelect(option)}
                                                style={{
                                                    borderTop: '1px solid rgba(245,245,245,0.4)',
                                                    padding: '5px',
                                                    cursor: 'pointer',
                                                    fontFamily: 'monospace',
                                                    // background: OBERHEIM_TEAL,
                                                    zIndex: '99999',
                                                    color: 'rgba(245,245,245,0.78)',
                                                }}
                                            >
                                                {option.label}
                                            </div>
                                        )
                                        )
                                }
                            </div>
                        )}
                    </FormControl>


                    <FormControl sx={{
                        color: 'rgba(245,245,245,0.78)',
                        position: 'relative',
                        border: 'transparent',
                        borderRadius: '4px',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        backgroundColor: "rgba(245,245,245,0.078) !important",
                        // paddingLeft: '8px !important',
                        display: 'flex',
                        alignItems: 'center',
                        width: '100% !important',

                        cursor: 'pointer',
                    }}
                        onClick={() => setIsOctaveMinSelectOpen(!isOctaveMinSelectOpen)}
                    >
                        <span
                            style={{
                                pointerEvents: 'none',
                                paddingTop: '8px',
                                paddingBottom: '8px',
                                // minWidth: "72px",
                                // paddingLeft: '0px',
                                paddingLeft: '18px',
                            }}
                        >Min: </span>
                        <div
                            ref={selectOctaveMinRef}
                            style={{
                                height: '64px !important',
                                color: 'rgba(245,245,245,0.78)',
                                cursor: 'pointer',
                                fontFamily: 'monospace',
                                fontSize: '12px',
                                width: '100%',
                                justifyContent: 'center',
                                alignItems: 'center',
                                textAlign: 'center',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                margin: '0px',
                                paddingTop: '8px',
                                paddingBottom: '8px',
                                paddingLeft: '18px',

                            }}
                        >
                            {selectedOctaveMin}
                        </div>
                        {isOctaveMinSelectOpen && (
                            <div
                                ref={dropdownOctaveMinSelectRef}
                                style={{
                                    position: 'absolute',
                                    // top: '100%',
                                    bottom: 'calc(100% - 6px)',
                                    width: '100%',
                                    maxHeight: '12rem',
                                    overflowY: 'auto',
                                    backgroundColor: OBERHEIM_TEAL,
                                    color: 'rgba(245,245,245,0.78)',
                                    zIndex: 99999,
                                }}
                            >
                                <Input
                                    placeholder="Search..."
                                    value={searchOctaveMinTerm}
                                    onChange={(e) => setSearchOctaveMinTerm(e.target.value)}
                                    style={{
                                        width: '100%',
                                        fontFamily: 'monospace',
                                        fontSize: '12px',
                                        textAlign: 'center',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        marginBottom: '8px',
                                        background: 'rgba(28,28,28,1)',
                                        color: 'rgba(245,245,245,0.78)',
                                    }}
                                />
                                {
                                    (
                                        searchOctaveMinTerm.length > 0
                                            ?
                                            octaveMinOptions.filter((x: any) => x.label.includes(searchOctaveMinTerm))
                                            :
                                            octaveMinOptions).map((option) => (
                                                <div
                                                    key={option.value}
                                                    onClick={() => handleOctaveMinSelect(option)}
                                                    style={{
                                                        borderTop: '1px solid rgba(245,245,245,0.4)',
                                                        padding: '5px',
                                                        cursor: 'pointer',
                                                        fontFamily: 'monospace',
                                                        // background: OBERHEIM_TEAL,
                                                        zIndex: '99999',
                                                    }}
                                                >
                                                    {option.label}
                                                </div>
                                            )
                                            )
                                }
                            </div>
                        )}
                    </FormControl>
                </Box>}
                <Box
                    style={{
                        // width: '100% !important',
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        // padding: '0px !important',
                        // margin: '0px !important',
                        background: 'rgba(28,28,28,0.3)',
                        color: 'rgba(245,245,245,0.78)',
                        justifyContent: 'stretch',
                    }}
                >
                    {/* //{ */}
                    {/* // noteBuilderFocus && noteBuilderFocus && !noteBuilderFocus.toLowerCase().includes("micro") &&  */}
                    
                    <FormControl sx={{
                        // width: '60px', 
                        width: '100%',
                        color: 'rgba(245,245,245,0.78)',
                        position: 'relative',
                        cursor: 'pointer',
                        justifyContent: 'center',
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: "rgba(245,245,245,0.078) !important",
                        // paddingLeft: '8px !important',
                        // height: '64px !important',
                    
                        background: 'rgba(28,28,28,0.3)',
                    }}
                        onClick={() => setIsKeySelectOpen(!isKeySelectOpen)}
                    >
                        <span
                            style={{
                                pointerEvents: "none",
                                // minWidth: "100px",
                                paddingTop: '8px',
                                paddingBottom: '8px',
                                // paddingLeft: '8px',
                                paddingLeft: '18px',
                            }}
                        >
                            Key:
                        </span>
                        <div
                            ref={selectKeyRef}
                            style={{
                                color: 'rgba(245,245,245,0.78)',
                                cursor: 'pointer',
                                fontFamily: 'monospace',
                                fontSize: '12px',
                                width: '100%',
                                minWidth: '60px',
                                justifyContent: 'center',
                                alignItems: 'center',
                                textAlign: 'center',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                height: '64px !important',
                                paddingTop: '8px',
                                paddingBottom: '8px',
                                // paddingLeft: '18px',
                            }}
                        >
                            {selectedKey}
                        </div>
                        {isKeySelectOpen && (
                            <div
                                ref={dropdownKeySelectRef}
                                style={{
                                    position: 'absolute',
                                    // top: '100%',
                                    bottom: 'calc(100% - 6px)',
                                    width: '100%',
                                    maxHeight: '12rem',
                                    overflowY: 'auto',
                                    color: 'rgba(245,245,245,0.78)',
                                    backgroundColor: OBERHEIM_TEAL,
                                    zIndex: 99999,
                                }}
                            >
                                {(searchKeyTerm.length > 0 ? keyOptions.filter((x: any) => x.includes(searchKeyTerm)) : keyOptions).map((option) => (
                                    <div
                                        key={option}
                                        onClick={() => handleKeySelect(option)}
                                        style={{
                                            borderTop: '1px solid rgba(245,245,245,0.4)',
                                            padding: '5px',
                                            cursor: 'pointer',
                                            fontFamily: 'monospace',
                                            // background: OBERHEIM_TEAL,
                                            zIndex: '99999',
                                        }}
                                    >
                                        {option}
                                    </div>
                                ))}
                            </div>
                        )}
                    </FormControl>
                    {/* //} */}


                    {/* {noteBuilderFocus && noteBuilderFocus.toLowerCase() === "chord" &&  */}
                    <FormControl
                        sx={{
                            // width: '60px', 
                            width: '100%',
                            display: 'inline-flex',
                            flexDirection: 'row',
                            color: 'rgba(245,245,245,0.78)',
                            position: 'relative',
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: "rgba(245,245,245,0.078) !important",
                            // paddingLeft: '8px !important',
                            height: '32px !important',
                            background: 'rgba(28,28,28,0.3)',
                            cursor: 'pointer',
                        }}
                        onClick={() => setIsChordSelectOpen(!isChordSelectOpen)}
                    ><span style={{
                        pointerEvents: "none",
                    }}></span>
                        <div
                            ref={selectChordRef}
                            style={{
                                color: 'rgba(245,245,245,0.78)',

                                cursor: 'pointer',
                                fontFamily: 'monospace',
                                fontSize: '12px',
                                width: '100%',
                                minWidth: '60px',
                                justifyContent: 'center',
                                alignItems: 'center',
                                textAlign: 'center',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                minHeight: '1040px !important',
                            }}
                            onClick={() => setIsChordSelectOpen(!isChordSelectOpen)}
                        >
                            {selectedChord?.label || 'Select Chord'}
                        </div>
                        {
                            isChordSelectOpen && (
                                <div
                                    ref={dropdownChordSelectRef}
                                    style={{
                                        position: 'absolute',
                                        // top: '100%',
                                        bottom: 'calc(100% - 6px)',
                                        width: '100%',
                                        maxHeight: '12rem',
                                        overflowY: 'auto',
                                        backgroundColor: OBERHEIM_TEAL,
                                        color: 'rgba(245,245,245,0.78)',
                                        zIndex: 99999,
                                        minWidth: '180px',
                                    }}
                                >
                                    <Input
                                        placeholder="Search..."
                                        value={searchChordTerm}
                                        onChange={(e) => setSearchChordTerm(e.target.value)}
                                        style={{
                                            width: '100%',
                                            fontFamily: 'monospace',
                                            fontSize: '12px',
                                            marginBottom: '8px',
                                            background: 'rgba(28,28,28,1)',
                                            color: 'rgba(245,245,245,0.78)',
                                        }}
                                    />
                                    {
                                        (searchChordTerm.length > 0
                                            ?
                                            chordOptions.filter((x: any) => x.label.includes(searchChordTerm))
                                            :
                                            chordOptions).map((option) => (
                                                <div
                                                    key={option.value}
                                                    onClick={() => handleChordSelect(option)}
                                                    style={{
                                                        borderTop: '1px solid rgba(245,245,245,0.4)',
                                                        padding: '5px',
                                                        cursor: 'pointer',
                                                        fontFamily: 'monospace',
                                                        // background: OBERHEIM_TEAL,
                                                        zIndex: '99999',
                                                    }}
                                                >
                                                    {option.label}
                                                </div>
                                            )
                                            )
                                    }
                                </div>
                            )
                        }
                    </FormControl>

                    {/* {noteBuilderFocus && noteBuilderFocus.toLowerCase() === "scale" &&  */}
                    <FormControl
                        sx={{
                            width: '100%',
                            color: 'rgba(245,245,245,0.78)',
                            position: 'relative',
                            flexDirection: 'row',
                            justifyContent: 'center',
                            height: '32px !important',
                            display: 'inline-flex',
                            alignItems: 'center',
                            backgroundColor: "rgba(245,245,245,0.078) !important",
                            // paddingLeft: '8px !important',
                            background: 'rgba(28,28,28,0.3)',
                            cursor: 'pointer',
                        }}
                        onClick={() => setIsScaleSelectOpen(!isScaleSelectOpen)}
                    >
                        <span style={{
                            pointerEvents: 'none',
                            paddingTop: '8px',
                            paddingBottom: '8px',
                            paddingLeft: '4px',
                            // minWidth: "72px",
                            // paddingLeft: '8px',
                        }}>
                            {/* Scale: */}
                        </span>
                        <div
                            ref={selectScaleRef}
                            style={{
                                color: 'rgba(245,245,245,0.78)',
                                cursor: 'pointer',
                                fontFamily: 'monospace',
                                fontSize: '12px',
                                width: '100%',
                                minWidth: '60px',
                                justifyContent: 'center',
                                alignItems: 'center',
                                textAlign: 'center',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            {selectedScale}
                        </div>
                        {isScaleSelectOpen && (
                            <div
                                ref={dropdownScaleSelectRef}
                                style={{
                                    position: 'absolute',
                                    // top: '100%',
                                    bottom: 'calc(100% - 6px)',
                                    width: '100%',
                                    maxHeight: '12rem',
                                    overflowY: 'auto',
                                    backgroundColor: OBERHEIM_TEAL,
                                    color: 'rgba(245,245,245,0.78)',
                                    zIndex: 99999,
                                    minWidth: '180px',
                                }}
                            >
                                <Input
                                    placeholder="Search..."
                                    value={searchScaleTerm}
                                    onChange={(e) => setSearchScaleTerm(e.target.value)}
                                    style={{
                                        width: '100%',
                                        fontFamily: 'monospace',
                                        fontSize: '12px',
                                        background: 'rgba(28,28,28,1)',
                                        color: 'rgba(245,245,245,0.78)',
                                    }}
                                />
                                {(searchScaleTerm.length > 0
                                    ?
                                    scaleOptions.filter((x: any) => x.label.includes(searchScaleTerm))
                                    :
                                    scaleOptions).map((option) => (
                                        <div
                                            key={option.value}
                                            onClick={() => handleScaleSelect(option)}
                                            style={{
                                                borderTop: '1px solid rgba(245,245,245,0.4)',
                                                padding: '5px',
                                                cursor: 'pointer',
                                                fontFamily: 'monospace',
                                                // background: OBERHEIM_TEAL,
                                                backgroundColor: OBERHEIM_TEAL,
                                                zIndex: '99999'
                                            }}
                                        >
                                            {option.label}
                                        </div>
                                    )
                                    )
                                }
                            </div>
                        )}
                    </FormControl>


                    {/* {noteBuilderFocus && noteBuilderFocus && noteBuilderFocus.toLowerCase().includes("micro") &&
                        <InstrumentsAndMicrotones
                            tune={tune}
                            currentMicroTonalScale={currentMicroTonalScale}
                            setFxKnobsCount={setFxKnobsCount}
                            doUpdateBabylonKey={doUpdateBabylonKey}
                            getSTK1Preset={getSTK1Preset}
                            updateMicroTonalScale={updateMicroTonalScale}
                        />} */}

                </Box>
            </Box>
        </Box>
    );
};
export default MingusPopup;