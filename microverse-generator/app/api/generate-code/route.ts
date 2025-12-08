import { NextRequest, NextResponse } from 'next/server';

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
  dspDocs?: Array<{
    title?: string;
    content?: string; // Actual ChucK code - this is what we use for examples
    example_usage?: string | string[];
    perceptual_tags?: string[];
    technical_tags?: string[];
    similarity?: number;
  }>;
  currentCode?: string; // Current ChucK code state for debugging/context
  apiKey?: string;
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
    const { query, dspDocs = [], currentCode, apiKey: clientApiKey } = body;

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

    if (currentCode && typeof currentCode === 'string' && currentCode.length > MAX_CURRENT_CODE_LENGTH) {
      return NextResponse.json(
        { error: `Current code too long. Maximum length is ${MAX_CURRENT_CODE_LENGTH} characters` },
        { status: 400 }
      );
    }

    if (Array.isArray(dspDocs) && dspDocs.length > MAX_DSP_DOCS) {
      return NextResponse.json(
        { error: `Too many DSP docs. Maximum is ${MAX_DSP_DOCS}` },
        { status: 400 }
      );
    }

    // Prefer client-provided key (BYOT), fallback to server env var
    const apiKey = clientApiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key required' }, { status: 400 });
    }

    // Format DSP docs examples for the prompt - use 'content' field which has actual code
    const codeExamples = dspDocs
      .filter(doc => doc.content && doc.content.trim().length > 20) // Must have actual code
      .slice(0, 5) // Use top 5 most relevant
      .map((doc, idx) => {
        // Use 'content' field which contains the actual ChucK code
        let code = doc.content || '';
        
        // Clean up the code (remove excessive comments if needed)
        code = code.trim();
        
        // Skip if it's just metadata or too short
        if (code.length < 20 || code.includes('---') && !code.includes('=>')) {
          return null;
        }
        
        const title = doc.title || 'Example';
        const tags = doc.perceptual_tags?.length 
          ? ` (tags: ${doc.perceptual_tags.join(', ')})`
          : '';
        return `// Example ${idx + 1}: ${title}${tags}\n${code}`;
      })
      .filter((ex): ex is string => ex !== null)
      .join('\n\n');

    // Build the code generation prompt
    const systemPrompt = `You are a ChucK programming expert. Generate clean, working ChucK code based on user requests.

CRITICAL RULES:
- Output ONLY valid ChucK code - NO explanations, NO markdown code blocks, NO comments about the code
- Start directly with ChucK code (e.g., "SinOsc osc => dac;")
- Make the code runnable and complete - it should work when pasted into WebChucK IDE
- Always connect audio units to dac (e.g., "osc => dac;")
- Include time advancement (e.g., "1::second => now;") in a loop so the code runs
- Use appropriate ChucK syntax: => for connections, :: for time, => now; for time advancement
- If user asks for a synthesizer/oscillator, create a complete working example with:
  * An oscillator (SinOsc, SawOsc, SqrOsc, TriOsc, etc.)
  * Connection to dac
  * A time loop (while(true) { ... => now; })
  * Frequency and gain control
- Keep code concise but functional - aim for 10-30 lines for simple requests
- If reference examples are provided but seem incomplete, use them only for syntax reference and generate complete code`;

    const userPrompt = `User request: ${query}

${currentCode ? `\nCurrent ChucK code state (for debugging/context):\n\`\`\`chuck\n${currentCode}\n\`\`\`\n\n` : ''}${codeExamples ? `Reference examples (use for syntax reference only):\n${codeExamples}\n\n` : 'No reference examples available. Generate code from scratch.\n\n'}Generate complete, runnable ChucK code that fulfills the user's request.${currentCode ? ' If debugging is needed, analyze the current code and suggest fixes.' : ''} Output ONLY the code, nothing else:`;

    // Call OpenAI
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[generate-code] OpenAI API error:', res.status, errorText);
      return NextResponse.json(
        { error: 'Failed to generate code', details: errorText },
        { status: res.status }
      );
    }

    const data = await res.json();
    const code = data?.choices?.[0]?.message?.content?.trim();

    if (!code) {
      return NextResponse.json(
        { error: 'No code generated' },
        { status: 500 }
      );
    }

    // Clean up the code (remove markdown code blocks if present)
    let cleanCode = code
      .replace(/^```(?:chuck|ch)?\n?/gm, '')
      .replace(/^```\n?/gm, '')
      .replace(/```$/gm, '')
      .trim();
    
    // Remove any explanatory text before the code
    // Look for common patterns like "Here's the code:" or "The code is:"
    const codeStartPatterns = [
      /^(?:here'?s?|the|this is|below is|following is).*?code[:\s]*/i,
      /^code[:\s]*/i,
      /^```/,
    ];
    
    for (const pattern of codeStartPatterns) {
      const match = cleanCode.match(pattern);
      if (match) {
        cleanCode = cleanCode.substring(match[0].length).trim();
      }
    }
    
    // If the code still looks like it has explanations, try to extract just the ChucK code
    // Look for lines that start with ChucK patterns
    const lines = cleanCode.split('\n');
    const codeLines: string[] = [];
    let inCodeBlock = false;
    
    for (const line of lines) {
      // Skip explanation lines
      if (line.match(/^(here'?s?|the|this|below|following|code|example|output)/i) && !line.includes('=>')) {
        continue;
      }
      // Start collecting when we see ChucK syntax
      if (line.includes('=>') || line.includes('::') || line.includes('dac') || line.includes('osc') || line.includes('SinOsc') || line.includes('SawOsc')) {
        inCodeBlock = true;
      }
      if (inCodeBlock || line.trim().startsWith('//')) {
        codeLines.push(line);
      }
    }
    
    if (codeLines.length > 0) {
      cleanCode = codeLines.join('\n').trim();
    }

    return NextResponse.json({
      code: cleanCode,
      meta: {
        examplesUsed: dspDocs.length,
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
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
