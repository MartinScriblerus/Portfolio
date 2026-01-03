
import { Box } from '@mui/material';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMicrotonalStore } from '../../store/useMicrotonalStore';

interface Props {
    chuckHook: any;
    keysVisible: boolean;
    keysReady: boolean;
    organizeRows: (rowNum: number, note: string) => Promise<void>;
    organizeLocalStorageRows: (theNote: any) => Promise<void>;
    noteOnPlay: (midiNote: number, midiVelocity: number, midiHz?: number) => any;
    noteOffPlay: (midiNote: number) => any;
    compare: (a: any, b: any) => number;
    noteBuilderFocus?: string;
    notesAddedDetails: any;
    // updateKeyScaleChord: (a:any, b:any, c: any, d: any, e: any) => void;
    mingusKeyboardData: any;
    mingusChordsData: any;
    pressedNotes: Set<number>; // Set of currently pressed MIDI note numbers
    // Optional: provide microtonal frequency mapping for a given MIDI note
    getTunedHz?: (midiNote: number, defaultHz?: number) => number | undefined;
};

const Keyboard = ({
    chuckHook,
    keysVisible,
    keysReady,
    organizeRows,
    organizeLocalStorageRows,
    noteOnPlay,
    noteOffPlay,
    compare,
    noteBuilderFocus,
    notesAddedDetails,
    mingusKeyboardData,
    mingusChordsData,
    pressedNotes,
    getTunedHz,
}: Props) => {
    // Subscribe to microtonal store values so we can use them in cache keys
    const stepsPerOctave = useMicrotonalStore(s => s.stepsPerOctave);
    const baseMidi = useMicrotonalStore(s => s.baseMidi);
    const cents = useMicrotonalStore(s => s.cents);

    const [keysToDisplay, setKeysToDisplay] = useState<any>([]);
    const addedDetails = useRef<any>(notesAddedDetails);
    const [updateKeysScale, setUpdateKeysScale] = useState<any>([]);

    const flatToSharp = (oldKeyId: string) => {

    let newKeyId;

    if (oldKeyId.includes('b')) {
        if (oldKeyId.includes('A')) {
            newKeyId = 'G#'; 
        } else if (oldKeyId.includes('B')) {
            newKeyId = 'A#';
        } else if (oldKeyId.includes('D')) {
            newKeyId = 'C#';
        } else if (oldKeyId.includes('E')) {
            newKeyId = 'D#';
        } else if (oldKeyId.includes('G')) {
            newKeyId = 'F#';
        } else if (oldKeyId) {
            newKeyId = oldKeyId;
            if (oldKeyId !== "F" && oldKeyId !== "C") {
                console.log("what is this key?? ", oldKeyId);
            }
        }        
        console.log("FLAT TO SHARP: ", oldKeyId, "/// ", newKeyId);
    } else {
        newKeyId = oldKeyId;
    }


    return newKeyId;
};

    useEffect(() => {
        if (notesAddedDetails && notesAddedDetails.length > 0) {
            console.log("NOTES ADDED DETAILS??? : ", notesAddedDetails);
            const noDupesAddedDetails: any = Array.from(
                new Map(notesAddedDetails.map((note: any) => [note.midiNote, note])).values()
              );
            addedDetails.current = noDupesAddedDetails;
        }
    }, [notesAddedDetails]);


    const tryPlayChuckNote = useCallback((e: any) => {
        e.preventDefault();
    
        const removeHyphen = e.target.id.replace('-', '');
        const convertPoundTheNote = removeHyphen.replace('♯', '#');
    
        console.log("Convert Pound the Note: ", convertPoundTheNote);
        

        console.log("A D D E D * D E T A I L S ! ", addedDetails.current.length, addedDetails.current);
    
        const match:any = Array.from(addedDetails.current).find((d: any) => convertPoundTheNote === d.name);
        if (match) {
            console.log("about to noteOnPlay... CHUCK NOTE match: ", match);
            const tunedHz = typeof getTunedHz === 'function' ? getTunedHz(match.midiNote, match.midiHz) : match.midiHz;
            noteOnPlay(match.midiNote, tunedHz, tunedHz);
        }
    }, [addedDetails, noteOnPlay, getTunedHz]);

    const tryPlayChuckNoteOff = useCallback((e: any) => {
        e.preventDefault();
    
        const removeHyphen = e.target.id.replace('-', '');
        const convertPoundTheNote = removeHyphen.replace('♯', '#');
    
        const match:any = Array.from(addedDetails.current).find((d: any) => convertPoundTheNote === d.name);
        if (!match) { return; }
        console.log("Match for NOTE OFF: ", match);

        if (pressedNotes.has(match?.midiNote) === false) { return; }

        console.log("Removed Hyphen: ", removeHyphen, " into convertPoundTheNote ", convertPoundTheNote);
        console.log("Pressed Notes Set has midiNote match: ", pressedNotes.has(match?.midiNote), pressedNotes, match?.midiNote);
        
        
        if (match && pressedNotes.has(match.midiNote)) {
            console.log("about to noteOffPlay... CHUCK NOTE match: ", match);
            if (pressedNotes.has(match.midiNote)) noteOffPlay(match.midiNote);
        }
    }, [addedDetails, noteOffPlay]);

    useEffect(() => {
        const handleMouseUp = (e: any) => {
            tryPlayChuckNoteOff(e);
        };

        const handleMouseOut = (e: any) => {
            tryPlayChuckNoteOff(e);
        }

        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('mouseout', handleMouseOut);
        
        return () => {
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('mouseout', handleMouseOut); // Fixed: was handleMouseUp
        };
    }, [tryPlayChuckNoteOff]);

    // Use refs to prevent infinite loops from function dependencies
    const compareRef = useRef(compare);
    const organizeRowsRef = useRef(organizeRows);
    const organizeLocalStorageRowsRef = useRef(organizeLocalStorageRows);
    const tryPlayChuckNoteRef = useRef(tryPlayChuckNote);
    const tryPlayChuckNoteOffRef = useRef(tryPlayChuckNoteOff);
    
    useEffect(() => {
        compareRef.current = compare;
        organizeRowsRef.current = organizeRows;
        organizeLocalStorageRowsRef.current = organizeLocalStorageRows;
        tryPlayChuckNoteRef.current = tryPlayChuckNote;
    }, [compare, organizeRows, organizeLocalStorageRows, tryPlayChuckNote]);

    useEffect(() => {
        // Only generate keys once, or when microtonal settings change
        // Don't check keysReady - it might be set before keys are actually generated
        if (keysToDisplay.length > 0) {
            return;
        }

        let cancelled = false;

        const createKeys = async () => {
            if (cancelled) return;
            
            console.log('[Keyboard] Starting key generation...');

            // Read microtonal params from global store
            const stepsPerOctave = useMicrotonalStore.getState().stepsPerOctave;
            const baseMidi = useMicrotonalStore.getState().baseMidi;
            const cents = useMicrotonalStore.getState().cents;

            // Build a cache key based on microtonal settings so we refresh when those change
            const cacheKey = `keyboard_labels_v1_${stepsPerOctave || 12}_${baseMidi || 60}_${JSON.stringify(cents || [])}`;

            // If we have cached labels in sessionStorage, use them to quickly construct DOM nodes
            try {
                const cached = sessionStorage.getItem(cacheKey);
                if (cached) {
                    const labels: string[] = JSON.parse(cached);
                    const octaves: any[] = [];
                    for (let i = 0; i < 9; i++) {
                        const idxBase = i * (stepsPerOctave || 12);
                        const octave = (
                            <span id={`octSpanWrapper-${i}`} key={`octSpanWrapper-${i}`}>
                                {/* map labels for this octave into li elements with handlers */}
                                {labels.slice(idxBase, idxBase + (stepsPerOctave || 12)).map((noteLabel, k) => {
                                    const noteId = `${noteLabel}-${i}`;
                                    const isSharp = noteLabel.includes('♯') || noteLabel.includes('#');
                                    const className = isSharp ? 'vizKey black' : 'vizKey white';
                                    return (
                                        <li
                                            id={noteId}
                                            key={noteId}
                                            className={className + (isSharp ? '' : ' offset')}
                                            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); return tryPlayChuckNoteRef.current(e); }}
                                            onMouseUp={(e) => { e.preventDefault(); e.stopPropagation(); return tryPlayChuckNoteOffRef.current(e); }}
                                            onMouseLeave={(e) => { e.preventDefault(); e.stopPropagation(); return tryPlayChuckNoteOffRef.current(e); }}
                                        >
                                            {noteLabel}
                                        </li>
                                    );
                                })}
                            </span>
                        );
                        octaves.push(octave);
                    }
                    if (!cancelled && octaves.length > 0) {
                        console.log('[Keyboard] Generated keys from cache:', octaves.length, 'octaves');
                        setKeysToDisplay(octaves);
                    }
                    return;
                }
            } catch (e) {
                // ignore sessionStorage issues
            }

            // No cache; fall back to original behavior and then cache labels for next time
            const storedNamesUnparsed = localStorage.getItem('keyboard');
            const storedNames = storedNamesUnparsed ? JSON.parse(storedNamesUnparsed) : {};

            const octaves: Array<any> = [];
            const generatedLabels: string[] = [];
            for (let i = 0; i < 9; i++) {
                const perOctaveLabels: string[] = [`C${i}`, `C♯${i}`, `D${i}`, `D♯${i}`, `E${i}`, `F${i}`, `F♯${i}`, `G${i}`, `G♯${i}`, `A${i}`, `A♯${i}`, `B${i}`];
                // Record labels (used for caching)
                generatedLabels.push(...perOctaveLabels);

                if (storedNames && storedNames.length === 108) {
                    storedNames.sort(compareRef.current);
                    perOctaveLabels.forEach((note) => {
                        organizeLocalStorageRowsRef.current(storedNames.find((n: any) => n.note === note));
                    });
                } else {
                    perOctaveLabels.forEach((note) => {
                        organizeRowsRef.current(i, note);
                    });
                }

                const octave: any = i > 0 ? (
                    <span id={`octSpanWrapper-${i}`} key={`octSpanWrapper-${i}`}>
                        <li 
                            style={{
                                background: mingusKeyboardData && mingusKeyboardData.length > 1 && mingusKeyboardData[0].includes(`C`) 
                                ? 'blue' 
                                : mingusKeyboardData && mingusKeyboardData.length > 1 && mingusKeyboardData[1].includes(`C`) 
                                    ? 
                                    'green'
                                    : 
                                    ''
                            }} 
                            id={`C-${i}`} key={`C-${i}`}                         
                            onMouseDown={(e) => 
                            {
                                e.preventDefault(); 
                                e.stopPropagation(); 
                                return tryPlayChuckNoteRef.current(e);
                            }}
                            onMouseUp={(e) => 
                            {
                                e.preventDefault(); 
                                e.stopPropagation(); 
                                return tryPlayChuckNoteOffRef.current(e);
                            }}
                            onMouseLeave={(e) => 
                            {
                                e.preventDefault(); 
                                e.stopPropagation(); 
                                return tryPlayChuckNoteOffRef.current(e);
                            }}
                            className="vizKey white">{`C${i}`} 
                        </li>
                        <li id={`C♯-${i}`} key={`C♯-${i}`} onClick={(e) => {e.preventDefault(); e.stopPropagation(); return tryPlayChuckNoteRef.current(e);}} className="vizKey black">{`C♯${i}`}</li>
                        <li id={`D-${i}`} key={`D-${i}`} onClick={(e) => {e.preventDefault(); e.stopPropagation(); return tryPlayChuckNoteRef.current(e);}} className="vizKey white offset">{`D${i}`}</li>
                        <li id={`D♯-${i}`} key={`D♯-${i}`} onClick={(e) => {e.preventDefault(); e.stopPropagation(); return tryPlayChuckNoteRef.current(e);}} className="vizKey black">{`D♯${i}`}</li>
                        <li id={`E-${i}`} key={`E-${i}`} onClick={(e) => {e.preventDefault(); e.stopPropagation(); return tryPlayChuckNoteRef.current(e);}} className="vizKey white offset half">{`E${i}`}</li>
                        <li id={`F-${i}`} key={`F-${i}`} onClick={(e) => {e.preventDefault(); e.stopPropagation(); return tryPlayChuckNoteRef.current(e);}} className="vizKey white">{`F${i}`}</li>
                        <li id={`F♯-${i}`} key={`F♯-${i}`} onClick={(e) => {e.preventDefault(); e.stopPropagation(); return tryPlayChuckNoteRef.current(e);}} className="vizKey black">{`F♯${i}`}</li>
                        <li id={`G-${i}`} key={`G-${i}`} onClick={(e) => {e.preventDefault(); e.stopPropagation(); return tryPlayChuckNoteRef.current(e);}} className="vizKey white offset">{`G${i}`}</li>
                        <li id={`G♯-${i}`} key={`G♯-${i}`} onClick={(e) => {e.preventDefault(); e.stopPropagation(); return tryPlayChuckNoteRef.current(e);}} className="vizKey black">{`G♯${i}`}</li>
                        <li id={`A-${i}`} key={`A-${i + 1}`} onClick={(e) => {e.preventDefault(); e.stopPropagation(); return tryPlayChuckNoteRef.current(e);}} className="vizKey white offset">{`A${i}`}</li>
                        <li id={`A♯-${i}`} key={`A♯-${i + 1}`} onClick={(e) => {e.preventDefault(); e.stopPropagation(); return tryPlayChuckNoteRef.current(e);}} className="vizKey black">{`A♯${i}`}</li>
                        <li id={`B-${i}`} key={`B-${i + 1}`} onClick={(e) => {e.preventDefault(); e.stopPropagation(); return tryPlayChuckNoteRef.current(e);}} className="vizKey white half">{`B${i}`}</li>
                    </span>
                ) : null;

                if (octave) {
                    octaves.push(octave);
                }
            }

            // Cache generated labels in sessionStorage for faster rebuilds next time
            try {
                const stepsPerOctave = useMicrotonalStore.getState().stepsPerOctave;
                const baseMidi = useMicrotonalStore.getState().baseMidi;
                const cents = useMicrotonalStore.getState().cents;
                const cacheKey2 = `keyboard_labels_v1_${stepsPerOctave || 12}_${baseMidi || 60}_${JSON.stringify(cents || [])}`;
                sessionStorage.setItem(cacheKey2, JSON.stringify(generatedLabels));
            } catch (e) {
                // ignore storage failures
            }

            if (!cancelled && octaves.length > 0) {
                console.log('[Keyboard] Generated keys from scratch:', octaves.length, 'octaves');
                setKeysToDisplay(octaves);
            } else if (!cancelled) {
                console.warn('[Keyboard] Failed to generate keys - octaves array is empty');
            }
        };

        createKeys();

        return () => {
            cancelled = true;
        };
        // Only regenerate when microtonal settings change, not on every render
    }, [
        stepsPerOctave,
        cents,
        baseMidi,
    ]);

    useEffect(() => {
        // console.log("@@@ MINGUS KEYBOARD DATA: ", mingusKeyboardData && mingusKeyboardData.data && mingusKeyboardData.data[0]);
        // console.log("@@@ MINGUS CHORDS DATA: ", mingusChordsData && typeof mingusChordsData === "string" ? JSON.parse(mingusChordsData) : mingusChordsData);

        if (mingusKeyboardData && mingusKeyboardData.data && mingusKeyboardData.data[0]) {
            const allKeyz = document.querySelectorAll(`.vizKey`);
            let normalizedKeyId: any;
            allKeyz.forEach((key: any) => {
                normalizedKeyId = key.id;
                key.classList.remove('activeVizKey');
                normalizedKeyId = flatToSharp(key.id);

                const hasMatch = normalizedKeyId && mingusKeyboardData.data[0].map((i: any) => i && i.toLowerCase()).indexOf(normalizedKeyId[0].toLowerCase())
                const keyIsNotSharp = normalizedKeyId && !normalizedKeyId.includes("♯") && !normalizedKeyId.includes("#")

                const matchIsNotSharp = mingusKeyboardData.data[0] && mingusKeyboardData.data[0][hasMatch] && !mingusKeyboardData.data[0][hasMatch].includes("♯") && !mingusKeyboardData.data[0][hasMatch].includes("#");
                const bothSharpOrNot = mingusKeyboardData.data[0] && mingusKeyboardData.data[0][hasMatch] && (matchIsNotSharp === keyIsNotSharp);

                if (hasMatch >= 0 && bothSharpOrNot) {
                    mingusKeyboardData.data[0][hasMatch] && bothSharpOrNot &&
                    key.classList.add('activeVizKey');
                }
                if (!keyIsNotSharp && !matchIsNotSharp) {
                    key.classList.add('activeVizKey');
                }
            });

            setUpdateKeysScale(mingusKeyboardData && mingusKeyboardData.data && mingusKeyboardData.data[0]);
        }
    }, [mingusKeyboardData, mingusChordsData]);


    return (
        <div
            id="keyboardWrapper"
            key="keyboardWrapper"
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                width: '100%',
                zIndex: 100003,
                pointerEvents: 'auto',
            }}
        >
            <Box
                id="keyboardBox"
                sx={{
                    position: 'relative',
                    width: '100%',
                    zIndex: 100003,
                    backgroundColor: 'var(--color-dominant-surface, rgba(26,28,32,0.95))',
                    borderTop: '2px solid var(--color-subdominant-primary, #00D9FF)',
                    // maxHeight: '200px',
                    overflowX: 'auto',
                    overflowY: 'visible',
                    overscrollBehaviorX: 'contain', // Prevent scroll chaining
                    overscrollBehaviorY: 'none',
                }}
            >
                <ul id="keyboard" key={'keyboard'} style={{ 
                    position: 'relative', 
                    zIndex: 100003,
                    display: 'flex',
                    listStyle: 'none',
                    margin: 0,
                    padding: 0,
                    width: '100%',
                    justifyContent: 'center',
                    flexWrap: 'nowrap',
                }}>
                    {keysToDisplay && keysToDisplay.length > 0 ? (
                        keysToDisplay.map((data: any, idx: number) => {
                            if (!data || data === 0) {
                                return null;
                            }
                            return <span key={idx.toString()}>{data}</span>;
                        })
                    ) : (
                        <li style={{ color: 'var(--color-dominant-text)', padding: '20px' }}>
                            Generating keyboard...
                        </li>
                    )}
                </ul>
            </Box>
        </div>
    );
};
export default Keyboard;