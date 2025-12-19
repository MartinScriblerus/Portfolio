'use client';

import React, { useState, useMemo } from 'react';
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
  IconButton,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CodeIcon from '@mui/icons-material/Code';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {
  useHydraControlsStore,
  MusicVariableSource,
  MusicOperator,
  HydraOperationChain,
  HydraOperationType,
} from '../store/useHydraControlsStore';
import { useOldMonolithStore } from '../store/useOldMonolithStore';
import VideoUpload from './VideoUpload';
import { generateHydraCode } from '../utils/generateHydraCode';

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

const SOURCE_OPERATIONS: { value: string; label: string }[] = [
  { value: 'osc', label: 'Osc' },
  { value: 'noise', label: 'Noise' },
  { value: 'shape', label: 'Shape' },
  { value: 'gradient', label: 'Gradient' },
  { value: 'voronoi', label: 'Voronoi' },
  { value: 'src', label: 'Src (Video)' },
];

const TRANSFORM_OPERATIONS: { value: string; label: string }[] = [
  { value: 'repeat', label: 'Repeat' },
  { value: 'kaleid', label: 'Kaleid' },
  { value: 'pixelate', label: 'Pixelate' },
  { value: 'rotate', label: 'Rotate' },
  { value: 'scale', label: 'Scale' },
  { value: 'scrollX', label: 'Scroll X' },
  { value: 'scrollY', label: 'Scroll Y' },
  { value: 'colorama', label: 'Colorama' },
  { value: 'saturate', label: 'Saturate' },
  { value: 'contrast', label: 'Contrast' },
  { value: 'brightness', label: 'Brightness' },
  { value: 'hue', label: 'Hue' },
  { value: 'posterize', label: 'Posterize' },
  { value: 'invert', label: 'Invert' },
  { value: 'luma', label: 'Luma' },
];

const COMPOSITOR_OPERATIONS: { value: string; label: string }[] = [
  { value: 'modulate', label: 'Modulate' },
  { value: 'modulateHue', label: 'Modulate Hue' },
  { value: 'modulateScale', label: 'Modulate Scale' },
  { value: 'modulateRotate', label: 'Modulate Rotate' },
  { value: 'blend', label: 'Blend' },
  { value: 'add', label: 'Add' },
  { value: 'mult', label: 'Mult' },
  { value: 'diff', label: 'Diff' },
  { value: 'layer', label: 'Layer' },
  { value: 'mask', label: 'Mask' },
];

interface ChainParamControlProps {
  chainId: string;
  param: string;
  label: string;
}

