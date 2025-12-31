'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Slider,
    Box,
    Typography,
    IconButton,
    Tabs,
    Tab,
    Switch,
    FormControlLabel,
    Chip,
    Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { universalSources, chuckRef as globalChuckRef } from '../../app/state/refs';
import type { Sources, EffectsSettings } from '../interfaces/audioTypes';
import { defaultAudioInSettings } from '../utils/audioInSettingsHelper';
import { BoxParticleEmitter } from 'babylonjs';

interface EffectsControlPanelProps {
    open: boolean;
    onClose: () => void;
    sourceName: keyof Sources;
}

// Effect groups for organization
const EFFECT_GROUPS = {
    'Gain / Distortion': ['Gain', 'Bitcrusher', 'FoldbackSaturator'],
    'Delays / Echos': ['Delay', 'DelayA', 'DelayL', 'Echo', 'ExpDelay'],
    'Chorus / Mods / Pans': ['Chorus', 'Modulate', 'PitShift', 'AmbPan3'],
    'Reverbs': ['JCRev', 'NRev', 'PRCRev', 'GVerb'],
    'ADSRs': ['PowerADSR'],
    'Filters': ['Elliptic', 'KasFilter', 'WPDiodeLadder', 'WPKorg35'],
    'Pitch Trackers': ['PitchTrack', 'Sigmund'],
    'Envelopes': ['WinFuncEnv', 'ExpEnv'],
    'Buffers': ['SndBuf', 'LiSa'],
    'Other': ['Spectacle', 'Multicomb'],
    'Audio-In Effects': ['GrainStretch', 'Tape', 'RandomReverse', 'Reich', 'LisaTrigger', 'AsymptoticChopper']
};

