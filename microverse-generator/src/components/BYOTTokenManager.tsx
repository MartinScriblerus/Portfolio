/**
 * BYOT (Bring Your Own Token) Manager Component
 * Allows users to input their own API keys for LangChain/OpenAI functionality
 * Uses encrypted storage to mitigate XSS risks
 */

'use client';

import { useState, useEffect } from 'react';
import { setSecureApiKey, getSecureApiKey, removeSecureApiKey, hasSecureApiKey } from '../utils/secureStorage';

interface BYOTTokenManagerProps {
  compact?: boolean;
  onKeysUpdated?: (hasOpenAI: boolean) => void;
}

export default function BYOTTokenManager({ compact = false, onKeysUpdated }: BYOTTokenManagerProps) {
  const [openAIKey, setOpenAIKey] = useState<string>('');
  const [saved, setSaved] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cryptoAvailable, setCryptoAvailable] = useState<boolean>(true);

  // Check if Web Crypto API is available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const available = !!(crypto?.subtle);
      setCryptoAvailable(available);
      if (!available) {
        setError('Web Crypto API not available. Encryption disabled. Use HTTPS for secure storage.');
      }
    }
  }, []);

  // Load saved keys on mount (decrypted)
  useEffect(() => {
    const loadKey = async () => {
      if (typeof window !== 'undefined') {
        try {
          const savedKey = await getSecureApiKey();
          if (savedKey) {
            // Don't display the full key, just show it's saved
            setOpenAIKey('*'.repeat(Math.min(savedKey.length, 20)) + '...');
            setSaved(true);
            onKeysUpdated?.(true);
          }
        } catch (err) {
          console.error('Failed to load API key:', err);
          setError('Failed to load saved key. Please re-enter it.');
        }
      }
    };
    loadKey();
  }, [onKeysUpdated]);

  const handleSave = async () => {
    if (typeof window === 'undefined') return;
    
    setError(null);
    const keyToSave = openAIKey.trim();
    
    if (keyToSave && !keyToSave.startsWith('*')) {
      // Only save if it's not the masked version
      try {
        const success = await setSecureApiKey(keyToSave);
        if (success) {
          setSaved(true);
          // Mask the displayed key
          setOpenAIKey('*'.repeat(Math.min(keyToSave.length, 20)) + '...');
          onKeysUpdated?.(true);
        } else {
          setError('Failed to save API key. Please check the format (should start with "sk-") and try again.');
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to save API key. Please try again.');
      }
    } else if (!keyToSave) {
      removeSecureApiKey();
      setOpenAIKey('');
      setSaved(false);
      onKeysUpdated?.(false);
    }
  };

  const handleClear = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('openai_api_key');
      setOpenAIKey('');
      setSaved(false);
      onKeysUpdated?.(false);
    }
  };

  return (
    <div style={{
      padding: compact ? '8px' : '12px',
      background: 'rgba(0,0,0,0.6)',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: 6,
      fontSize: '10px'
    }}>
      <div style={{ marginBottom: 8 }}>
        <label style={{ display: 'block', marginBottom: 4, color: '#e9f1ff' }}>
          OpenAI API Key
        </label>
        <input
          type="password"
          value={openAIKey}
          onChange={(e) => {
            const newValue = e.target.value;
            setOpenAIKey(newValue);
            // Only mark as unsaved if it's not the masked version
            if (!newValue.startsWith('*')) {
              setSaved(false);
            }
          }}
          placeholder={saved ? "Key saved (encrypted)" : "sk-..."}
          style={{
            width: '100%',
            padding: '4px 8px',
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 4,
            color: '#e9f1ff',
            fontSize: '10px',
            fontFamily: 'monospace'
          }}
        />
      </div>
      {error && (
        <div style={{ 
          marginBottom: 8, 
          padding: '4px 8px', 
          background: 'rgba(248,113,113,0.2)', 
          border: '1px solid rgba(248,113,113,0.4)',
          borderRadius: 4,
          fontSize: '9px',
          color: '#f87171'
        }}>
          {error}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleSave}
          style={{
            padding: '4px 8px',
            fontSize: '9px',
            background: saved ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 3,
            color: '#e9f1ff',
            cursor: 'pointer'
          }}
        >
          {saved ? '✓ Saved' : 'Save'}
        </button>
        {saved && (
          <button
            onClick={handleClear}
            style={{
              padding: '4px 8px',
              fontSize: '9px',
              background: 'rgba(248,113,113,0.2)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 3,
              color: '#f87171',
              cursor: 'pointer'
            }}
          >
            Clear
          </button>
        )}
      </div>
      <div style={{ marginTop: 8, fontSize: '9px', opacity: 0.7, color: '#e9f1ff' }}>
        {cryptoAvailable ? (
          <>🔒 Keys are encrypted before storage using Web Crypto API (AES-GCM). 
          Still vulnerable to XSS on this domain. Only use if you trust this site.
          Keys are sent over HTTPS to server-side API only.</>
        ) : (
          <>⚠️ Encryption not available (requires HTTPS). Keys stored unencrypted.
          Only use on trusted networks. Keys are sent over HTTPS to server-side API.</>
        )}
      </div>
    </div>
  );
}
