'use client';

import { useState, useRef, useEffect } from 'react';
import { Button, Alert, Box, Typography } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useHydraControlsStore } from '../store/useHydraControlsStore';

const MAX_SIZE_MB = 500; // Large limit since it's client-side only
const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];

export default function VideoUpload() {
  const [error, setError] = useState<string | null>(null);
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);
  const [tab, setTab] = useState(0);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setUserVideoUrl = useHydraControlsStore((s) => s.setUserVideoUrl);
  const userVideoUrl = useHydraControlsStore((s) => s.userVideoUrl);
  
  // Clean up blob URLs on unmount
  useEffect(() => {
    return () => {
      if (userVideoUrl && userVideoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(userVideoUrl);
      }
    };
  }, [userVideoUrl]);
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setError(null);
    
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Invalid video format. Use MP4, WebM, MOV, or AVI.');
      return;
    }
    
    // Validate size
    const maxSize = MAX_SIZE_MB * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File too large. Maximum ${MAX_SIZE_MB}MB.`);
      return;
    }
    
    try {
      // Create object URL (browser handles this, no server needed!)
      const objectUrl = URL.createObjectURL(file);
      
      // Clean up previous video URL if exists
      if (userVideoUrl && userVideoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(userVideoUrl);
      }
      
      // Store in Zustand store
      setUserVideoUrl(objectUrl);
      setCurrentVideo(file.name);
      
      console.log('[VideoUpload] Video loaded:', file.name, file.size, 'bytes');
    } catch (err: any) {
      setError(err.message || 'Failed to load video');
    }
  };
  
  const handleClear = () => {
    if (userVideoUrl && userVideoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(userVideoUrl);
    }
    setUserVideoUrl(null);
    setCurrentVideo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        id="video-upload-input"
      />
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
        <label htmlFor="video-upload-input">
          <Button
            component="span"
            variant="outlined"
            size="small"
            startIcon={<CloudUploadIcon />}
            sx={{
              borderColor: 'rgba(255,255,255,0.3)',
              color: '#ffffff',
              '&:hover': {
                borderColor: 'rgba(255,255,255,0.5)',
                background: 'rgba(255,255,255,0.1)',
              },
            }}
          >
            Choose Video
          </Button>
        </label>
        {userVideoUrl && (
          <Button
            variant="outlined"
            size="small"
            onClick={handleClear}
            sx={{
              borderColor: 'rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.7rem',
            }}
          >
            Clear
          </Button>
        )}
      </Box>
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>
        Max {MAX_SIZE_MB}MB • MP4, WebM, MOV, AVI
      </Typography>
      
      {currentVideo && (
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' }}>
          ✓ {currentVideo}
        </Typography>
      )}
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            color: '#ff6b6b',
            border: '1px solid rgba(244, 67, 54, 0.3)',
            py: 0.5,
            fontSize: '0.7rem',
          }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}
    </Box>
  );
}



