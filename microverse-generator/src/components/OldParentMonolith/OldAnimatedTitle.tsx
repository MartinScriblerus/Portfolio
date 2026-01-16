import { IVORY_WHITE, CORDUROY_RUST, HERITAGE_GOLD, OBERHEIM_TEAL, NEON_PINK } from '../../constants';
import { shuffleArray } from '../../utils/FXHelpers/helperDefaults';
import { Box, Button } from '@mui/material';
import React, {useEffect, useState} from 'react';

type AnimTitleProps = {
    clickedBegin: boolean;
}

export const AnimatedTitle = (props: AnimTitleProps) => {
    const { clickedBegin } = props;
    const colorOptions = [
       OBERHEIM_TEAL,
        NEON_PINK,
        HERITAGE_GOLD,
        CORDUROY_RUST,
        IVORY_WHITE,
    ];
    const [randomizeColors, setRandomizeColors] = useState(colorOptions);
    
    useEffect(() => {
        if (clickedBegin) return;

        let intervalId: ReturnType<typeof setInterval> | null = null;

        if (!clickedBegin) {
            intervalId = setInterval(() => {
            setRandomizeColors(prev => shuffleArray(prev));
            }, 1000);
        }

        return () => {
            if (intervalId !== null) {
            clearInterval(intervalId);
            }
        };
    }, [clickedBegin]);
    
    
    return (
        <Box sx={{fontSize: "4rem !important", width: "100%", padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
            <Box sx={{fontSize: "14px !important"}}> *** Work in progress — Try the working Hydra Controls now & check back soon for AI and Audio updates! ***</Box>
            <h1 style={{top: "0px"}}>
                <span
                    style={{
                        color: randomizeColors[0],
                        textShadow: '0 0 10px rgba(255,255,255,0.5)',
                    }}>S
                </span>
                <span
                    style={{
                        color: randomizeColors[1],
                        textShadow: '0 0 10px rgba(255,255,255,0.5)',
                    }}
                >o</span>
                <span
                    style={{
                        color: randomizeColors[2],
                        textShadow: '0 0 10px rgba(255,255,255,0.5)',
                    }}
                >u</span>
                                                        <span
                    style={{
                        color: randomizeColors[3],
                        textShadow: '0 0 10px rgba(255,255,255,0.5)',
                    }}
                >n</span>
                                                        <span
                    style={{
                        color: randomizeColors[4],
                        textShadow: '0 0 10px rgba(255,255,255,0.5)',
                    }}
                >d</span>
                                                        <span
                    style={{
                        color: randomizeColors[0],
                        textShadow: '0 0 10px rgba(255,255,255,0.5)',
                    }}
                >S</span>
                                                        <span
                    style={{
                        color: randomizeColors[1],
                        textShadow: '0 0 10px rgba(255,255,255,0.5)',
                    }}
                >i</span>
                                                        <span
                    style={{
                        color: randomizeColors[2],
                        textShadow: '0 0 10px rgba(255,255,255,0.5)',
                    }}
                >n</span>
                                                        <span
                    style={{
                        color: randomizeColors[3],
                        textShadow: '0 0 10px rgba(255,255,255,0.5)',
                    }}
                >k</span>
            </h1>
        </Box>
    )
}