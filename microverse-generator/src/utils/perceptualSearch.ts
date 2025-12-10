/**
 * Search the perception/philosophy vector database for insights about unknown words/concepts
 * Used to inform ChucK code search when keywords don't match existing perceptual tags
 */

import { matchDocuments } from '../rag/querySupabase';

// Cache for embedding model
let embeddingModel: any = null;

async function getEmbedding(text: string): Promise<number[]> {
  // Use server-side embedding generation
  try {
    // Try to use the embed API endpoint (works in both server and client)
    const baseUrl = typeof window !== 'undefined' 
      ? '' // Client-side: use relative URL
      : (process.env.NEXT_PUBLIC_BASE_URL || 
         (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'));
    
    const embedRes = await fetch(`${baseUrl}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    
    if (embedRes.ok) {
      const embedData = await embedRes.json();
      const embedding = Array.isArray(embedData.embedding) 
        ? embedData.embedding.map((x: any) => Number(x))
        : [];
      
      if (embedding.length > 0) {
        return embedding;
      }
    }
  } catch (error) {
    console.warn('[perceptualSearch] Failed to get embedding via API:', error);
  }
  
  // Fallback: return empty array
  return [];
}

export interface PerceptualInsight {
  content: string;
  author: string;
  work: string;
  similarity: number;
  extractedConcepts?: string[]; // Key concepts extracted from the content
}

/**
 * Search the documents table for perceptual/philosophical insights about a query
 * Returns insights that can inform code generation
 */
export async function searchPerceptualInsights(
  query: string,
  maxResults: number = 5,
  minSimilarity: number = 0.3
): Promise<PerceptualInsight[]> {
  try {
    // Get embedding for the query
    const embedding = await getEmbedding(query);
    
    if (embedding.length === 0) {
      console.warn('[perceptualSearch] Empty embedding');
      return [];
    }
    
    // Search documents table
    const results = await matchDocuments(embedding, maxResults, minSimilarity);
    
    return results.map(r => ({
      content: r.content,
      author: r.author,
      work: r.work,
      similarity: r.similarity,
      extractedConcepts: extractKeyConcepts(r.content)
    }));
  } catch (error: any) {
    console.error('[perceptualSearch] Error:', error);
    return [];
  }
}

/**
 * Extract key concepts/phrases from perceptual content
 * Looks for meaningful terms that could relate to sound/perception
 */
function extractKeyConcepts(content: string): string[] {
  if (!content || typeof content !== 'string') return [];
  
  // Extract sentences (potential concepts)
  const sentences = content
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10 && s.length < 200) // Reasonable length
    .slice(0, 3); // Top 3 sentences
  
  // Also extract key phrases (2-4 word phrases)
  const words = content.toLowerCase().split(/\s+/);
  const phrases: string[] = [];
  
  // Extract 2-3 word phrases that might be meaningful
  for (let i = 0; i < words.length - 1; i++) {
    const twoWord = `${words[i]} ${words[i + 1]}`;
    if (twoWord.length > 5 && !twoWord.match(/^(the|a|an|is|are|was|were|this|that|these|those)\s/)) {
      phrases.push(twoWord);
    }
    
    if (i < words.length - 2) {
      const threeWord = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
      if (threeWord.length > 8) {
        phrases.push(threeWord);
      }
    }
  }
  
  // Combine and deduplicate
  const allConcepts = [...sentences, ...phrases.slice(0, 5)];
  return Array.from(new Set(allConcepts)).slice(0, 5);
}

/**
 * Extract perceptual tags or sound-related concepts from insights
 * Used to refine ChucK code search
 */
export function extractPerceptualTagsFromInsights(
  insights: PerceptualInsight[]
): string[] {
  const tags = new Set<string>();
  
  // Common sound/perception related words to look for
  const soundKeywords = [
    'sound', 'audio', 'tone', 'pitch', 'frequency', 'rhythm', 'beat',
    'harmony', 'melody', 'noise', 'silence', 'resonance', 'vibration',
    'dark', 'bright', 'warm', 'cold', 'sharp', 'soft', 'harsh', 'smooth',
    'ambient', 'atmospheric', 'textural', 'spatial', 'temporal',
    'perception', 'sensation', 'feeling', 'emotion', 'mood'
  ];
  
  for (const insight of insights) {
    const contentLower = insight.content.toLowerCase();
    
    // Look for sound-related keywords
    for (const keyword of soundKeywords) {
      if (contentLower.includes(keyword)) {
        tags.add(keyword);
      }
    }
    
    // Extract concepts that might be perceptual tags
    if (insight.extractedConcepts) {
      for (const concept of insight.extractedConcepts) {
        const conceptLower = concept.toLowerCase();
        // If concept contains sound-related words, add it
        if (soundKeywords.some(kw => conceptLower.includes(kw))) {
          // Extract the relevant part
          const parts = conceptLower.split(/\s+/);
          for (const part of parts) {
            if (part.length > 3 && soundKeywords.some(kw => part.includes(kw) || kw.includes(part))) {
              tags.add(part);
            }
          }
        }
      }
    }
  }
  
  return Array.from(tags).slice(0, 10); // Limit to top 10
}

/**
 * Generate enhanced search query from perceptual insights
 * Combines original query with insights to create a better search
 */
export function enhanceQueryWithInsights(
  originalQuery: string,
  insights: PerceptualInsight[]
): string {
  if (insights.length === 0) return originalQuery;
  
  // Extract key terms from top insights
  const topInsight = insights[0];
  const concepts = topInsight.extractedConcepts || [];
  
  // Combine original query with key concepts
  const enhancedParts = [originalQuery];
  
  // Add 1-2 most relevant concepts
  for (const concept of concepts.slice(0, 2)) {
    if (concept.length > 5 && concept.length < 50) {
      enhancedParts.push(concept);
    }
  }
  
  return enhancedParts.join(' ').slice(0, 500); // Limit length
}
