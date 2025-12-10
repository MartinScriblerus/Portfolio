/**
 * Extract meaningful keywords from text for matching against perceptual tags
 */

// Common stop words to filter out
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
  'to', 'was', 'will', 'with', 'the', 'this', 'i', 'you', 'we', 'they',
  'what', 'which', 'who', 'when', 'where', 'why', 'how', 'can', 'could',
  'should', 'would', 'may', 'might', 'must', 'have', 'had', 'has', 'do',
  'does', 'did', 'get', 'got', 'make', 'made', 'go', 'went', 'come', 'came',
  'see', 'saw', 'know', 'knew', 'think', 'thought', 'want', 'wanted',
  'need', 'needed', 'use', 'used', 'try', 'tried', 'work', 'worked'
]);

/**
 * Extract keywords from text
 * - Removes stop words
 * - Normalizes (lowercase, trim)
 * - Filters out very short words (< 2 chars)
 * - Returns unique keywords sorted by length (longer = more specific)
 */
export function extractKeywords(text: string): string[] {
  if (!text || typeof text !== 'string') return [];
  
  // Normalize: lowercase, remove punctuation, split into words
  const normalized = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .split(/\s+/)
    .filter(word => word.length >= 2) // At least 2 characters
    .filter(word => !STOP_WORDS.has(word)) // Remove stop words
    .filter(word => !/^\d+$/.test(word)); // Remove pure numbers
  
  // Get unique keywords, sorted by length (longer = more specific)
  const unique = Array.from(new Set(normalized));
  return unique.sort((a, b) => b.length - a.length);
}

/**
 * Find perceptual tags that match keywords
 * Uses fuzzy matching: tag contains keyword or keyword contains tag
 */
export function findMatchingPerceptualTags(
  keywords: string[],
  availableTags: string[]
): string[] {
  if (!keywords.length || !availableTags.length) return [];
  
  const matches: string[] = [];
  const normalizedTags = availableTags.map(tag => tag.toLowerCase().trim());
  
  for (const keyword of keywords) {
    const normalizedKeyword = keyword.toLowerCase().trim();
    
    // Find tags that match this keyword
    for (const tag of normalizedTags) {
      // Exact match
      if (tag === normalizedKeyword) {
        if (!matches.includes(tag)) matches.push(tag);
        continue;
      }
      
      // Tag contains keyword (e.g., "dark ambient" contains "dark")
      if (tag.includes(normalizedKeyword) && normalizedKeyword.length >= 3) {
        if (!matches.includes(tag)) matches.push(tag);
        continue;
      }
      
      // Keyword contains tag (e.g., "ambient sound" contains "ambient")
      if (normalizedKeyword.includes(tag) && tag.length >= 3) {
        if (!matches.includes(tag)) matches.push(tag);
        continue;
      }
      
      // Fuzzy match: check if words overlap (e.g., "dark" matches "dark ambient")
      const tagWords = tag.split(/\s+/);
      const keywordWords = normalizedKeyword.split(/\s+/);
      
      for (const tagWord of tagWords) {
        for (const keywordWord of keywordWords) {
          if (tagWord.length >= 3 && keywordWord.length >= 3) {
            if (tagWord.includes(keywordWord) || keywordWord.includes(tagWord)) {
              if (!matches.includes(tag)) matches.push(tag);
              break;
            }
          }
        }
      }
    }
  }
  
  return matches;
}