export default function EffectsControlPanel({ open, onClose, sourceName }: EffectsControlPanelProps) {
    const [tabValue, setTabValue] = useState(0);
    const [selectedEffect, setSelectedEffect] = useState<string | null>(null);
    const [effectValues, setEffectValues] = useState<Record<string, Record<string, number>>>({});
    const chuckRef = globalChuckRef as React.MutableRefObject<any>;
    const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const sourcesRef = universalSources as React.MutableRefObject<Sources | undefined>;

    // Get all effects for the source
    const allEffects = useMemo(() => {
        if (!sourcesRef.current?.[sourceName]?.effects) return [];
        return Object.entries(sourcesRef.current[sourceName].effects);
    }, [sourceName, sourcesRef.current]);

    // Get audio-in effects (these are separate, controlled via audioInSettingsHelperHash)
    const audioInEffects = useMemo(() => {
        return [
            { 
                key: 'GrainStretch', 
                name: 'Grain Stretch', 
                presets: Object.keys(defaultAudioInSettings)
                    .filter(k => k.startsWith('grain_'))
                    .map(k => ({ name: k, value: defaultAudioInSettings[k as keyof typeof defaultAudioInSettings] }))
            },
            { 
                key: 'Tape', 
                name: 'Tape', 
                presets: Object.keys(defaultAudioInSettings)
                    .filter(k => k.startsWith('tape_'))
                    .map(k => ({ name: k, value: defaultAudioInSettings[k as keyof typeof defaultAudioInSettings] }))
            },
            { 
                key: 'RandomReverse', 
                name: 'Random Reverse', 
                presets: Object.keys(defaultAudioInSettings)
                    .filter(k => k.startsWith('random_reverse_'))
                    .map(k => ({ name: k, value: defaultAudioInSettings[k as keyof typeof defaultAudioInSettings] }))
            },
            { 
                key: 'Reich', 
                name: 'Reich (Clapping)', 
                presets: Object.keys(defaultAudioInSettings)
                    .filter(k => k.startsWith('clapping_'))
                    .map(k => ({ name: k, value: defaultAudioInSettings[k as keyof typeof defaultAudioInSettings] }))
            },
            { 
                key: 'LisaTrigger', 
                name: 'Lisa Trigger', 
                presets: Object.keys(defaultAudioInSettings)
                    .filter(k => k.startsWith('lisa_trigger_'))
                    .map(k => ({ name: k, value: defaultAudioInSettings[k as keyof typeof defaultAudioInSettings] }))
            },
            { 
                key: 'AsymptoticChopper', 
                name: 'Asymptotic Chopper', 
                presets: Object.keys(defaultAudioInSettings)
                    .filter(k => k.startsWith('asymptotic_chopper_'))
                    .map(k => ({ name: k, value: defaultAudioInSettings[k as keyof typeof defaultAudioInSettings] }))
            }
        ];
    }, []);

    // Initialize effect values on open
    useEffect(() => {
        if (!open || !sourcesRef.current?.[sourceName]?.effects) return;

        const initialValues: Record<string, Record<string, number>> = {};
        
        // Universal effects
        allEffects.forEach(([key, fx]) => {
            if (fx.presets) {
                initialValues[key] = {};
                Object.values(fx.presets).forEach((preset: any) => {
                    if (preset && typeof preset === 'object' && 'value' in preset) {
                        initialValues[key][preset.name] = preset.value ?? preset.min ?? 0;
                    }
                });
            }
        });

        // Audio-in effects
        audioInEffects.forEach(({ key, presets }) => {
            initialValues[key] = {};
            presets.forEach(({ name, value }) => {
                initialValues[key][name] = value;
            });
        });

        setEffectValues(initialValues);
    }, [open, sourceName, allEffects, audioInEffects]);

    // Update ChucK when values change (debounced)
    useEffect(() => {
        if (!open || !chuckRef.current || Object.keys(effectValues).length === 0) return;

        updateTimeoutRef.current = setTimeout(async () => {
            try {
                // Update universal effects
                for (const [effectKey, params] of Object.entries(effectValues)) {
                    const sourceEffects = sourcesRef.current?.[sourceName]?.effects;
                    if (!sourceEffects) continue;
                    const fx = (sourceEffects as Record<string, EffectsSettings>)[effectKey];
                    if (!fx) continue;

                    for (const [paramName, value] of Object.entries(params)) {
                        const varName = `${fx.VarName}_${sourceName}`;
                        const arrayKey = `${varName}_${paramName}`;
                        
                        // Determine if it's int or float
                        const preset = fx.presets?.find((p: any) => p.name === paramName);
                        if (!preset) continue;

                        const isInt = preset.type?.includes('int');
                        const arrayName = isInt ? 'allFXDynamicInts' : 'allFXDynamicFloats';
                        
                        await chuckRef.current.setAssociativeFloatArrayValue(
                            arrayName,
                            arrayKey,
                            value
                        );
                    }
                }

                // Update audio-in effects
                for (const [effectKey, params] of Object.entries(effectValues)) {
                    if (audioInEffects.some(e => e.key === effectKey)) {
                        for (const [paramName, value] of Object.entries(params)) {
                            await chuckRef.current.setAssociativeFloatArrayValue(
                                'audioInSettingsHelperHash',
                                paramName,
                                value
                            );
                        }
                    }
                }

                // Broadcast update event
                await chuckRef.current.broadcastEvent('fxUpdate');
            } catch (err) {
                console.error('[EffectsControlPanel] Failed to update ChucK:', err);
            }
        }, 50);

        return () => {
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }
        };
    }, [effectValues, open, chuckRef, sourceName]);

    const handleToggleEffect = (effectKey: string) => {
        const sourceEffects = sourcesRef.current?.[sourceName]?.effects;
        if (!sourceEffects) return;
        const fx = (sourceEffects as Record<string, EffectsSettings>)[effectKey];
        if (fx) {
            fx.On = !fx.On;
            // Trigger re-render by updating state
            setEffectValues({ ...effectValues });
        }
    };

    const handleSliderChange = (effectKey: string, paramName: string) => 
        (_event: Event, newValue: number | number[]) => {
            const value = Array.isArray(newValue) ? newValue[0] : newValue;
            setEffectValues(prev => ({
                ...prev,
                [effectKey]: {
                    ...prev[effectKey],
                    [paramName]: value
                }
            }));
        };

    const renderEffectControl = (effectKey: string, fx: EffectsSettings | undefined) => {
        if (!fx) return null;

        const isOn = fx.On ?? false;
        const presets = fx.presets || [];
        const currentValues = effectValues[effectKey] || {};

        return (
            <Box
                key={effectKey}
                sx={{
                    p: 1.5,
                    border: `1px solid ${isOn ? 'rgba(0, 217, 255, 0.4)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 1,
                    backgroundColor: isOn ? 'rgba(0, 217, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Box
                        sx={{ 
                            fontWeight: 600, 
                            color: isOn ? '#F5F7FA' : 'rgba(255, 255, 255, 0.6)',
                            fontSize: '0.875rem',
                            lineHeight: 1.2
                        }}
                    >
                        {fx.Type || effectKey}
                    </Box>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={isOn}
                                onChange={() => handleToggleEffect(effectKey)}
                                size="small"
                                aria-label={`Toggle ${fx.Type || effectKey} effect ${isOn ? 'off' : 'on'}`}
                            />
                        }
                        label={isOn ? 'ON' : 'OFF'}
                        sx={{ 
                            m: 0,
                            '& .MuiFormControlLabel-label': {
                                fontSize: '0.75rem',
                                color: isOn ? '#F5F7FA' : 'rgba(255, 255, 255, 0.5)',
                            }
                        }}
                    />
                </Box>

                {isOn && presets.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                        {presets.map((preset: any) => {
                            if (!preset || typeof preset !== 'object') return null;
                            const currentValue = currentValues[preset.name] ?? preset.value ?? preset.min ?? 0;
                            const min = preset.min ?? 0;
                            const max = preset.max ?? 100;
                            const label = preset.label || preset.name || '';

                            return (
                                <Box key={preset.name} sx={{ mb: 1.5 }}>
                                    <Box
                                        sx={{ 
                                            mb: 0.5, 
                                            fontSize: '0.75rem', 
                                            color: 'rgba(255, 255, 255, 0.8)',
                                            lineHeight: 1.2
                                        }}
                                    >
                                        {label}
                                    </Box>
                                    <Slider
                                        value={currentValue}
                                        min={min}
                                        max={max}
                                        step={max > 100 ? 1 : 0.01}
                                        onChange={handleSliderChange(effectKey, preset.name)}
                                        valueLabelDisplay="auto"
                                        valueLabelFormat={(val) => val.toFixed(max > 100 ? 0 : 2)}
                                        sx={{ 
                                            width: '100%',
                                            '& .MuiSlider-thumb': {
                                                width: 14,
                                                height: 14,
                                            },
                                            '& .MuiSlider-valueLabel': {
                                                backgroundColor: 'rgba(0, 217, 255, 0.9)',
                                                color: '#000',
                                                fontSize: '0.7rem',
                                            }
                                        }}
                                        aria-label={`${label} slider for ${fx.Type || effectKey}, current value ${currentValue.toFixed(max > 100 ? 0 : 2)}`}
                                    />
                                </Box>
                            );
                        })}
                    </Box>
                )}
            </Box>
        );
    };

    const renderAudioInEffect = (effect: typeof audioInEffects[0]) => {
        const currentValues = effectValues[effect.key] || {};

        return (
            <Box
                key={effect.key}
                sx={{
                    p: 1.5,
                    border: '1px solid rgba(0, 217, 255, 0.3)',
                    borderRadius: 1,
                    backgroundColor: 'rgba(0, 217, 255, 0.08)',
                }}
            >
                <Box
                    sx={{ 
                        fontWeight: 600, 
                        mb: 0.5, 
                        color: '#F5F7FA',
                        fontSize: '0.875rem',
                        lineHeight: 1.2
                    }}
                >
                    {effect.name}
                </Box>
                <Box
                    sx={{ 
                        color: 'rgba(255, 255, 255, 0.6)', 
                        mb: 1, 
                        display: 'block',
                        fontSize: '0.7rem',
                        lineHeight: 1.2
                    }}
                >
                    Audio input processing effect
                </Box>
                {effect.presets.map(({ name, value: defaultValue }) => {
                    const currentValue = currentValues[name] ?? defaultValue;
                    // Determine min/max from parameter name (heuristic)
                    const isRate = name.includes('rate');
                    const isLength = name.includes('length') || name.includes('duration');
                    const min = isRate ? -2000 : isLength ? 0 : 0;
                    const max = isRate ? 2000 : isLength ? 10000 : 1000;
                    
                    return (
                        <Box key={name} sx={{ mb: 1.5 }}>
                            <Box
                                sx={{ 
                                    mb: 0.5, 
                                    fontSize: '0.75rem', 
                                    color: 'rgba(255, 255, 255, 0.8)',
                                    lineHeight: 1.2
                                }}
                            >
                                {name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Box>
                            <Slider
                                value={currentValue}
                                min={min}
                                max={max}
                                step={max > 1000 ? 1 : 0.01}
                                onChange={handleSliderChange(effect.key, name)}
                                valueLabelDisplay="auto"
                                valueLabelFormat={(val) => val.toFixed(max > 1000 ? 0 : 2)}
                                sx={{ 
                                    width: '100%',
                                    '& .MuiSlider-thumb': {
                                        width: 14,
                                        height: 14,
                                    },
                                    '& .MuiSlider-valueLabel': {
                                        backgroundColor: 'rgba(0, 217, 255, 0.9)',
                                        color: '#000',
                                        fontSize: '0.7rem',
                                    }
                                }}
                            />
                        </Box>
                    );
                })}
            </Box>
        );
    };

    // Group effects by category
    const groupedEffects = useMemo(() => {
        const groups: Record<string, Array<[string, EffectsSettings]>> = {};
        
        allEffects.forEach(([key, fx]) => {
            let found = false;
            for (const [groupName, effectTypes] of Object.entries(EFFECT_GROUPS)) {
                if (effectTypes.includes(fx.Type)) {
                    if (!groups[groupName]) groups[groupName] = [];
                    groups[groupName].push([key, fx]);
                    found = true;
                    break;
                }
            }
            if (!found) {
                if (!groups['Other']) groups['Other'] = [];
                groups['Other'].push([key, fx]);
            }
        });

        return groups;
    }, [allEffects]);

    const tabLabels = Object.keys(groupedEffects).filter(group => groupedEffects[group].length > 0);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            PaperProps={{
                sx: {
                    position: 'fixed',
                    top: '10px', // Below AskPanel (which is at top: 16, height ~64px)
                    right: '16px', // Align with AskPanel
                    left: 'auto', // Override default centering
                    margin: 0,
                    width: '380px', // Match AskPanel width for consistency
                    maxWidth: '380px',
                    maxHeight: 'calc(100vh - 100px)', // Leave space for top/bottom
                    backgroundColor: 'rgba(26, 28, 32, 0.98)',
                    color: '#F5F7FA',
                    borderRadius: 2,
                    zIndex: 10040, // Below AskPanel (10050) but above most content
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                }
            }}
            sx={{
                '& .MuiBackdrop-root': {
                    backgroundColor: 'transparent', // No backdrop overlay
                }
            }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, pt: 2 }}>
                <Box
                    sx={{ 
                        fontWeight: 600, 
                        color: '#F5F7FA',
                        fontSize: '1rem',
                        lineHeight: 1.2
                    }}
                >
                    Effects: {sourceName.toUpperCase()}
                </Box>
                <IconButton 
                    onClick={onClose} 
                    size="small" 
                    sx={{ 
                        color: '#F5F7FA',
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        }
                    }}
                    aria-label="Close effects control panel"
                >
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 1, pb: 1, px: 2, display: 'flex', flexDirection: 'column' }}>
                <Tabs
                    value={tabValue}
                    onChange={(_, newValue) => setTabValue(newValue)}
                    sx={{ 
                        mb: 1.5, 
                        borderBottom: 1, 
                        borderColor: 'rgba(255, 255, 255, 0.12)',
                        minHeight: '36px',
                        flexShrink: 0, // Prevent tabs from shrinking
                        position: 'sticky',
                        top: 0,
                        backgroundColor: 'rgba(26, 28, 32, 0.98)', // Match dialog background
                        zIndex: 1,
                        '& .MuiTab-root': {
                            minHeight: '36px',
                            fontSize: '0.75rem',
                            color: 'rgba(255, 255, 255, 0.7)',
                            textTransform: 'none',
                            '&.Mui-selected': {
                                color: '#F5F7FA',
                            }
                        },
                        '& .MuiTabs-indicator': {
                            backgroundColor: 'rgba(0, 217, 255, 0.8)',
                        }
                    }}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    {tabLabels.map((label, idx) => (
                        <Tab key={label} label={label} />
                    ))}
                    <Tab label="Audio-In" />
                </Tabs>
                
                <Box sx={{ overflow: 'auto', flex: 1, minHeight: 0 }}>
                    {tabValue < tabLabels.length && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {groupedEffects[tabLabels[tabValue]]?.map(([key, fx]) => (
                                <Box key={key}>
                                    {renderEffectControl(key, fx)}
                                </Box>
                            ))}
                        </Box>
                    )}

                    {tabValue === tabLabels.length && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {audioInEffects.map(effect => (
                                <Box key={effect.key}>
                                    {renderAudioInEffect(effect)}
                                </Box>
                            ))}
                        </Box>
                    )}
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 2, pb: 1.5, pt: 1 }}>
                <Button 
                    onClick={onClose} 
                    variant="outlined" 
                    size="small"
                    sx={{ 
                        color: '#F5F7FA', 
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        fontSize: '0.75rem',
                        '&:hover': {
                            borderColor: 'rgba(255, 255, 255, 0.4)',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        }
                    }}
                    aria-label="Close effects control panel"
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}

