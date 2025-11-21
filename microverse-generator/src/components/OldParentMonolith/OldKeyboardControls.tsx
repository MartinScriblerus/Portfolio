import { Box, FormLabel, SelectChangeEvent, useTheme } from '@mui/material';
import React, { useState } from 'react';
import { KeyboardProps } from '../../interfaces/audioTypes';

const KeyboardControls = (
   {        
        chuckHook,
    }
    : KeyboardProps
) => {


    return (
        <Box 
            sx={{
                color: `rgba(28,28,28,0.78) !important`, 
                flexDirection: 'row',
                justifyContent: 'left',
                alignItems: 'left',
                // display: chuckHook ? 'flex': 'none',
                display: 'flex',
                fontFamily: 'monospace',
            }}>
        </Box>
    )
}
export default KeyboardControls;