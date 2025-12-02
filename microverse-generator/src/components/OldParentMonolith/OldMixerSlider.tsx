import React from 'react';
import { HERITAGE_GOLD, OBERHEIM_TEAL } from '../../constants';
import { useTheme } from '@mui/material/styles';
import { Typography } from '@mui/material';

const MixerSlider = ({
    label,
    value,
    onChange,
    min = 0,
    max = 100,
    step = 1,
    color = OBERHEIM_TEAL
}: {
    label: string;
    value: number;
    onChange: (source: string, newValue: number) => void;
    min?: number;
    max?: number;
    step?: number;
    color?: string;
}) => {
    const theme = useTheme();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 10px' }}>
            <Typography variant="caption" style={{ marginBottom: 8, color: label.includes("Pan") ? HERITAGE_GOLD :  OBERHEIM_TEAL }}>
                {label}
            </Typography>
            <input
                type="range"
                min={min}
                max={max}
                
                step={step}
                value={value}
                onChange={(e) => onChange(label, Number(e.target.value))}
                style={{
                    WebkitAppearance: 'none',
                    width: '100px',
                    height: '8px',
                    borderRadius: '4px',
                    // background: theme.palette.mode === 'dark' ? '#555' : '#ccc',
                    outline: 'none',
                    opacity: 0.7,
                    transition: 'opacity .2s',
                    cursor: 'pointer',
                    // backgroundColor: label.includes("Pan") ? HERITAGE_GOLD : OBERHEIM_TEAL
                }}
            />
            <Typography variant="caption" style={{ marginTop: 8, color: label.includes("Pan") ? HERITAGE_GOLD : OBERHEIM_TEAL }}>
                {value}
            </Typography>
        </div>
    );
};

export { MixerSlider };