const ChainParamControl: React.FC<ChainParamControlProps> = ({ chainId, param, label }) => {
  const paramConfig = useHydraControlsStore((s) => {
    const chain = s.chains.find(c => c.id === chainId);
    return chain?.params[param];
  });
  const setChainParamValue = useHydraControlsStore((s) => s.setChainParamValue);
  const setChainParamMin = useHydraControlsStore((s) => s.setChainParamMin);
  const setChainParamMax = useHydraControlsStore((s) => s.setChainParamMax);
  const setChainParamMusicSource = useHydraControlsStore((s) => s.setChainParamMusicSource);
  const setChainParamMusicOperator = useHydraControlsStore((s) => s.setChainParamMusicOperator);
  const setChainParamMusicOperand = useHydraControlsStore((s) => s.setChainParamMusicOperand);

  if (!paramConfig) return null;

  return (
    <Box sx={{ mb: 1, p: 1, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 0.5 }}>
      <Typography variant="caption" sx={{ mb: 0.75, fontWeight: 600, fontSize: '0.75rem', color: '#ffffff' }}>
        {label}
      </Typography>
      
      <Stack spacing={1}>
        {/* Value Slider */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#ffffff' }}>Value</Typography>
            <TextField
              type="number"
              size="small"
              value={paramConfig?.value ?? 0}
              onChange={(e) => {
                const numVal = Number(e.target.value);
                setChainParamValue(chainId, param, numVal);
              }}
              inputProps={{ min: paramConfig?.min ?? 0, max: paramConfig?.max ?? 100, step: paramConfig?.step ?? 1 }}
              sx={{ 
                width: 70, 
                '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.5, color: '#ffffff' },
                '& .MuiInputLabel-root': { color: '#ffffff' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.7)' },
              }}
            />
          </Box>
          <Slider
            value={paramConfig?.value ?? 0}
            min={paramConfig?.min ?? 0}
            max={paramConfig?.max ?? 100}
            step={paramConfig?.step ?? 1}
            onChange={(_, val) => {
              const numVal = typeof val === 'number' ? val : Array.isArray(val) ? val[0] : (paramConfig?.value ?? 0);
              setChainParamValue(chainId, param, numVal);
            }}
            valueLabelDisplay="auto"
            size="small"
            sx={{ '& .MuiSlider-thumb': { width: 12, height: 12 } }}
          />
        </Box>

        {/* Min/Max Controls */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            label="Min"
            type="number"
            size="small"
            value={paramConfig.min}
            onChange={(e) => setChainParamMin(chainId, param, Number(e.target.value))}
            sx={{ width: 70, '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.5 } }}
          />
          <TextField
            label="Max"
            type="number"
            size="small"
            value={paramConfig.max}
            onChange={(e) => setChainParamMax(chainId, param, Number(e.target.value))}
            sx={{ width: 70, '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.5 } }}
          />
        </Box>

        {/* Music Variable Latch */}
        <Box>
          <FormControl fullWidth size="small" sx={{ mb: 0.5 }}>
            <InputLabel sx={{ fontSize: '0.75rem', color: '#ffffff' }}>Music Var</InputLabel>
            <Select
              value={paramConfig.musicSource}
              label="Music Var"
              onChange={(e) => setChainParamMusicSource(chainId, param, e.target.value as MusicVariableSource)}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: 'rgba(20, 20, 25, 0.98)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    '& .MuiMenuItem-root': {
                      color: '#ffffff',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.1)',
                      },
                      '&.Mui-selected': {
                        bgcolor: 'rgba(255,255,255,0.15)',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.2)',
                        },
                      },
                    },
                  },
                },
              }}
              sx={{ 
                fontSize: '0.75rem', 
                color: '#ffffff',
                '& .MuiSelect-select': { py: 0.75, color: '#ffffff' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.7)' },
                '& .MuiSvgIcon-root': { color: '#ffffff' },
              }}
            >
              {MUSIC_SOURCES.map((source) => (
                <MenuItem key={source} value={source} sx={{ fontSize: '0.75rem', color: '#ffffff' }}>
                  {source === 'none' ? 'None' : source}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {paramConfig.musicSource !== 'none' && (
            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel sx={{ fontSize: '0.75rem', color: '#ffffff' }}>Op</InputLabel>
                <Select
                  value={paramConfig.musicOperator}
                  label="Op"
                  onChange={(e) => setChainParamMusicOperator(chainId, param, e.target.value as MusicOperator)}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: 'rgba(20, 20, 25, 0.98)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        '& .MuiMenuItem-root': {
                          color: '#ffffff',
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.1)',
                          },
                          '&.Mui-selected': {
                            bgcolor: 'rgba(255,255,255,0.15)',
                            '&:hover': {
                              bgcolor: 'rgba(255,255,255,0.2)',
                            },
                          },
                        },
                      },
                    },
                  }}
                  sx={{ 
                    fontSize: '0.75rem',
                    color: '#ffffff',
                    '& .MuiSelect-select': { py: 0.75, color: '#ffffff' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.7)' },
                    '& .MuiSvgIcon-root': { color: '#ffffff' },
                  }}
                >
                  {MUSIC_OPERATORS.map((op) => (
                    <MenuItem key={op} value={op} sx={{ fontSize: '0.75rem', color: '#ffffff' }}>
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
                  onChange={(e) => setChainParamMusicOperand(chainId, param, Number(e.target.value))}
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

interface ChainControlProps {
  chain: HydraOperationChain;
  depth: number;
  availableChains: HydraOperationChain[];
}

const ChainControl: React.FC<ChainControlProps> = ({ chain, depth, availableChains }) => {
  const setChainEnabled = useHydraControlsStore((s) => s.setChainEnabled);
  const setChainParent = useHydraControlsStore((s) => s.setChainParent);
  const setChainInnerSource = useHydraControlsStore((s) => s.setChainInnerSource);
  const removeChain = useHydraControlsStore((s) => s.removeChain);
  
  const enabled = chain.enabled;
  const indent = depth * 20;
  const isSource = chain.type === 'source';
  const isCompositor = chain.type === 'compositor';
  
  // Get param labels based on operation
  const getParamLabels = (operation: string): Array<{ key: string; label: string }> => {
    switch (operation) {
      case 'osc':
        return [
          { key: 'freq', label: 'Frequency' },
          { key: 'sync', label: 'Sync' },
          { key: 'offset', label: 'Offset' },
        ];
      case 'noise':
        return [{ key: 'scale', label: 'Scale' }];
      case 'shape':
        return [
          { key: 'sides', label: 'Sides' },
          { key: 'radius', label: 'Radius' },
        ];
      case 'repeat':
        return [
          { key: 'x', label: 'X Repeats' },
          { key: 'y', label: 'Y Repeats' },
        ];
      case 'kaleid':
        return [
          { key: 'sides', label: 'Sides' },
          { key: 'segments', label: 'Segments' },
        ];
      case 'pixelate':
        return [{ key: 'amount', label: 'Pixel Size' }];
      case 'saturate':
      case 'contrast':
      case 'brightness':
      case 'hue':
      case 'invert':
      case 'modulate':
      case 'modulateHue':
      case 'blend':
      case 'add':
      case 'mult':
      case 'mask':
        return [{ key: 'amount', label: 'Amount' }];
      case 'posterize':
        return [{ key: 'levels', label: 'Levels' }];
      case 'luma':
        return [{ key: 'threshold', label: 'Threshold' }];
      default:
        return [];
    }
  };
  
  const paramLabels = getParamLabels(chain.operation);
  const children = availableChains.filter(c => c.parentId === chain.id);
  const canHaveChildren = isSource || isCompositor;
  // All types can nest: transforms/compositors under sources or compositors, sources under compositors (as inner sources)
  const canNestUnder = true; // All chain types can be nested
  const potentialParents = availableChains.filter(c => {
    if (c.id === chain.id || c.id === chain.parentId) return false;
    // Transforms and compositors can nest under sources or compositors
    if (chain.type === 'transform' || chain.type === 'compositor') {
      return c.type === 'source' || c.type === 'compositor';
    }
    // Sources can nest under compositors (as inner sources) or other sources
    if (chain.type === 'source') {
      return c.type === 'compositor' || c.type === 'source';
    }
    return false;
  });
  
  return (
    <Box sx={{ ml: `${indent}px`, mb: 0.5 }}>
      <Box sx={{ mb: 0.5 }}>
        {/* Toggle and label outside accordion to avoid conflicts */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, px: 1 }}>
          <Switch
            checked={enabled}
            onChange={(e) => setChainEnabled(chain.id, e.target.checked)}
            size="small"
            sx={{ 
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: '#4caf50',
              },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                backgroundColor: '#4caf50',
              },
            }}
          />
          <Typography 
            variant="caption" 
            sx={{ 
              fontSize: '0.8rem', 
              fontWeight: isSource ? 600 : 400, 
              color: enabled ? '#ffffff' : 'rgba(255,255,255,0.5)',
              flex: 1,
            }}
          >
            {depth > 0 && '└─ '}
            {chain.operation}()
            {isCompositor && chain.innerSourceId && ' [inner]'}
          </Typography>
          <Box
            component="div"
            onClick={(e) => {
              e.stopPropagation();
              removeChain(chain.id);
            }}
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              borderRadius: '50%',
              '&:hover': { 
                color: 'rgba(255,255,255,0.8)',
                bgcolor: 'rgba(255,255,255,0.1)',
              },
              transition: 'all 0.2s',
            }}
          >
            <DeleteIcon sx={{ fontSize: '0.9rem' }} />
          </Box>
        </Box>
        
        <Accordion 
          sx={{ 
            '&:before': { display: 'none' }, 
            boxShadow: 'none', 
            border: '1px solid rgba(255,255,255,0.05)',
            bgcolor: depth > 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
          }}
        >
          <AccordionSummary 
            expandIcon={<ExpandMoreIcon sx={{ fontSize: '1rem' }} />}
            sx={{ minHeight: 32, '&.Mui-expanded': { minHeight: 32 }, py: 0 }}
          >
            <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
              {enabled ? 'Click to configure' : 'Enable to configure'}
            </Typography>
          </AccordionSummary>
        <AccordionDetails sx={{ pt: 0.5, pb: 1, px: 1 }}>
          <Stack spacing={1}>
            {/* Nest Under Control */}
            {canNestUnder && (
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.75rem', color: '#ffffff' }}>Nest Under</InputLabel>
                <Select
                  value={chain.parentId || ''}
                  label="Nest Under"
                  onChange={(e) => setChainParent(chain.id, e.target.value || undefined)}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: 'rgba(20, 20, 25, 0.98)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        '& .MuiMenuItem-root': {
                          color: '#ffffff',
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.1)',
                          },
                          '&.Mui-selected': {
                            bgcolor: 'rgba(255,255,255,0.15)',
                            '&:hover': {
                              bgcolor: 'rgba(255,255,255,0.2)',
                            },
                          },
                        },
                      },
                    },
                  }}
                  sx={{ 
                    fontSize: '0.75rem',
                    color: '#ffffff',
                    '& .MuiSelect-select': { py: 0.75, color: '#ffffff' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.7)' },
                    '& .MuiSvgIcon-root': { color: '#ffffff' },
                  }}
                >
                  <MenuItem value="" sx={{ fontSize: '0.75rem', color: '#ffffff' }}>None (Root)</MenuItem>
                  {potentialParents.map((parent) => (
                    <MenuItem key={parent.id} value={parent.id} sx={{ fontSize: '0.75rem', color: '#ffffff' }}>
                      {parent.operation}()
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            
            {/* Inner Source Control (for compositors) */}
            {isCompositor && (
              <Box>
                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', mb: 0.5, display: 'block' }}>
                  <strong>Compositors</strong> combine 2 textures
                </Typography>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontSize: '0.75rem', color: '#ffffff' }}>Inner Source (2nd texture)</InputLabel>
                  <Select
                    value={chain.innerSourceId || ''}
                    label="Inner Source (2nd texture)"
                    onChange={(e) => setChainInnerSource(chain.id, e.target.value || undefined)}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          bgcolor: 'rgba(20, 20, 25, 0.98)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          '& .MuiMenuItem-root': {
                            color: '#ffffff',
                            '&:hover': {
                              bgcolor: 'rgba(255,255,255,0.1)',
                            },
                            '&.Mui-selected': {
                              bgcolor: 'rgba(255,255,255,0.15)',
                              '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.2)',
                              },
                            },
                          },
                        },
                      },
                    }}
                    sx={{ 
                      fontSize: '0.75rem',
                      color: '#ffffff',
                      '& .MuiSelect-select': { py: 0.75, color: '#ffffff' },
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.7)' },
                      '& .MuiSvgIcon-root': { color: '#ffffff' },
                    }}
                  >
                    <MenuItem value="" sx={{ fontSize: '0.75rem', color: '#ffffff' }}>None (uses noise default)</MenuItem>
                    {availableChains
                      .filter(c => c.type === 'source' && c.id !== chain.id)
                      .map((source) => (
                        <MenuItem key={source.id} value={source.id} sx={{ fontSize: '0.75rem', color: '#ffffff' }}>
                          {source.operation}()
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Box>
            )}
            
            {/* Video Upload for src operation */}
            {isSource && chain.operation === 'src' && (
              <Box sx={{ mb: 1, p: 1, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 0.5 }}>
                <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#ffffff', mb: 1, display: 'block' }}>
                  Video Source
                </Typography>
                <VideoUpload />
              </Box>
            )}
            
            {/* Parameters */}
            {paramLabels.map(({ key, label }) => (
              <ChainParamControl key={key} chainId={chain.id} param={key} label={label} />
            ))}
          </Stack>
        </AccordionDetails>
        </Accordion>
      </Box>
      
      {/* Render children */}
      {children.map((child) => (
        <ChainControl key={child.id} chain={child} depth={depth + 1} availableChains={availableChains} />
      ))}
    </Box>
  );
};

