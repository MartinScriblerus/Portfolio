'use client';

import React, { useState } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Slider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  useHydraControlsStore,
  MusicVariableSource,
  MusicOperator,
  HydraControlsState,
} from '../store/useHydraControlsStore';

type EffectKey = keyof HydraControlsState['effects'];

interface ParamControlProps {
  effect: EffectKey;
  param: string;
  label: string;
}

const MUSIC_SOURCES: MusicVariableSource[] = [
  'none',
  'count',
  'bpm',
  'onsets',
  'rms',
  'spectralCentroid',
  'spectralRolloff',
  'zcr',
  'mfcc0', 'mfcc1', 'mfcc2', 'mfcc3', 'mfcc4', 'mfcc5', 'mfcc6', 'mfcc7', 'mfcc8', 'mfcc9', 'mfcc10', 'mfcc11', 'mfcc12',
  'chroma0', 'chroma1', 'chroma2', 'chroma3', 'chroma4', 'chroma5', 'chroma6', 'chroma7', 'chroma8', 'chroma9', 'chroma10', 'chroma11',
];

const MUSIC_OPERATORS: MusicOperator[] = [
  'none',
  'multiply',
  'divide',
  'add',
  'subtract',
  'power',
  'sqrt',
  'log',
];

const ParamControl: React.FC<ParamControlProps> = ({ effect, param, label }) => {
  const paramConfig = useHydraControlsStore((s) => {
    const cfg = s.effects[effect]?.params[param];
    // Force re-render by accessing the value
    return cfg;
  });
  const setParamValue = useHydraControlsStore((s) => s.setParamValue);
  const setParamMin = useHydraControlsStore((s) => s.setParamMin);
  const setParamMax = useHydraControlsStore((s) => s.setParamMax);
  const setParamMusicSource = useHydraControlsStore((s) => s.setParamMusicSource);
  const setParamMusicOperator = useHydraControlsStore((s) => s.setParamMusicOperator);
  const setParamMusicOperand = useHydraControlsStore((s) => s.setParamMusicOperand);

  if (!paramConfig) return null;

  return (
    <Box sx={{ mb: 1, p: 1, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 0.5 }}>
      <Typography variant="caption" sx={{ mb: 0.75, fontWeight: 600, fontSize: '0.75rem' }}>
        {label}
      </Typography>
      
      <Stack spacing={1}>
        {/* Value Slider */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>Value</Typography>
            <TextField
              type="number"
              size="small"
              value={paramConfig?.value ?? 0}
              onChange={(e) => {
                const numVal = Number(e.target.value);
                console.log(`[HydraControls] TextField onChange: ${effect}.${param} = ${numVal}`);
                setParamValue(effect as EffectKey, param, numVal);
              }}
              inputProps={{ min: paramConfig?.min ?? 0, max: paramConfig?.max ?? 100, step: paramConfig?.step ?? 1 }}
              sx={{ width: 70, '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.5 } }}
            />
          </Box>
          <Slider
            value={paramConfig?.value ?? 0}
            min={paramConfig?.min ?? 0}
            max={paramConfig?.max ?? 100}
            step={paramConfig?.step ?? 1}
            onChange={(_, val) => {
              const numVal = typeof val === 'number' ? val : Array.isArray(val) ? val[0] : (paramConfig?.value ?? 0);
              console.log(`[HydraControls] Slider onChange: ${effect}.${param} = ${numVal}`);
              setParamValue(effect as EffectKey, param, numVal);
            }}
            onChangeCommitted={(_, val) => {
              const numVal = typeof val === 'number' ? val : Array.isArray(val) ? val[0] : (paramConfig?.value ?? 0);
              console.log(`[HydraControls] Slider onChangeCommitted: ${effect}.${param} = ${numVal}`);
            }}
            valueLabelDisplay="auto"
            size="small"
            sx={{ '& .MuiSlider-thumb': { width: 12, height: 12 } }}
          />
        </Box>

        {/* Min/Max Controls - Compact */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            label="Min"
            type="number"
            size="small"
            value={paramConfig.min}
            onChange={(e) => setParamMin(effect as EffectKey, param, Number(e.target.value))}
            sx={{ width: 70, '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.5 } }}
          />
          <TextField
            label="Max"
            type="number"
            size="small"
            value={paramConfig.max}
            onChange={(e) => setParamMax(effect as EffectKey, param, Number(e.target.value))}
            sx={{ width: 70, '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.5 } }}
          />
        </Box>

        {/* Music Variable Latch */}
        <Box>
          <FormControl fullWidth size="small" sx={{ mb: 0.5 }}>
            <InputLabel sx={{ fontSize: '0.75rem' }}>Music Var</InputLabel>
            <Select
              value={paramConfig.musicSource}
              label="Music Var"
              onChange={(e) => setParamMusicSource(effect as EffectKey, param, e.target.value as MusicVariableSource)}
              sx={{ fontSize: '0.75rem', '& .MuiSelect-select': { py: 0.75 } }}
            >
              {MUSIC_SOURCES.map((source) => (
                <MenuItem key={source} value={source} sx={{ fontSize: '0.75rem' }}>
                  {source === 'none' ? 'None' : source}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {paramConfig.musicSource !== 'none' && (
            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel sx={{ fontSize: '0.75rem' }}>Op</InputLabel>
                <Select
                  value={paramConfig.musicOperator}
                  label="Op"
                  onChange={(e) => setParamMusicOperator(effect as EffectKey, param, e.target.value as MusicOperator)}
                  sx={{ fontSize: '0.75rem', '& .MuiSelect-select': { py: 0.75 } }}
                >
                  {MUSIC_OPERATORS.map((op) => (
                    <MenuItem key={op} value={op} sx={{ fontSize: '0.75rem' }}>
                      {op === 'none' ? 'Direct' : op}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {paramConfig.musicOperator !== 'none' && paramConfig.musicOperator !== 'sqrt' && paramConfig.musicOperator !== 'log' && (
                <TextField
                  label="Val"
                  type="number"
                  size="small"
                  value={paramConfig.musicOperand}
                  onChange={(e) => setParamMusicOperand(effect as EffectKey, param, Number(e.target.value))}
                  sx={{ width: 80, '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.5 } }}
                />
              )}
            </Box>
          )}
        </Box>
      </Stack>
    </Box>
  );
};

interface EffectControlProps {
  effect: EffectKey;
  label: string;
  params: Array<{ key: string; label: string }>;
}

const EffectControl: React.FC<EffectControlProps> = ({ effect, label, params }) => {
  const enabled = useHydraControlsStore((s) => s.effects[effect]?.enabled ?? false);
  const setEffectEnabled = useHydraControlsStore((s) => s.setEffectEnabled);

  return (
    <Accordion sx={{ '&:before': { display: 'none' }, boxShadow: 'none', border: '1px solid rgba(255,255,255,0.05)' }}>
      <AccordionSummary 
        expandIcon={<ExpandMoreIcon sx={{ fontSize: '1rem' }} />}
        sx={{ minHeight: 36, '&.Mui-expanded': { minHeight: 36 } }}
      >
        <FormControlLabel
          control={
            <Switch
              checked={enabled}
              onChange={(e) => setEffectEnabled(effect as EffectKey, e.target.checked)}
              onClick={(e) => e.stopPropagation()}
              size="small"
            />
          }
          label={<Typography variant="caption" sx={{ fontSize: '0.8rem' }}>{label}</Typography>}
          sx={{ mr: 1, '& .MuiFormControlLabel-label': { fontSize: '0.8rem' } }}
        />
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0.5, pb: 1, px: 1 }}>
        {params.map(({ key, label: paramLabel }) => (
          <ParamControl key={key} effect={effect} param={key} label={paramLabel} />
        ))}
      </AccordionDetails>
    </Accordion>
  );
};

interface HydraControlsPopupProps {
  open: boolean;
  onClose: () => void;
}

export default function HydraControlsPopup({ open, onClose }: HydraControlsPopupProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      PaperProps={{
        sx: {
          bgcolor: 'rgba(20, 20, 25, 0.95)',
          color: '#e8e8e8',
          border: '1px solid rgba(255,255,255,0.1)',
          width: '344px',
          maxHeight: '48vh',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, fontSize: '0.95rem', fontWeight: 600 }}>
        Hydra Effect Controls
      </DialogTitle>
      <DialogContent sx={{ p: 1.5, '&.MuiDialogContent-root': { pt: 1 } }}>
        <Stack spacing={0.5}>
          <EffectControl
            effect="pixelate"
            label="Pixelate"
            params={[{ key: 'amount', label: 'Pixel Size' }]}
          />
          <EffectControl
            effect="modulateHue"
            label="Modulate Hue"
            params={[{ key: 'amount', label: 'Amount' }]}
          />
          <EffectControl
            effect="invert"
            label="Invert"
            params={[{ key: 'amount', label: 'Amount' }]}
          />
          <EffectControl
            effect="kaleid"
            label="Kaleid"
            params={[
              { key: 'sides', label: 'Sides' },
              { key: 'segments', label: 'Segments' },
            ]}
          />
          <EffectControl
            effect="repeat"
            label="Repeat"
            params={[
              { key: 'x', label: 'X Repeats' },
              { key: 'y', label: 'Y Repeats' },
            ]}
          />
          <EffectControl
            effect="saturate"
            label="Saturate"
            params={[{ key: 'amount', label: 'Amount' }]}
          />
          <EffectControl
            effect="contrast"
            label="Contrast"
            params={[{ key: 'amount', label: 'Amount' }]}
          />
          <EffectControl
            effect="brightness"
            label="Brightness"
            params={[{ key: 'amount', label: 'Amount' }]}
          />
          <EffectControl
            effect="hue"
            label="Hue"
            params={[{ key: 'amount', label: 'Amount' }]}
          />
          <EffectControl
            effect="posterize"
            label="Posterize"
            params={[{ key: 'levels', label: 'Levels' }]}
          />
          <EffectControl
            effect="modulate"
            label="Modulate"
            params={[{ key: 'amount', label: 'Amount' }]}
          />
          <EffectControl
            effect="luma"
            label="Luma"
            params={[{ key: 'threshold', label: 'Threshold' }]}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 1.5, pt: 1 }}>
        <Button onClick={onClose} size="small" sx={{ fontSize: '0.8rem' }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

