'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Slider, Box, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { moogGrandmotherEffects, chuckRef as globalChuckRef } from '../../app/state/refs';
import type { MoogGrandmotherEffectsItem } from '../interfaces/audioInterfaces';

interface SynthControlPanelProps {
    open: boolean;
    onClose: () => void;
}

export default function SynthControlPanel({ open, onClose }: SynthControlPanelProps) {
    const [values, setValues] = useState<Record<string, number>>({});
    const moogRef = moogGrandmotherEffects as React.MutableRefObject<any>;
    const chuckRef = globalChuckRef as React.MutableRefObject<any>;
    const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize values from moogGrandmotherEffects on open
    useEffect(() => {
        if (open && moogRef.current) {
            const initialValues: Record<string, number> = {};
            Object.entries(moogRef.current).forEach(([key, item]: [string, any]) => {
                if (item && typeof item === 'object' && 'value' in item) {
                    initialValues[key] = item.value ?? item.min ?? 0;
                }
            });
            setValues(initialValues);
        }
    }, [open, moogRef]);

    // Update ChucK when values change (debounced)
    useEffect(() => {
        if (!open || !chuckRef.current || Object.keys(values).length === 0) return;

        // Clear existing timeout
        if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
        }

        // Debounce updates to avoid flooding ChucK
        updateTimeoutRef.current = setTimeout(async () => {
            try {
                // Update moogGrandmotherEffects ref
                Object.entries(values).forEach(([key, value]) => {
                    if (moogRef.current && moogRef.current[key]) {
                        moogRef.current[key].value = value;
                    }
                });

                // Update ChucK global moogGMDefaults array
                for (const [key, value] of Object.entries(values)) {
                    // Map parameter names to ChucK array keys
                    const chuckKey = key;
                    
                    // Update ChucK associative float array
                    await chuckRef.current.setAssociativeFloatArrayValue(
                        'moogGMDefaults',
                        chuckKey,
                        value
                    );
                }

                // Broadcast update event to trigger parameter refresh in ChucK
                await chuckRef.current.broadcastEvent('fxUpdate');
                
                console.log('[SynthControlPanel] Updated ChucK parameters:', values);
            } catch (err) {
                console.error('[SynthControlPanel] Failed to update ChucK:', err);
            }
        }, 50); // 50ms debounce

        return () => {
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }
        };
    }, [values, open, chuckRef, moogRef]);

    const handleSliderChange = (key: string) => (_event: Event, newValue: number | number[]) => {
        const value = Array.isArray(newValue) ? newValue[0] : newValue;
        setValues(prev => ({ ...prev, [key]: value }));
    };

    const renderControl = (key: string, item: MoogGrandmotherEffectsItem) => {
        if (!item || typeof item !== 'object') return null;

        const currentValue = values[key] ?? item.value ?? item.min ?? 0;
        const min = item.min ?? 0;
        const max = item.max ?? 100;
        const label = item.label || item.name || key;

        // Handle switch-style controls (oscType1, oscType2, lfoVoice)
        if (item.screenInterface?.includes('switch')) {
            const options = item.screenInterface.split('_').slice(2); // Extract options from "switch_4_disabled_tri_saw_square"
            const step = max / (options.length - 1);

            return (
                <Box key={key} sx={{ mb: 2 }}>
                    <Box sx={{ mb: 1, display: 'inline-flex', flexDirection: 'row', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 1.0)' }}>
                        {/* {label} */}
                        <Box sx={{ mt: 0.5, display: 'block', color: 'rgba(255, 255, 255, 1.0)' }}>
                           {label} : {options[Math.round(currentValue / step)] || currentValue.toFixed(0)}
                    </Box>
                    </Box>
                    <Slider
                        value={currentValue}
                        min={min}
                        max={max}
                        step={step}
                        marks={options.map((opt: string, idx: number) => ({
                            value: idx * step,
                            label: opt.charAt(0).toUpperCase() + opt.slice(1)
                        }))}
                        onChange={handleSliderChange(key)}
                        aria-label={label}
                        sx={{ 
                            width: '100%', 
                            fontSize: '10px',
                            '& .MuiSlider-thumb': {
                                width: 14,
                                height: 14,
                               fontSize: '10px',
                            },
                            '& .MuiSlider-valueLabel': {
                                color: 'rgba(255,255,255,1.0)',
                                fontSize: '10px',
                            },
                            '& .MuiSlider-markLabel': {
                                color: 'rgba(255,255,255,1.0)',
                                fontSize: '10px',
                            }
                        }}
                    />
                    {/* <Box sx={{ mt: 0.5, display: 'block', color: 'rgba(255, 255, 255, 1.0)' }}>
                        {options[Math.round(currentValue / step)] || currentValue.toFixed(0)}
                    </Box> */}
                </Box>
            );
        }

        // Regular knob/slider controls
        return (
            <Box key={key} sx={{ mb: 2 }}>
                <Box sx={{ mb: 1, fontSize: '0.875rem', color: 'rgba(255, 255, 255, 1.0)' }}>
                    {label}
                </Box>
                <Slider
                    value={currentValue}
                    min={min}
                    max={max}
                    step={max > 100 ? 1 : 0.01}
                    onChange={handleSliderChange(key)}
                    aria-label={label}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(val) => val.toFixed(max > 100 ? 0 : 2)}
                    sx={{ width: '100%' }}
                />
            </Box>
        );
    };

    if (!moogRef.current) {
        return null;
    }

    // Group parameters logically
    const oscillatorParams = ['oscType1', 'oscType2', 'detune', 'oscOffset', 'offset', 'noise'];
    const filterParams = ['cutoff', 'rez', 'env', 'cutoffMod'];
    const lfoParams = ['lfoVoice', 'lfoFreq', 'pitchMod'];
    const adsrParams = ['adsrAttack', 'adsrDecay', 'adsrSustain', 'adsrRelease'];
    const limiterParams = ['limiterAttack', 'limiterThreshold'];
    const otherParams = ['highPassFreq'];

    const getParams = (keys: string[]) => {
        return keys
            .filter(key => moogRef.current[key])
            .map(key => [key, moogRef.current[key]] as [string, MoogGrandmotherEffectsItem]);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    backgroundColor: 'rgba(26, 28, 32, 0.95)',
                    color: 'rgba(255, 255, 255, 1.0)',
                    borderRadius: 2,
                    maxHeight: '300px',
                    // marginTop: '200px',
                    width: '100vw',
                    maxWidth: '360px',
                    alignSelf: 'flex-start',
                    top: '80px',
                }
            }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                <Box>
                    Oscillator Synth Controls
                </Box>
                <IconButton 
                    onClick={onClose} 
                    size="small" 
                    sx={{ color: 'rgba(255, 255, 255, 1.0)' }}
                    aria-label="Close oscillator synth controls"
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent 
                sx={{ 
                    pt: 2, 
                    color: 'rgba(255,255,255,1.0)', 
                }}>
                <Box sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 3, 
                }}>
                    {/* Oscillators */}
                    <Box sx={{ flex:'1 1 calc(50% - 12px)', minWidth: 0 }}>
                        <Box sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                            Oscillators
                        </Box>
                        {getParams(oscillatorParams).map(([key, item]) => renderControl(key, item))}
                    </Box>

                    {/* Filter */}
                    <Box sx={{ flex: '1 1 calc(50% - 12px)', minWidth: 0 }}>
                        <Box sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                            Filter
                        </Box>
                        {getParams(filterParams).map(([key, item]) => renderControl(key, item))}
                    </Box>

                    {/* LFO */}
                    <Box sx={{ flex: '1 1 calc(50% - 12px)', minWidth: 0 }}>
                        <Box sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                            LFO
                        </Box>
                        {getParams(lfoParams).map(([key, item]) => renderControl(key, item))}
                    </Box>

                    {/* ADSR Envelope */}
                    <Box sx={{ flex: '1 1 calc(50% - 12px)', minWidth: 0 }}>
                        <Box sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                            ADSR Envelope
                        </Box>
                        {getParams(adsrParams).map(([key, item]) => renderControl(key, item))}
                    </Box>

                    {/* Limiter */}
                    <Box sx={{ flex: '1 1 calc(50% - 12px)', minWidth: 0 }}>
                        <Box sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                            Limiter
                        </Box>
                        {getParams(limiterParams).map(([key, item]) => renderControl(key, item))}
                    </Box>

                    {/* Other */}
                    <Box sx={{ flex: '1 1 calc(50% - 12px)', minWidth: 0 }}>
                        <Box sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                            Other
                        </Box>
                        {getParams(otherParams).map(([key, item]) => renderControl(key, item))}
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button 
                    onClick={onClose} 
                    variant="outlined" 
                    sx={{ color: 'rgba(255, 255, 255, 1.0)', borderColor: 'divider' }}
                    aria-label="Close oscillator synth controls"
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}