interface HydraControlsPopupProps {
  open: boolean;
  onClose: () => void;
}

export default function HydraControlsPopup({ open, onClose }: HydraControlsPopupProps) {
  // Access chains directly from store - Zustand will handle reference equality
  const chains = useHydraControlsStore((s) => s.chains);
  const addChain = useHydraControlsStore((s) => s.addChain);
  const [addType, setAddType] = useState<HydraOperationType>('source');
  const [addOperation, setAddOperation] = useState<string>('osc');
  const rightDrawerOpen = useOldMonolithStore((s) => s.rightDrawerOpen);
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  
  // Create a stable hash of chains to use as dependency for useMemo
  // This prevents infinite loops by only recalculating when chains actually change
  const chainsHash = useMemo(() => {
    return chains.map(c => `${c.id}:${c.enabled}:${c.parentId}:${c.order}:${c.innerSourceId}`).join('|');
  }, [chains]);
  
  // Memoize the tree structure to avoid recalculating on every render
  const chainTree = useMemo(() => {
    const sorted = [...chains];
    // Sort by order, then by parent relationship
    sorted.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      // If same order, roots come first
      if (!a.parentId && b.parentId) return -1;
      if (a.parentId && !b.parentId) return 1;
      return 0;
    });
    return sorted;
  }, [chainsHash, chains]);
  
  const getOperationsForType = (type: HydraOperationType) => {
    switch (type) {
      case 'source':
        return SOURCE_OPERATIONS;
      case 'transform':
        return TRANSFORM_OPERATIONS;
      case 'compositor':
        return COMPOSITOR_OPERATIONS;
      default:
        return [];
    }
  };
  
  const handleAddChain = () => {
    const operations = getOperationsForType(addType);
    const selectedOp = operations.find(op => op.value === addOperation);
    if (selectedOp) {
      // getDefaultParams will be called inside addChain if params is undefined
      addChain(addType, addOperation, undefined as any, undefined);
      setAddOperation(operations[0]?.value || 'osc');
    }
  };

  const handleGenerateCode = () => {
    const code = generateHydraCode(chains);
    setGeneratedCode(code);
    setCodeDialogOpen(true);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      // You could add a toast notification here if desired
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };
  
  // Get root chains (no parent) - use memoized tree
  const rootChains = chainTree.filter(c => !c.parentId);
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          bgcolor: 'rgba(20, 20, 25, 0.95)',
          color: '#e8e8e8',
          border: '1px solid rgba(255,255,255,0.1)',
          width: '444px',
          position: 'fixed',
          bottom: '16rem', // Above piano keys
          //left: '360px', // To the right of rgb panels and buttons
          right: rightDrawerOpen ? '420px' : '20px', // Slide left when right drawer opens
          top: '20px',
          margin: 0,
          maxHeight: 'calc(100vh - 140px)',
          transform: 'none', // Override default centering
          transition: 'right 180ms ease', // Match right drawer transition
        },
      }}
      sx={{
        '& .MuiDialog-container': {
          alignItems: 'flex-end',
          justifyContent: 'flex-start',
        },
        '& .MuiBackdrop-root': {
          backgroundColor: 'transparent', // No backdrop overlay
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, fontSize: '0.95rem', fontWeight: 600, color: '#ffffff' }}>
        Hydra Operation Chains
        <Typography variant="caption" sx={{ display: 'block', fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', mt: 0.5, fontWeight: 400 }}>
          <strong>Sources</strong> create new textures • <strong>Transforms:</strong> modify textures • <strong>Compositors:</strong> combine 2 textures (select inner source below)
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ 
        p: 1.5,
      
        '&.MuiDialogContent-root': { 
          pt: 1, 
          color: '#ffffff',
           
          } 
        }}
      >
        <Stack spacing={1}>
          {/* Video Upload Section */}
          <Box sx={{ p: 1, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 0.5, mb: 1 }}>
            <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#ffffff', mb: 1, display: 'block' }}>
              Video Source
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', mb: 1, display: 'block' }}>
              Upload a video to use with the <strong>Src (Video)</strong> operation. The video will be available to all src() chains.
            </Typography>
            <VideoUpload />
          </Box>
          
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
          
          {/* Add New Chain */}
          <Box sx={{ p: 1, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 0.5 }}>
            {/* <Typography variant="caption" sx={{ mb: 0.5, padding: '4px', fontSize: '0.75rem', fontWeight: 600, color: '#ffffff' }}>
              Add Operation
            </Typography> */}
            {/* <Typography variant="caption" sx={{ display: 'block', mb: 1, fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>
              <strong>Tip:</strong> Sources (osc, noise, etc.) automatically nest under video. Video is always the base. Use 'Nest Under' to chain operations: e.g., nest a 'modulate' compositor under 'osc', then select another 'osc' as its inner source for osc().modulate(osc()) patterns.
            </Typography> */}
            <Stack spacing={1} direction="row">
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel sx={{ fontSize: '0.75rem', color: '#ffffff' }}>Type</InputLabel>
                <Select
                  value={addType}
                  label="Type"
                  onChange={(e) => {
                    const newType = e.target.value as HydraOperationType;
                    setAddType(newType);
                    const ops = getOperationsForType(newType);
                    setAddOperation(ops[0]?.value || 'osc');
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: 'rgba(20, 20, 25, 0.98)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        '& .MuiMenuItem-root': {
                          color: '#ffffff',
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.1)',
                          },
                          '&.Mui-selected': {
                            bgcolor: 'rgba(255,255,255,0.15)',
                            '&:hover': {
                              bgcolor: 'rgba(255,255,255,0.2)',
                            },
                          },
                        },
                      },
                    },
                  }}
                  sx={{ 
                    fontSize: '0.75rem',
                    color: '#ffffff',
                    '& .MuiSelect-select': { py: 0.75, color: '#ffffff' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.7)' },
                    '& .MuiSvgIcon-root': { color: '#ffffff' },
                  }}
                >
                  <MenuItem value="source" sx={{ fontSize: '0.75rem', color: '#ffffff' }}>Source</MenuItem>
                  <MenuItem value="transform" sx={{ fontSize: '0.75rem', color: '#ffffff' }}>Transform</MenuItem>
                  <MenuItem value="compositor" sx={{ fontSize: '0.75rem', color: '#ffffff' }}>Compositor</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel sx={{ fontSize: '0.75rem', color: '#ffffff' }}>Operation</InputLabel>
                <Select
                  value={addOperation}
                  label="Operation"
                  onChange={(e) => setAddOperation(e.target.value)}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: 'rgba(20, 20, 25, 0.98)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        '& .MuiMenuItem-root': {
                          color: '#ffffff',
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.1)',
                          },
                          '&.Mui-selected': {
                            bgcolor: 'rgba(255,255,255,0.15)',
                            '&:hover': {
                              bgcolor: 'rgba(255,255,255,0.2)',
                            },
                          },
                        },
                      },
                    },
                  }}
                  sx={{ 
                    fontSize: '0.75rem',
                    color: '#ffffff',
                    '& .MuiSelect-select': { py: 0.75, color: '#ffffff' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.7)' },
                    '& .MuiSvgIcon-root': { color: '#ffffff' },
                  }}
                >
                  {getOperationsForType(addType).map((op) => (
                    <MenuItem key={op.value} value={op.value} sx={{ fontSize: '0.75rem', color: '#ffffff' }}>
                      {op.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <IconButton
                size="small"
                onClick={handleAddChain}
                sx={{ 
                  color: 'rgba(255,255,255,0.7)', 
                  '&:hover': { color: 'rgba(255,255,255,1)' },
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                <AddIcon sx={{ fontSize: '1rem' }} />
              </IconButton>
            </Stack>
          </Box>
          
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
          <div style={{
            overflow: 'auto',
          }}>
          {/* Chain Tree */}
            {rootChains.length === 0 ? (
              <Typography variant="caption" sx={{ fontSize: '0.75rem', color: '#ffffff', textAlign: 'center', py: 2 }}>
                No operations yet. Add a source to start building a chain.
              </Typography>
            ) : (
              rootChains.map((chain) => (
                <ChainControl key={chain.id} chain={chain} depth={0} availableChains={chainTree} />
              ))
            )}
          </div>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 1.5, pt: 1, display: 'flex', justifyContent: 'space-between' }}>
        <Button 
          onClick={handleGenerateCode} 
          size="small" 
          startIcon={<CodeIcon />}
          sx={{ 
            fontSize: '0.8rem', 
            color: '#ffffff',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.1)',
            },
          }}
        >
          Generate Code
        </Button>
        <Button onClick={onClose} size="small" sx={{ fontSize: '0.8rem', color: '#ffffff' }}>Close</Button>
      </DialogActions>

      {/* Code Display Dialog */}
      <Dialog
        open={codeDialogOpen}
        onClose={() => setCodeDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(20, 20, 25, 0.95)',
            color: '#e8e8e8',
            border: '1px solid rgba(255,255,255,0.1)',
          },
        }}
      >
        <DialogTitle sx={{ pb: 1, fontSize: '0.95rem', fontWeight: 600, color: '#ffffff' }}>
          Generated Hydra Code
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              position: 'relative',
              bgcolor: 'rgba(0, 0, 0, 0.3)',
              borderRadius: 1,
              p: 2,
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <IconButton
              onClick={handleCopyCode}
              size="small"
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                color: 'rgba(255,255,255,0.7)',
                '&:hover': {
                  color: '#ffffff',
                  bgcolor: 'rgba(255,255,255,0.1)',
                },
              }}
              title="Copy to clipboard"
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
            <pre
              style={{
                margin: 0,
                fontSize: '0.85rem',
                fontFamily: 'monospace',
                color: '#ffffff',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                overflowX: 'auto',
              }}
            >
              {generatedCode}
            </pre>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 1.5, pt: 1 }}>
          <Button 
            onClick={handleCopyCode} 
            size="small" 
            startIcon={<ContentCopyIcon />}
            sx={{ fontSize: '0.8rem', color: '#ffffff' }}
          >
            Copy
          </Button>
          <Button 
            onClick={() => setCodeDialogOpen(false)} 
            size="small" 
            sx={{ fontSize: '0.8rem', color: '#ffffff' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
