/**
 * Secure Storage Utility
 * Encrypts sensitive data before storing in localStorage to mitigate XSS risks
 * Uses Web Crypto API for encryption (AES-GCM)
 */

const STORAGE_KEY = 'openai_api_key_enc';
const ENCRYPTION_ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM
const SALT_LENGTH = 16;

/**
 * Derives a key from a password using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  // Create a new ArrayBuffer from the password data to satisfy strict typing
  const passwordBuffer = new ArrayBuffer(passwordData.length);
  new Uint8Array(passwordBuffer).set(passwordData);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  // Create a new ArrayBuffer from the salt to satisfy strict typing
  // This ensures it's a proper ArrayBuffer, not ArrayBufferLike
  const saltBuffer = new ArrayBuffer(salt.length);
  new Uint8Array(saltBuffer).set(salt);
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer as ArrayBuffer, // Type assertion to satisfy TypeScript
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Generates a device-specific key from browser fingerprint
 * This makes it harder for attackers to decrypt even if they access localStorage
 */
function getDeviceKey(): string {
  // Create a device fingerprint from available browser properties
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
    (navigator as any).deviceMemory || 0,
  ].join('|');

  // Use a simple hash (for client-side, this is acceptable)
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

/**
 * Encrypts a string using AES-GCM
 */
async function encrypt(plaintext: string): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('Window object not available');
  }
  
  if (!crypto?.subtle) {
    throw new Error('Web Crypto API not available. Please use a modern browser with HTTPS.');
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  
  // Generate salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // Derive key from device fingerprint
  const deviceKey = getDeviceKey();
  const key = await deriveKey(deviceKey, salt);

  // Encrypt
  const encrypted = await crypto.subtle.encrypt(
    { name: ENCRYPTION_ALGORITHM, iv },
    key,
    data
  );

  // Combine salt + iv + encrypted data
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);

  // Convert to base64 for storage
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts a string encrypted with encrypt()
 */
async function decrypt(ciphertext: string): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('Window object not available');
  }
  
  if (!crypto?.subtle) {
    throw new Error('Web Crypto API not available. Please use a modern browser with HTTPS.');
  }

  try {
    // Decode from base64
    const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));

    // Extract salt, IV, and encrypted data
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH);

    // Derive key using same device fingerprint
    const deviceKey = getDeviceKey();
    const key = await deriveKey(deviceKey, salt);

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: ENCRYPTION_ALGORITHM, iv },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    // If decryption fails (e.g., device changed, corrupted data), return empty
    console.warn('[secureStorage] Decryption failed:', error);
    return '';
  }
}

/**
 * Securely stores an API key in localStorage (encrypted)
 */
export async function setSecureApiKey(apiKey: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    // Validate API key format (OpenAI keys start with sk-)
    const trimmed = apiKey.trim();
    if (!trimmed || (!trimmed.startsWith('sk-') && trimmed.length < 20)) {
      throw new Error('Invalid API key format. OpenAI keys should start with "sk-"');
    }

    // Check if Web Crypto API is available (required for HTTPS in production)
    if (!crypto?.subtle) {
      // Fallback: warn but still store (less secure, but functional)
      console.warn('[secureStorage] Web Crypto API not available. Storing unencrypted (not recommended).');
      localStorage.setItem('openai_api_key', trimmed);
      return true;
    }

    const encrypted = await encrypt(trimmed);
    
    // Store with obfuscated key name and add metadata
    const storageData = {
      data: encrypted,
      version: '1.0',
      timestamp: Date.now(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));
    
    // Remove any legacy unencrypted key
    localStorage.removeItem('openai_api_key');
    
    return true;
  } catch (error) {
    console.error('[secureStorage] Failed to store API key:', error);
    // If encryption fails but we're in a secure context, don't fall back to plaintext
    if (error instanceof Error && error.message.includes('Web Crypto API')) {
      throw error; // Re-throw so UI can show proper error
    }
    return false;
  }
}

/**
 * Retrieves and decrypts the API key from localStorage
 */
export async function getSecureApiKey(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    
    // If encrypted key exists, decrypt it
    if (stored) {
      const storageData = JSON.parse(stored);
      
      // Check if data format is valid
      if (storageData?.data) {
        if (!crypto?.subtle) {
          console.warn('[secureStorage] Web Crypto API not available. Cannot decrypt stored key.');
          return null;
        }
        
        const decrypted = await decrypt(storageData.data);
        return decrypted || null;
      }
    }
    
    // Try legacy format (unencrypted) for migration
    const legacyKey = localStorage.getItem('openai_api_key');
    if (legacyKey) {
      // Attempt to migrate to encrypted format
      try {
        await setSecureApiKey(legacyKey);
        return legacyKey;
      } catch (error) {
        // If migration fails, return legacy key anyway
        console.warn('[secureStorage] Migration to encrypted format failed, using legacy key');
        return legacyKey;
      }
    }
    
    return null;
  } catch (error) {
    console.error('[secureStorage] Failed to retrieve API key:', error);
    return null;
  }
}

/**
 * Removes the encrypted API key from localStorage
 */
export function removeSecureApiKey(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(STORAGE_KEY);
  // Also remove legacy key if it exists
  localStorage.removeItem('openai_api_key');
}

/**
 * Checks if an API key is stored (without decrypting)
 */
export function hasSecureApiKey(): boolean {
  if (typeof window === 'undefined') return false;
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return true;
  
  // Check legacy key
  return !!localStorage.getItem('openai_api_key');
}
