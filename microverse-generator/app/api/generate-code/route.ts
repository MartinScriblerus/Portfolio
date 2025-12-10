import { NextRequest, NextResponse } from 'next/server';
import { extractKeywords, findMatchingPerceptualTags } from '../../../src/utils/keywordExtractor';
import { searchDSPDocsClient } from '../../../src/lib/dsp-rag/search-dsp-docs';
import { DSPDoc } from '../../../src/types/dsp-rag';
import { 
  searchPerceptualInsights, 
  extractPerceptualTagsFromInsights,
  enhanceQueryWithInsights 
} from '../../../src/utils/perceptualSearch';

// Rate limiting (in-memory, per serverless instance)
const RL = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000; // 1 minute
const MAX_REQ_PER_WINDOW = 30; // More lenient than utter endpoint

// Input validation limits
const MAX_QUERY_LENGTH = 2000;
const MAX_CURRENT_CODE_LENGTH = 10000;
const MAX_DSP_DOCS = 20;

function rateLimit(id: string): boolean {
  const now = Date.now();
  const curr = RL.get(id) || { count: 0, resetAt: now + WINDOW_MS };
  if (now > curr.resetAt) {
    curr.count = 0;
    curr.resetAt = now + WINDOW_MS;
  }
  curr.count += 1;
  RL.set(id, curr);
  return curr.count <= MAX_REQ_PER_WINDOW;
}

function sanitizeError(error: any, isProduction = process.env.NODE_ENV === 'production'): string {
  if (!isProduction) {
    return error?.message || String(error);
  }
  // In production, return generic error messages
  if (error?.message?.includes('OpenAI') || error?.message?.includes('API')) {
    return 'External service error';
  }
  if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
    return 'Network error';
  }
  return 'Internal server error';
}

