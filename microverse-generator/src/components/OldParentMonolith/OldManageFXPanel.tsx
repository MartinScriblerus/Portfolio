import React from 'react';
import { Box, Button } from '@mui/material';
import { NEON_PINK, CORDUROY_RUST, OBERHEIM_TEAL } from '../../constants';

interface Props {
  stkValues: Array<{ label: string }>;
  selectedEffects: string[];
  handleViewSTK: (e: any) => void;
  handleViewEffect: (e: any) => void;
}

export default function OldManageFXPanel({
  stkValues,
  selectedEffects,
  handleViewSTK,
  handleViewEffect,
}: Props) {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: '60px',
        left: '32px',
        width: '300px',
        backgroundColor: 'rgba(0,0,0,0.78)',
        padding: '8px',
        borderRadius: '4px',
        zIndex: '9999',
        display: 'flex',
        flexDirection: 'row',
      }}
    >
      <Box
        id={`activeSTKsManagerDropdown`}
        sx={{
          width: '140px',
          display: 'flex',
          flexDirection: 'column',
          marginRight: '4px',
          overflowY: 'auto',
          maxHeight: '200px',
          boxSizing: 'border-box',
          backgroundColor: 'rgba(28,28,28,0.78)',
        }}
      >
        <Box
          sx={{
            fontSize: '12px',
            color: 'rgba(255,255,255,0.78)',
            backgroundColor: OBERHEIM_TEAL,
            padding: '4px',
            borderRadius: '4px',
          }}
          key={`manage_fx_wrapper_STKS_${stkValues.length}`}
        >
          Instruments
        </Box>
        {stkValues.length > 0 &&
          [...new Set(stkValues.map((i) => i.label))].map((stkBtn: any) => (
            <Button
              onClick={handleViewSTK}
              value={`${stkBtn}`}
              key={`singleSelectSTK_${stkBtn}`}
              sx={{
                backgroundColor: CORDUROY_RUST,
                color: 'white',
                fontSize: '14px',
                marginTop: '4px',
                marginBottom: '4px',
              }}
            >
              {stkBtn}
            </Button>
          ))}
      </Box>

      <Box id={`activeEffectsManagerDropdown`} sx={{ width: '140px', display: 'flex', flexDirection: 'column' }}>
        <Box
          style={{
            fontSize: '12px',
            color: 'rgba(255,255,255,0.78)',
            backgroundColor: OBERHEIM_TEAL,
            padding: '4px',
            borderRadius: '4px',
          }}
          key={`manage_fx_wrapper_effects_${selectedEffects.length}`}
        >
          Effects
        </Box>
        {selectedEffects.length > 0 && (
          <Box
            key={`${selectedEffects.toString()}`}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              maxHeight: '200px',
              width: '100%',
              boxSizing: 'border-box',
              backgroundColor: 'rgba(28,28,28,0.78)',
              borderRadius: '4px',
            }}
          >
            {selectedEffects.map((effect: any) => (
              <Button
                key={`checkedEffect_${effect}`}
                onClick={handleViewEffect}
                value={effect.split('_')[1]}
                sx={{
                  backgroundColor: NEON_PINK,
                  color: 'white',
                  fontSize: '14px',
                  marginTop: '4px',
                  marginBottom: '4px',
                }}
              >
                {effect}
              </Button>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
