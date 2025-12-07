'use client';

import { useState } from 'react';
import { Button, TextField, Box, Typography, Paper, Chip, CircularProgress, Alert } from '@mui/material';
import { DSPDoc, IntentType, PatchGenerationResult, Language } from '@/types/dsp-rag';

interface DSPGoalPortalProps {
  onGenerate?: (result: PatchGenerationResult) => void;
}

export default function DSPGoalPortal({ onGenerate }: DSPGoalPortalProps) {
  const [goal, setGoal] = useState('');
  const [targetLanguage, setTargetLanguage] = useState<Language>('chuck');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [visualSync, setVisualSync] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PatchGenerationResult | null>(null);

  const handleSubmit = async () => {
    if (!goal.trim()) {
      setError('Please enter a goal');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('goal', goal);
      formData.append('targetLanguage', targetLanguage);
      formData.append('visualSync', String(visualSync));
      if (audioFile) {
        formData.append('audioFile', audioFile);
      }

      const response = await fetch('/api/dsp/generate', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Generation failed');
      }

      const data = await response.json();
      setResult(data);
      
      if (onGenerate) {
        onGenerate(data);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          What would you like to achieve?
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Describe your sound design goal, and we'll help you create DSP code using WebChucK, Meyda, Hydra, and more.
        </Typography>

        <TextField
          fullWidth
          multiline
          rows={4}
          label="Describe your goal"
          placeholder="e.g., 'I want a metallic granular lead with quick transients, under 1s release, slightly detuned'"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          sx={{ mb: 2 }}
          disabled={loading}
        />

        <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            select
            label="Target Language"
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value as Language)}
            SelectProps={{ native: true }}
            sx={{ minWidth: 150 }}
            disabled={loading}
          >
            <option value="chuck">ChucK</option>
            <option value="faust">Faust</option>
            <option value="pd">Pure Data</option>
            <option value="js">JavaScript</option>
          </TextField>

          <Chip
            label="Visual Sync (Hydra)"
            color={visualSync ? 'primary' : 'default'}
            onClick={() => setVisualSync(!visualSync)}
            disabled={loading}
            clickable
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            Upload audio file (optional, for MODIFY_SOUND intent)
          </Typography>
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
            disabled={loading}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Button
          variant="contained"
          size="large"
          onClick={handleSubmit}
          disabled={loading || !goal.trim()}
          fullWidth
          sx={{ mb: 3 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Generate Sound'}
        </Button>

        {result && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Generated Result
            </Typography>
            
            <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" gutterBottom>
                Intent: {result.intent}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {result.explanation}
              </Typography>

              <Typography variant="subtitle2" gutterBottom>
                Generated Code ({result.code.language}):
              </Typography>
              <Box
                component="pre"
                sx={{
                  p: 2,
                  bgcolor: 'grey.900',
                  color: 'grey.100',
                  borderRadius: 1,
                  overflow: 'auto',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace'
                }}
              >
                {result.code.code}
              </Box>

              {result.code.explanation && (
                <Typography variant="body2" sx={{ mt: 2 }}>
                  <strong>Notes:</strong> {result.code.explanation}
                </Typography>
              )}

              {result.code.tweak_sliders && result.code.tweak_sliders.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Adjustable Parameters:
                  </Typography>
                  {result.code.tweak_sliders.map((slider, i) => (
                    <Chip
                      key={i}
                      label={`${slider.param}: ${slider.default} (range: ${slider.range[0]} - ${slider.range[1]})`}
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>
              )}

              {result.validation && !result.validation.valid && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Validation Issues:
                  <ul>
                    {result.validation.errors?.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </Alert>
              )}

              {result.validation?.recommendations && result.validation.recommendations.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Recommendations:
                  </Typography>
                  {result.validation.recommendations.map((rec, i) => (
                    <Alert key={i} severity="info" sx={{ mt: 1 }}>
                      <strong>{rec.param}:</strong> {rec.change} {rec.value !== undefined ? `to ${rec.value}` : ''} - {rec.reason}
                    </Alert>
                  ))}
                </Box>
              )}

              {result.retrieved_docs && result.retrieved_docs.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Retrieved References:
                  </Typography>
                  {result.retrieved_docs.slice(0, 3).map((doc, i) => (
                    <Chip
                      key={i}
                      label={`${doc.title || 'Untitled'} (${(doc.similarity * 100).toFixed(0)}% match)`}
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>
              )}
            </Paper>
          </Box>
        )}
      </Paper>
    </Box>
  );
}