type GenerateCodeInput = {
  query: string;
  dspDocs?: Array<DSPDoc & { similarity?: number }>;
  currentCode?: string; // Current ChucK code state for debugging/context
  // apiKey removed - no longer needed
};

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const fwd = req.headers.get('x-forwarded-for');
    const real = req.headers.get('x-real-ip');
    const ip = (fwd ? fwd.split(',')[0].trim() : (real || 'anon'));
    if (!rateLimit(String(ip))) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = (await req.json().catch(() => ({}))) as GenerateCodeInput;
    const { query, dspDocs = [] } = body;

    // Input validation
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    if (query.length > MAX_QUERY_LENGTH) {
      return NextResponse.json(
        { error: `Query too long. Maximum length is ${MAX_QUERY_LENGTH} characters` },
        { status: 400 }
      );
    }

    if (Array.isArray(dspDocs) && dspDocs.length > MAX_DSP_DOCS) {
      return NextResponse.json(
        { error: `Too many DSP docs. Maximum is ${MAX_DSP_DOCS}` },
        { status: 400 }
      );
    }

    // Find the best matching example from Supabase search results
    // Filter for examples with actual code content
    let validExamples = dspDocs
      .filter(doc => doc.content && doc.content.trim().length > 20) // Must have actual code
      .sort((a, b) => (b.similarity || 0) - (a.similarity || 0)); // Sort by similarity (highest first)

    // Fallback: If no examples found, try searching by perceptual tags and perceptual insights
    if (validExamples.length === 0) {
      console.log('[generate-code] No examples found, trying perceptual fallback...');
      
      try {
        // Extract keywords from query
        const keywords = extractKeywords(query);
        console.log('[generate-code] Extracted keywords:', keywords);
        
        if (keywords.length > 0) {
          // Step 1: Try matching to existing perceptual tags
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                         (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
          const tagsRes = await fetch(`${baseUrl}/api/perceptual-tags`);
          
          let matchingTags: string[] = [];
          
          if (tagsRes.ok) {
            const tagsData = await tagsRes.json();
            const availableTags = tagsData.tags || [];
            console.log('[generate-code] Found', availableTags.length, 'available perceptual tags');
            
            // Find matching tags
            matchingTags = findMatchingPerceptualTags(keywords, availableTags);
            console.log('[generate-code] Matching perceptual tags:', matchingTags);
          } else {
            console.warn('[generate-code] Failed to fetch perceptual tags:', tagsRes.status);
          }
          
          // Step 2: If no tags matched, or we want additional context, search perceptual DB
          let perceptualInsights: any[] = [];
          let enhancedQuery = query;
          
          if (matchingTags.length === 0 || keywords.length > matchingTags.length) {
            console.log('[generate-code] Searching perceptual/philosophy DB for insights...');
            perceptualInsights = await searchPerceptualInsights(query, 3, 0.3);
            console.log('[generate-code] Found', perceptualInsights.length, 'perceptual insights');
            
            if (perceptualInsights.length > 0) {
              // Extract additional perceptual tags from insights
              const insightTags = extractPerceptualTagsFromInsights(perceptualInsights);
              console.log('[generate-code] Extracted tags from insights:', insightTags);
              
              // Combine with existing matching tags
              matchingTags = Array.from(new Set([...matchingTags, ...insightTags.slice(0, 3)]));
              
              // Enhance query with insights
              enhancedQuery = enhanceQueryWithInsights(query, perceptualInsights);
              console.log('[generate-code] Enhanced query:', enhancedQuery);
            }
          }
          
          // Step 3: Search again using perceptual tags and/or enhanced query
          if (matchingTags.length > 0 || enhancedQuery !== query) {
            const fallbackResults = await searchDSPDocsClient(
              enhancedQuery, // Use enhanced query if available
              {
                language: 'chuck',
                perceptualTags: matchingTags.length > 0 ? matchingTags.slice(0, 3) : undefined
              },
              5
            );
            
            console.log('[generate-code] Perceptual fallback found', fallbackResults.length, 'results');
            
            // Update validExamples with fallback results
            validExamples = fallbackResults
              .filter(doc => doc.content && doc.content.trim().length > 20)
              .sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
          }
        }
      } catch (fallbackError: any) {
        console.warn('[generate-code] Perceptual fallback failed:', fallbackError);
        // Continue to return error if fallback also fails
      }
    }

    if (validExamples.length === 0) {
      return NextResponse.json(
        { 
          error: 'No matching ChucK examples found',
          hint: 'Try a different search query or check your Supabase knowledge base'
        },
        { status: 404 }
      );
    }

    // Return the best matching example (highest similarity)
    const bestMatch: DSPDoc & { similarity?: number } = validExamples[0];
    let code = bestMatch.content || '';

    // Clean up the code
    code = code.trim();

    // Ensure it's valid ChucK code (has ChucK syntax)
    if (!code.includes('=>') && !code.includes('::') && !code.includes('dac')) {
      // If the best match doesn't look like ChucK code, try the next one
      const nextMatch = validExamples.find(ex => 
        ex.content?.includes('=>') || ex.content?.includes('dac')
      );
      if (nextMatch?.content) {
        code = nextMatch.content.trim();
      }
    }

    if (!code || code.length < 10) {
      return NextResponse.json(
        { 
          error: 'No valid ChucK code found in examples',
          hint: 'The search results don\'t contain complete ChucK code examples'
        },
        { status: 404 }
      );
    }

    // Validate and auto-fix the code
    const { validateAndFixChuckCode } = await import('../../../src/utils/chuckCodeValidator');
    const validation = await validateAndFixChuckCode(code, 5);
    
    if (validation.fixedCode && validation.fixedCode !== code) {
      console.log('[generate-code] Code was auto-fixed:', {
        originalLength: code.length,
        fixedLength: validation.fixedCode.length,
        removedLines: validation.removedLines,
        attempts: validation.attempts
      });
      code = validation.fixedCode;
    }

    console.log('[generate-code] Returning best match:', {
      title: bestMatch.title,
      similarity: bestMatch.similarity,
      codeLength: code.length,
      totalExamples: validExamples.length,
      wasFixed: validation.fixedCode !== bestMatch.content,
      removedLines: validation.removedLines
    });

    return NextResponse.json({
      code,
      meta: {
        examplesUsed: dspDocs.length,
        bestMatch: {
          ...(('id' in bestMatch && bestMatch.id) ? { id: bestMatch.id } : {}), // Include ID if it exists
          title: bestMatch.title,
          similarity: bestMatch.similarity,
          perceptual_tags: bestMatch.perceptual_tags,
          technical_tags: bestMatch.technical_tags,
        },
        validation: validation.removedLines ? {
          wasFixed: true,
          removedLines: validation.removedLines,
          attempts: validation.attempts
        } : undefined,
        source: 'supabase_rag', // Indicate this came from RAG, not LLM generation
      },
    });
  } catch (error: any) {
    console.error('[generate-code] Error:', error);
    return NextResponse.json(
      { error: sanitizeError(error) },
      { status: 500 }
    );
  }
}
