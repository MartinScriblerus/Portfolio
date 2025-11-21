import * as React from 'react';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import { useTheme } from '@mui/material';
import { useEffect } from 'react';

function valuetext(value: number) {
  return `${value}`;
}

const marks = [
    {
        value: 4,
        label: '4',
    },
    {
        value: 8,
        label: '8',
    },
    {
        value: 16,
        label: '16',
    },
    {
        value: 32,
        label: '32',
    },
    {
        value: 64,
        label: '64',
    }
  ];

interface SliderProps {
    handleOsc1RateUpdate: (val: any) => void;
    // handleOsc2RateUpdate: (val: any) => void;
    handleMasterFastestRate: (val: any) => void;
    handleStkRateUpdate: (val: any) => void;
    handleSamplerRateUpdate: (val: any) => void;
    handleAudioInRateUpdate: (val: any) => void;
    vizSource:string;
    filesToProcess: any[];
    currentNoteVals: any;
}

export default function DiscreteSlider(props: SliderProps) {
    const theme = useTheme();
    const {
        handleOsc1RateUpdate,
        // handleOsc2RateUpdate,
        handleMasterFastestRate, 
        handleStkRateUpdate, 
        handleSamplerRateUpdate, 
        handleAudioInRateUpdate,
        currentNoteVals,
        filesToProcess,
        vizSource,
    } = props;

    return (
    <Box style={{
        display: 'flex',
        height: '72px',
        fontSize: '13px',
        flexDirection: 'row',
        width: '100%',
    }}>
        {
        vizSource && vizSource.includes("osc1") 
        ?
            <Box className={'pattern-rate-title'}>
                Oscillator:
                <Slider
                    aria-label="OscRate"
                    value={currentNoteVals.osc1[0]}
                    getAriaValueText={valuetext}
                    valueLabelDisplay="auto"
                    step={null}
                    sx={{color: 'rgba(245,245,245,0.78)'}}
                    onChange={handleOsc1RateUpdate}
                    marks={marks}
                    min={1}
                    max={64}
                    color="secondary"
                />
            </Box>
        :
            <></>
        }
        {/* {
        vizSource && vizSource.includes("osc2") 
        ?
            <Box className={'pattern-rate-title'}>
                Oscillator (Mono):
                <Slider
                    aria-label="OscRate"
                    value={currentNoteVals.osc2[0]}
                    getAriaValueText={valuetext}
                    valueLabelDisplay="auto"
                    step={null}
                    sx={{color: 'rgba(245,245,245,0.78)'}}
                    onChange={handleOsc2RateUpdate}
                    marks={marks}
                    min={1}
                    max={64}
                    color="secondary"
                />
            </Box>
        :
            <></>
        } */}
        {
        vizSource && vizSource.includes("stk") 
        ?
            <Box className={'pattern-rate-title'}>
                Instrument:
                <Slider
                    aria-label="StkRate"
                    value={currentNoteVals.stks[0]} //
                    getAriaValueText={valuetext}
                    valueLabelDisplay="auto"
                    step={null}
                    sx={{color: 'rgba(245,245,245,0.78)'}}
                    onChange={handleStkRateUpdate}
                    marks={marks}
                    min={1}
                    max={64}
                />
            </Box>
        : 
            <></>
        }
        {
        vizSource && vizSource.includes("sample") 
        ?
            <Box className={'pattern-rate-title'}>
                Sampler: 
                <Slider
                    aria-label="SamplerRate"
                    value={currentNoteVals.samples[0]}
                    getAriaValueText={valuetext}
                    valueLabelDisplay="auto"
                    step={null}
                    sx={{color: 'rgba(245,245,245,0.78)'}}
                    onChange={handleSamplerRateUpdate}
                    marks={marks}
                    min={1}
                    max={64}
                />
            </Box>
        :
            <></>
        }
        {
        vizSource && vizSource.includes("audioin") 
        ?
            <Box className={'pattern-rate-title'}
            >
                Line In: 
                <Slider
                    aria-label="AudioInRate"
                    value={currentNoteVals.linesIn[0]}
                    getAriaValueText={valuetext}
                    valueLabelDisplay="auto"
                    step={null}
                    sx={{color: 'rgba(245,245,245,0.78)'}}
                    onChange={handleAudioInRateUpdate}
                    marks={marks}
                    min={1}
                    max={64}
                />
            </Box>
        :
            <></>
    }
    </Box>
  );
}
