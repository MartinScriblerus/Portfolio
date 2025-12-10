/**
 * Utility for matching .wav file references in ChucK code to available files
 */

// List of available .wav files in /public directory
const AVAILABLE_WAV_FILES = [
  'Conga.wav',
  'DR-55Hat.wav',
  'DR-55Kick.wav',
  'DR-55Pop.wav',
  'DR-55Snare.wav',
  'Dr55Kick.wav', // Note: different casing
];

/**
 * Extract .wav file references from ChucK code
 */
export function extractWavReferences(code: string): string[] {
  const wavPattern = /["']([^"']+\.wav)["']/gi;
  const matches = code.matchAll(wavPattern);
  const files: string[] = [];
  
  for (const match of matches) {
    const filename = match[1];
    if (filename && !files.includes(filename)) {
      files.push(filename);
    }
  }
  
  // Also check for SndBuf.read() patterns
  const sndBufPattern = /SndBuf\s+\w+\s*;\s*\w+\.read\(["']([^"']+\.wav)["']\)/gi;
  const sndBufMatches = code.matchAll(sndBufPattern);
  for (const match of sndBufMatches) {
    const filename = match[1];
    if (filename && !files.includes(filename)) {
      files.push(filename);
    }
  }
  
  return files;
}

/**
 * Find the closest matching .wav file by filename similarity
 * Uses Levenshtein distance for fuzzy matching
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  const len1 = str1.length;
  const len2 = str2.length;

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + 1
        );
      }
    }
  }

  return matrix[len1][len2];
}

/**
 * Find closest matching .wav file
 * Returns the best match and all candidates (if multiple close matches)
 */
export function findClosestWavFile(
  reference: string,
  threshold: number = 3 // Max Levenshtein distance for auto-match
): { bestMatch: string | null; candidates: Array<{ filename: string; distance: number }> } {
  const normalizedRef = reference.toLowerCase().trim();
  
  // First, try exact match (case-insensitive)
  const exactMatch = AVAILABLE_WAV_FILES.find(
    file => file.toLowerCase() === normalizedRef
  );
  if (exactMatch) {
    return {
      bestMatch: exactMatch,
      candidates: [{ filename: exactMatch, distance: 0 }]
    };
  }
  
  // Calculate distances for all files
  const candidates = AVAILABLE_WAV_FILES.map(file => ({
    filename: file,
    distance: levenshteinDistance(normalizedRef, file.toLowerCase())
  })).sort((a, b) => a.distance - b.distance);
  
  const bestMatch = candidates[0].distance <= threshold 
    ? candidates[0].filename 
    : null;
  
  return { bestMatch, candidates };
}

/**
 * Replace .wav file references in code with available files
 * Returns the modified code and a map of replacements made
 */
export function replaceWavFiles(
  code: string,
  replacements: Map<string, string> // Map of original -> replacement
): string {
  let modifiedCode = code;
  
  for (const [original, replacement] of replacements.entries()) {
    // Replace in quotes
    modifiedCode = modifiedCode.replace(
      new RegExp(`["']${original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'gi'),
      `"${replacement}"`
    );
    
    // Replace in SndBuf.read() calls
    modifiedCode = modifiedCode.replace(
      new RegExp(`SndBuf\\s+\\w+\\s*;\\s*\\w+\\.read\\(["']${original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']\\)`, 'gi'),
      (match) => match.replace(original, replacement)
    );
  }
  
  return modifiedCode;
}

/**
 * Get all available .wav files
 */
export function getAvailableWavFiles(): string[] {
  return [...AVAILABLE_WAV_FILES];
}
