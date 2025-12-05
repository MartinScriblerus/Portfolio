import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, IconButton, Slider, Typography } from '@mui/material';
import VolumeUp from '@mui/icons-material/VolumeUp';
import VolumeOff from '@mui/icons-material/VolumeOff';
import { ACCESSIBLE_COLORS } from '../../utils/accessibilityColors';
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

    // Source display names
    const sourceLabels: { [key: string]: string } = {
        osc1: 'Osc Synth',
        stk1: 'STK',
        sampler: 'Sampler',
        audioin: 'Audio In'
    };

    return (
        <Box
            sx={{
                width: '100%',
                pointerEvents: 'auto',
                cursor: 'default',
                backgroundColor: 'var(--color-dominant-surface, rgba(26,28,32,0.95))',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--color-tertiary-muted, rgba(74,85,104,0.5))',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            }}
        >
            <Typography variant="h6" sx={{ 
                color: 'var(--color-subdominant-primary, #00D9FF)', 
                mb: 2,
                fontSize: '16px',
                fontWeight: 600
            }}>
                Audio Mixer
            </Typography>
            {universalSources && Object.keys(universalSources).map((sourceKey) => (
                <Box 
                    key={sourceKey} 
                    sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'flex-start', 
                        mb: 3,
                        padding: '12px',
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        borderRadius: '6px',
                        border: '1px solid var(--color-tertiary-muted, rgba(74,85,104,0.3))',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ 
                            color: 'var(--color-dominant-text, #F5F7FA)', 
                            minWidth: '100px',
                            fontSize: '14px',
                            fontWeight: 500
                        }}>
                            {sourceLabels[sourceKey] || sourceKey}
                        </Typography>
                        <IconButton 
                            size="small"
                            onClick={() => {
                                const newMuteState = !mutes[sourceKey];
                                setMutes({ ...mutes, [sourceKey]: newMuteState });
                                handleToggleMutes(sourceKey);
                            }}
                            sx={{
                                marginLeft: 'auto',
                                color: mutes[sourceKey] 
                                    ? 'var(--color-subdominant-secondary, #FF6B9D)' 
                                    : 'var(--color-subdominant-primary, #00D9FF)'
                            }}
                        >
                            {mutes[sourceKey] ? <VolumeOff /> : <VolumeUp />}
                        </IconButton>
                    </Box>
                    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Box>
                            <Typography variant="caption" sx={{ 
                                color: 'var(--color-dominant-text, rgba(245,247,250,0.8))',
                                fontSize: '11px',
                                display: 'block',
                                mb: 0.5
                            }}>
                                Volume
                            </Typography>
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
                                color={ACCESSIBLE_COLORS.subdominant.primary}
                            />
                        </Box>
                        <Box>
                            <Typography variant="caption" sx={{ 
                                color: 'var(--color-dominant-text, rgba(245,247,250,0.8))',
                                fontSize: '11px',
                                display: 'block',
                                mb: 0.5
                            }}>
                                Pan
                            </Typography>
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
                                color={ACCESSIBLE_COLORS.tertiary.warning}
                            />
                        </Box>
                    </Box>
                </Box>
            ))} 
        </Box>
    )
};
export default AudioMixer;