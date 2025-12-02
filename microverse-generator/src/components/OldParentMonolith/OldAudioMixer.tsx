import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, IconButton, Slider, Typography } from '@mui/material';
import VolumeUp from '@mui/icons-material/VolumeUp';
import VolumeOff from '@mui/icons-material/VolumeOff';
import { OBERHEIM_TEAL, NEON_PINK, HERITAGE_GOLD, SLATE_GRAY } from '../../constants';
import { MixerSlider } from './OldMixerSlider';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CloseIcon from '@mui/icons-material/Close';

interface AudioMixerProps {
    universalSources: any;
    handleUpdateVolumes: (source: string, volume: number) => void;
    handleUpdatePans: (source: string, pan: number) => void;
    handleToggleMutes: (source: string) => void;
    handleToggleSolos: (source: string) => void;
    expandedMixerSource: string;
    setExpandedMixerSource: (source: string) => void;
}

const AudioMixer: React.FC<AudioMixerProps> = ({
    universalSources,
    handleUpdateVolumes,
    handleUpdatePans,
    handleToggleMutes,
    handleToggleSolos,
    expandedMixerSource,
    setExpandedMixerSource
}: AudioMixerProps) => {
    const [volumes, setVolumes] = useState<{ [key: string]: number }>({});
    const [mutes, setMutes] = useState<{ [key: string]: boolean }>({});
    const [solos, setSolos] = useState<{ [key: string]: boolean }>({});
    const [pans, setPans] = useState<{ [key: string]: number }>({});
    const [popupIsOpen, setPopupIsOpen] = useState(false);

    useEffect(() => {
        if (universalSources) {
            const initialVolumes: { [key: string]: number } = {};
            const initialMutes: { [key: string]: boolean } = {};
            const initialSolos: { [key: string]: boolean } = {};
            const initialPans: { [key: string]: number } = {};
            Object.keys(universalSources).forEach((sourceKey: any) => {
                initialVolumes[sourceKey] = universalSources[sourceKey].masterVolume; // Default volume
                initialMutes[sourceKey] = universalSources[sourceKey].isMuted; // Default unmuted
                initialSolos[sourceKey] = universalSources[sourceKey].isSolo; // Default unmuted
                initialPans[sourceKey] = universalSources[sourceKey].masterPan; // Default pan
            });
            // Only update state when values actually change to avoid infinite re-renders
            const shallowEq = (a: any, b: any) => {
                if (a === b) return true;
                const aKeys = Object.keys(a || {});
                const bKeys = Object.keys(b || {});
                if (aKeys.length !== bKeys.length) return false;
                for (let k of aKeys) {
                    if (a[k] !== b[k]) return false;
                }
                return true;
            };

            if (!shallowEq(initialVolumes, volumes)) setVolumes(initialVolumes);
            if (!shallowEq(initialMutes, mutes)) setMutes(initialMutes);
            if (!shallowEq(initialSolos, solos)) setSolos(initialSolos);
            if (!shallowEq(initialPans, pans)) setPans(initialPans);
        }
    }, [universalSources]);

    const handleTogglePopup = () => {
        setPopupIsOpen(!popupIsOpen);
    };

    return (
        <Box
            sx={{
                position: 'absolute',
                bottom: window.innerHeight > 750 ? "13.5rem" : "1rem",
                left: "16px",
                zIndex: 9999,
                pointerEvents: 'auto',
                cursor: 'default',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: '4px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                // maxHeight: '300px',
                overflowY: 'auto',
            }}
        >
            <>
                <span 
                    onClick={handleTogglePopup}
                    style={{
                        position: 'absolute',
                        top: '4px',
                        right: '8px',
                        cursor: 'pointer',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        display: popupIsOpen ? 'block' : 'none',
                        color: SLATE_GRAY,
                        background: popupIsOpen ? 'rgba(0,0,0,0.078 )' : 'transparent',
                    }}
                ><CloseIcon /></span>
                {popupIsOpen
                    ? <>
                        <Typography variant="h6" sx={{ color: OBERHEIM_TEAL, mb: 1 }}>Audio Mixer</Typography>
                        {universalSources && Object.keys(universalSources).map((sourceKey) => (
                            <Box key={sourceKey} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <IconButton onClick={() => {
                                    const newMuteState = !mutes[sourceKey];
                                    setMutes({ ...mutes, [sourceKey]: newMuteState });
                                    handleToggleMutes(sourceKey);
                                }}>
                                    {mutes[sourceKey] ? <VolumeOff sx={{ color: NEON_PINK }} /> : <VolumeUp sx={{ color: OBERHEIM_TEAL }} />}
                                </IconButton>
                                {/* <IconButton onClick={() => {
                                    const newSoloState = !solos[sourceKey];
                                    setSolos({ ...solos, [sourceKey]: newSoloState });
                                    handleToggleSolos(sourceKey);
                                }}>
                                    {solos[sourceKey] ? <VolumeOff sx={{ color: NEON_PINK }} /> : <VolumeUp sx={{ color: OBERHEIM_TEAL }} />}
                                </IconButton> */}
                                <MixerSlider
                                    label={`${sourceKey} Gain`}
                                    value={volumes[sourceKey] ?? 50}
                                    onChange={(_, newValue) => {
                                        setVolumes({ ...volumes, [sourceKey]: newValue });
                                        handleUpdateVolumes(sourceKey, newValue);
                                    }}
                                    min={0}
                                    max={100}
                                    step={1}
                                    color={OBERHEIM_TEAL}
                                />
                                <MixerSlider
                                    label={`${sourceKey} Pan` }
                                    value={pans[sourceKey] ?? 0}
                                    onChange={(_, newValue) => {
                                        setPans({ ...pans, [sourceKey]: newValue });
                                        handleUpdatePans(sourceKey, newValue);
                                    }}
                                    min={-1}
                                    max={1}
                                    step={0.01}
                                    color={HERITAGE_GOLD}
                                />
                                <Button 
                                    size="small"
                                    sx={{
                                        rotate: "-90deg", 
                                    }}
                                    onClick={() => {
                                        setExpandedMixerSource(expandedMixerSource === sourceKey ? '' : sourceKey);
                                    }}
                                    variant="text">
                                    {/* Expand  */}
                                    {/* {` ${getExpandText(sourceKey)}`} */}
                                    {expandedMixerSource === sourceKey ? <ExpandLessIcon sx={{ color: OBERHEIM_TEAL }} /> : <ExpandMoreIcon sx={{ color: OBERHEIM_TEAL }} />}
                                </Button>
                            </Box>
                        ))} 
                    </>
                    : <></>
                }
            </>
            <Button 
                onClick={handleTogglePopup}
                sx={{
                    // marginTop: '8px',
                    width: '100%',
                    maxWidth: '120px',
                    backgroundColor: 'rgba(28,28,28,0.78)',
                    color: 'rgba(245,245,245,0.78)',
                    border: `1px solid ${OBERHEIM_TEAL}`,
                    display: popupIsOpen ? 'none' : 'block',
                    '&:hover': {
                        backgroundColor: OBERHEIM_TEAL,
                        color: 'rgba(28,28,28,0.78)',
                        border: `1px solid ${OBERHEIM_TEAL}`,
                    }
                }}
                variant="contained"
            >Mixer</Button>
        </Box>
    )
};
export default AudioMixer;