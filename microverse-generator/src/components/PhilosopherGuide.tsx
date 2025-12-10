/* eslint-disable @typescript-eslint/no-use-before-define */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAgentStore } from '../agent/useAgentStore';
import { stepAgent, registerTasks } from '../agent/taskEngine';
import { useQueryStore } from '../store/useQueryStore';
import { useVisStore } from '../store/useVisStore';
import { useOldMonolithStore } from '../store/useOldMonolithStore';
import obliqueStrategiesData from '../../data/oblique-strategies.json';

// DSP RAG imports
import { searchDSPDocsClient } from '../lib/dsp-rag/search-dsp-docs';
import { DSPDoc } from '../types/dsp-rag';
import ChuckCodeDisplay from './ChuckCodeDisplay';
// BYOTTokenManager removed - no longer needed (OpenAI removed)
import { useChuckCodeState, formatCodeStateForRAG } from '../hooks/useChuckCodeState';

export default function CodeGuide() {

  // Select fields individually to avoid creating new objects every render
  const currentTaskId = useAgentStore((s) => s.currentTaskId);
  const tasks = useAgentStore((s) => s.tasks);
  const status = useAgentStore((s) => s.status);
  const [text, setText] = useState<string>('');
  const query = useQueryStore((s) => s.query);
  const setQuery = useQueryStore((s) => s.setQuery);
  const submitVersion = useQueryStore((s) => s.submitVersion);
  const setInFlight = useQueryStore((s) => s.setInFlight);
  // Hook must be called before any conditional returns (Rules of Hooks)
  // Subscribe directly to intro.active to ensure reactivity
  const introActive = useVisStore((s) => s.intro.active);
  const clickedBegin = useOldMonolithStore((s) => s.clickedBegin);
  // Component should show when EITHER intro is skipped OR clickedBegin is true
  const shouldShow = !introActive || clickedBegin;
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [chat, setChat] = useState<Array<{ role: 'guide' | 'you'; text: string }>>([
    { role: 'guide', text: '' }
  ]);

  // DSP docs state
  const [dspDocs, setDspDocs] = useState<Array<DSPDoc & { similarity: number }>>([]);
  const [selectedCodeDoc, setSelectedCodeDoc] = useState<DSPDoc | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [generatingCode, setGeneratingCode] = useState<boolean>(false);
  const [bestMatchId, setBestMatchId] = useState<string | null>(null); // Track which doc was used as best match
  const [wavReplacements, setWavReplacements] = useState<Map<string, string>>(new Map()); // Track .wav file replacements

  // Start state
  const [started, setStarted] = useState<boolean>(false);
  
  // API Key removed - no longer needed (using Supabase RAG directly)
  
  // ChucK code state observation
  const chuckCodeState = useChuckCodeState(2000);

  const task = useMemo(() => tasks.find((t) => t.id === currentTaskId), [tasks, currentTaskId]);
  
  // Debug logging - must be before any conditional returns (Rules of Hooks)
  useEffect(() => {
    console.log('[CodeGuide] Component mounted/updated - introActive:', introActive, 'clickedBegin:', clickedBegin, 'shouldShow:', shouldShow, 'task:', task?.id, 'started:', started);
  }, [introActive, clickedBegin, shouldShow, task?.id, started]);

  // On task changes, seed a guide line to keep it alive.
  useEffect(() => {
    if (!task) return;
    setChat((c) => c.length === 0 ? [{ role: 'guide', text: task.name }] : c);
  }, [task?.id]);

  // Register a small default sequence of tasks once
  useEffect(() => {
    const s = useAgentStore.getState();
    
    // Safely load Oblique Strategies from JSON
    const obliqueStrategies: string[] = Array.isArray(obliqueStrategiesData?.strategies)
      ? obliqueStrategiesData.strategies
          .map((s: { id?: number; text?: string }) => s?.text)
          .filter((text): text is string => typeof text === 'string' && text.length > 0)
      : [];
    
    const initialPrompts = [
      "Describe an effect you'd like to create...",
      "Click start to begin...",
      ...obliqueStrategies
    ];
    
    // Proper random index in [0, length)
    const idx = Math.floor(Math.random() * initialPrompts.length);
    setChat([{ role: 'guide', text: initialPrompts[idx] }])
    if (s.tasks.length === 0) {
      registerTasks([
        {
          id: 't1',
          name: 'Tap upon the surface thrice to awaken the image',
          check: (t) => t.clicks >= 3,
          onSuccess: () => console.log('[Agent] t1 success'),
        },
        {
          id: 't2',
          name: 'Hold the world steady—bring your gaze to the proper distance',
          check: (t) => t.cameraRadius >= 14, // reached after the expansion lerp
          onSuccess: () => console.log('[Agent] t2 success'),
        },
        {
          id: 't3',
          name: 'Resolve the veil—wait until the image clears on its own',
          check: (t) => t.past30 === true, // after the video clears
          onSuccess: () => console.log('[Agent] t3 success'),
        },
      ]);
    }
  }, []);

  // Poll agent checks lightly
  useEffect(() => {
    const id = setInterval(() => stepAgent(), 200);
    return () => clearInterval(id);
  }, []);


  const run = useCallback(async () => {
    setLoading(true); setErr(null);
    setInFlight(true);
    setGeneratedCode(null); // Clear previous generated code
    
    try {
      const q = (query || '').trim();
      if (!q) { setLoading(false); setInFlight(false); return; }
      
      // Add user message to chat
      setChat((c) => [...c, { role: 'you', text: q }]);
      
      // Clear input immediately
      setQuery('');
      
      // PRIMARY FLOW: Oblique Strategies + ChucK Code Generation
      // 1. Search DSP docs for ChucK code examples
      // 2. Generate agent response using Oblique Strategies
      // 3. Generate ChucK code based on user request
      
      // Get current ChucK code state for context
      const codeContext = chuckCodeState.code ? formatCodeStateForRAG(chuckCodeState) : null;
      
      // Search DSP docs for ChucK code examples (always do this)
      console.log('[CodeGuide] Searching DSP docs for:', q);
      let dspResults: Array<DSPDoc & { similarity: number }> = [];
      try {
        const dspSearchPromise = searchDSPDocsClient(q, { language: 'chuck' }, 5);
        dspResults = await dspSearchPromise;
        console.log('[CodeGuide] DSP search returned', dspResults.length, 'results');
        setDspDocs(dspResults);
        setBestMatchId(null); // Reset best match when new search
        setWavReplacements(new Map()); // Reset .wav replacements
      } catch (dspErr: any) {
        console.error('[CodeGuide] DSP search failed:', dspErr);
        // Continue with empty results - code generation can still work
        setDspDocs([]);
      }
      
      // Pick a random Oblique Strategy to guide the conversation
      const obliqueStrategies: string[] = Array.isArray(obliqueStrategiesData?.strategies)
        ? obliqueStrategiesData.strategies
            .map((s: { id?: number; text?: string }) => s?.text)
            .filter((text): text is string => typeof text === 'string' && text.length > 0)
        : [];
      const randomStrategy = obliqueStrategies[Math.floor(Math.random() * obliqueStrategies.length)] || 'What is the reality of the situation?';
      
      // Generate agent response using Oblique Strategy + DSP context
      // Use DSP docs as "snippets" for the agent to reference
      const dspSnippets = dspResults.slice(0, 3).map(doc => {
        const usage = Array.isArray(doc.example_usage) ? doc.example_usage[0] : doc.example_usage;
        return `${doc.title}: ${doc.content || usage || ''}`.slice(0, 200);
      });
      
      // Generate agent response with Oblique Strategy persona (using rule-based fallback)
      let agentResponse: string | null = null;
      try {
        // No API key needed - /api/utter uses rule-based fallback only
        const utterRes = await fetch('/api/utter', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: q,
            snippets: dspSnippets,
            keywords: dspResults.slice(0, 5).flatMap(d => d.perceptual_tags || []).slice(0, 8),
            citations: [],
            bans: [],
            style: {
              persona: `A ChucK code generation assistant guided by Oblique Strategies. Current strategy: "${randomStrategy}". Help users create sound synthesis code.`,
              tone: 'Terse, creative, and technically precise. Reference ChucK syntax naturally.'
            }
            // apiKey removed - no longer needed
          })
        });
        
        if (utterRes.ok) {
          const utterData = await utterRes.json();
          agentResponse = utterData.text || null;
        }
      } catch (utterErr) {
        console.warn('[CodeGuide] Agent response generation failed:', utterErr);
      }
      
      // Always generate ChucK code (primary action) - THIS IS THE MAIN FOCUS
      // No longer requires OpenAI API key - uses Supabase RAG directly
      setGeneratingCode(true);
      let codeGenerated = false;
      let generatedCodeText: string | null = null;
      
      try {
        console.log('[CodeGuide] Getting ChucK code from Supabase RAG. Query:', q, 'Found', dspResults.length, 'examples');
        
        const codeRes = await fetch('/api/generate-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: q,
            dspDocs: dspResults.slice(0, 5).map(doc => ({
              title: doc.title,
              content: doc.content, // Use 'content' field which has actual code
              example_usage: doc.example_usage, // Keep for reference but prefer content
              perceptual_tags: doc.perceptual_tags,
              technical_tags: doc.technical_tags,
              similarity: doc.similarity,
            })),
            currentCode: codeContext, // Include current ChucK code state for debugging/context
            // apiKey removed - no longer needed
          }),
        });
        
        console.log('[CodeGuide] Code generation response status:', codeRes.status);
        
        if (codeRes.ok) {
          const codeData = await codeRes.json();
          console.log('[CodeGuide] Code from RAG:', codeData);
          if (codeData.code && codeData.code.trim().length > 10) {
            generatedCodeText = codeData.code;
            
            // Track which doc was used as best match (to avoid duplicates)
            const bestMatch = codeData.meta?.bestMatch;
            // Try to find the matching doc in dspResults by title/similarity
            if (bestMatch && dspResults.length > 0) {
              const matchingDoc = dspResults.find(doc => 
                doc.id === bestMatch.id || 
                (doc.title === bestMatch.title && doc.similarity === bestMatch.similarity)
              );
              if (matchingDoc?.id) {
                setBestMatchId(matchingDoc.id);
              } else if (bestMatch.id) {
                setBestMatchId(bestMatch.id);
              }
            }
            
            // Process .wav file references
            if (generatedCodeText) {
              const { extractWavReferences, findClosestWavFile, replaceWavFiles } = await import('../utils/wavFileMatcher');
              // Use local variable to ensure TypeScript type narrowing
              let codeText: string = generatedCodeText;
              const wavRefs = extractWavReferences(codeText);
              const replacements = new Map<string, string>();
              
              for (const wavRef of wavRefs) {
                const { bestMatch: closestFile } = findClosestWavFile(wavRef);
                if (closestFile && closestFile !== wavRef) {
                  replacements.set(wavRef, closestFile);
                  console.log(`[CodeGuide] Auto-replaced .wav: "${wavRef}" -> "${closestFile}"`);
                }
              }
              
              // Apply replacements if any
              if (replacements.size > 0) {
                codeText = replaceWavFiles(codeText, replacements);
                setWavReplacements(replacements);
              }
              
              // Update generatedCodeText with processed version
              generatedCodeText = codeText;
            }
            
            setGeneratedCode(generatedCodeText);
            codeGenerated = true;
            // Create a synthetic DSP doc for display
            setSelectedCodeDoc({
              title: bestMatch?.title || `Found: ${q}`,
              content: generatedCodeText,
              example_usage: [generatedCodeText],
              perceptual_tags: bestMatch?.perceptual_tags || ['from_knowledge_base'],
              technical_tags: bestMatch?.technical_tags || [],
            } as DSPDoc);
            console.log('[CodeGuide] Successfully retrieved code from RAG, length:', generatedCodeText?.length || 0);
          } else {
            console.warn('[CodeGuide] Code too short or empty:', codeData);
            setChat((c) => [...c, { 
              role: 'guide', 
              text: `⚠️ No matching ChucK code found. Try a more specific query or check your Supabase knowledge base.` 
            }]);
            setGeneratedCode(null);
            setSelectedCodeDoc(null);
          }
        } else {
          const errorResponseText = await codeRes.text();
          let errorData: any = {};
          try {
            errorData = JSON.parse(errorResponseText);
          } catch {}
          console.error('[CodeGuide] Code retrieval failed:', codeRes.status, errorResponseText);
          
          // Show specific error message based on status code
          let errorMessage = errorData?.error || 'Failed to retrieve code';
          let hint = errorData?.hint || '';
          
          if (codeRes.status === 404) {
            errorMessage = 'No matching ChucK examples found';
            hint = 'Try a different search query or check your Supabase knowledge base';
          } else if (codeRes.status === 429) {
            errorMessage = 'Rate limit exceeded';
            hint = 'Too many requests. Please wait a moment and try again.';
          } else if (codeRes.status >= 500) {
            errorMessage = 'Service temporarily unavailable';
            hint = 'Please try again in a few moments';
          }
          
          const formattedErrorText = hint 
            ? `❌ Code retrieval failed: ${errorMessage}\n\n💡 ${hint}`
            : `❌ Code retrieval failed: ${errorMessage}`;
          
          setChat((c) => [...c, { 
            role: 'guide', 
            text: formattedErrorText
          }]);
          setGeneratedCode(null);
          setSelectedCodeDoc(null);
        }
      } catch (codeErr: any) {
        console.error('[CodeGuide] Code generation error:', codeErr);
        setChat((c) => [...c, { 
          role: 'guide', 
          text: `❌ Code generation error: ${codeErr?.message || 'Unknown error'}` 
        }]);
        setGeneratedCode(null);
        setSelectedCodeDoc(null);
      } finally {
        setGeneratingCode(false);
      }
      
      // Show agent response ONLY if code was successfully generated
      // This ensures code generation is the primary focus, not philosophy chat
      if (codeGenerated && generatedCodeText && generatedCodeText.trim().length > 0) {
        if (agentResponse) {
          setChat((c) => [...c, { role: 'guide', text: agentResponse! }]);
        } else {
          // Fallback: show Oblique Strategy as agent response
          setChat((c) => [...c, { 
            role: 'guide', 
            text: `💭 ${randomStrategy}\n\n🎵 I've generated ChucK code based on your request. Check the code below to test in WebChucK IDE.` 
          }]);
        }
      }
      // If code generation failed, error message was already added above
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
      setInFlight(false);
    }
  }, [query, chuckCodeState]);

  // React to shared submit events (from AskPanel or others)
  useEffect(() => {
    if (!query || !query.trim()) return;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitVersion]);

  // Hide entire component until main Start button (under animated title) is clicked
  // Use CSS visibility instead of conditional return to avoid hook order issues
  // Note: introActive is true when intro is active (should hide), false when skipped (should show)
  // Also check clickedBegin as an alternative trigger
  const isHidden = !shouldShow; // Hide if intro is active AND clickedBegin is false
  
  // Don't return null - render but hide so we can debug
  // if (!task) return null;
  
  // If no task, show a message instead of hiding completely
  if (!task) {
    return (
      <div style={{ 
        position: 'fixed', 
        bottom: 240, 
        left: 16, 
        padding: '12px 14px', 
        background: 'rgba(255,0,0,0.5)', 
        color: '#fff', 
        fontSize: '12px',
        zIndex: 100000,
        display: 'block', // Always show debug message
        pointerEvents: 'auto',
        border: '2px solid red',
      }}>
        [DEBUG] No task found - introActive: {String(introActive)}, isHidden: {String(isHidden)}
      </div>
    );
  }
  
  // Show start button if not started - hide all RAG interface until Start is clicked
  if (!started) {
    return (
      <div 
        role="region"
        aria-label="ChucK Code Guide"
        style={{ 
          position: 'fixed', // Use fixed to ensure it's above the canvas
          bottom: 240, 
          left: 16, 
          maxWidth: 540, 
          padding: '12px 14px', 
          background: 'rgba(0,0,0,0.5)', 
          color: '#e9f1ff', 
          fontFamily: 'system-ui', 
          borderRadius: 8, 
          zIndex: 100000,
          display: isHidden ? 'none' : 'block', // Use display instead of visibility for stronger hiding
          opacity: isHidden ? 0 : 1,
          pointerEvents: isHidden ? 'none' : 'auto',
          transition: 'opacity 0.3s ease',
          border: isHidden ? '3px solid red' : '1px solid rgba(255,255,255,0.15)', // Debug border
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold' }}>
            ChucK Code Generator
          </h3>
          <p style={{ margin: '0 0 12px 0', fontSize: '11px', opacity: 0.8 }}>
            An agent guided by Oblique Strategies will help you generate ChucK code. Describe the sound or effect you want to create.
          </p>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('[CodeGuide] Start button clicked!');
              setStarted(true);
            }}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: 6,
              border: '1px solid rgba(74,222,128,0.5)',
              background: 'rgba(74,222,128,0.2)',
              color: '#4ade80',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 'bold',
            }}
          >
            Start
          </button>
        </div>
      </div>
    );
  }

  // Only show RAG interface after Start is clicked
  // Double-check: if somehow started is false, don't render RAG interface
  if (!started) {
    return null;
  }

  return (
    <div 
      role="region"
      aria-label="Code guide conversation"
      style={{ 
        position: 'fixed', // Use fixed to ensure it's above the canvas
        bottom: 240, 
        left: 16, 
        maxWidth: 540, 
        padding: '12px 14px', 
        background: 'rgba(0,0,0,0.5)', 
        color: '#e9f1ff', 
        fontFamily: 'system-ui', 
        border: '1px solid rgba(255,255,255,0.15)', 
        borderRadius: 8, 
        zIndex: 100000,
        display: isHidden ? 'none' : 'block', // Use display instead of visibility for stronger hiding
        opacity: isHidden ? 0 : 1,
        pointerEvents: isHidden ? 'none' : 'auto',
        transition: 'opacity 0.3s ease'
      }}
      onClick={(e) => {
        // Prevent clicks from bubbling when hidden
        if (isHidden) {
          e.stopPropagation();
        }
      }}
    >
      {/* Status - Using Supabase RAG (no API key needed) */}
      <div style={{ marginBottom: 8, fontSize: '10px' }}>
        <div style={{ padding: '4px 8px', background: 'rgba(34,197,94,0.2)', borderRadius: 4, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>✅ Using Supabase RAG - No API key needed</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 240, overflowY: 'auto', paddingRight: 8, fontSize: '10px', fontFamily: 'monospace' }}>
        {chat.map((m, i) => (
          <div key={i} style={{ whiteSpace: 'pre-wrap', fontSize: 12, margin: 4, opacity: m.role === 'you' ? 0.9 : 1 }}>
            {m.text}
          </div>
        ))}
      </div>
      <div style={{ margin: 0, marginTop: 12, width: '100%', display: 'flex', gap: 8, flexDirection: 'row' }}>
        <label htmlFor="code-guide-input" className="sr-only">
          Describe the ChucK code you want to generate
        </label>
        <input
          id="code-guide-input"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          placeholder="Describe the sound or effect you want to create..."
          aria-label="Describe the ChucK code you want to generate"
          style={{
            width: '100%',
            padding: '8px 10px',
            borderRadius: 6,
            fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
            border: '1px solid rgba(255,255,255,0.18)',
            background: 'rgba(0,0,0,0.25)',
            color: '#e9f1ff',
            maxWidth: '420px'
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !loading && query.trim()) {
              run();
            }
          }}
        />
        <button
          id="code-guide-send"
          disabled={loading}
          onClick={run}
          aria-label={loading ? 'Sending message' : 'Send message to code guide'}
          style={{
            marginTop: 8,
            marginLeft: 12,
            padding: '8px 10px',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.18)',
            background: loading ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.25)',
            color: '#e9f1ff',
            cursor: loading ? 'default' : 'pointer'
          }}
        >
          {loading ? 'Sending…' : 'Send'}
        </button>
      </div>
      
      {/* Display generated code or ChucK code examples */}
      {(generatingCode || generatedCode || dspDocs.length > 0) && (
        <div style={{ marginTop: 12, maxHeight: 300, overflowY: 'auto' }}>
          {generatingCode && (
            <div style={{ 
              padding: '12px',
              background: 'rgba(0,0,0,0.6)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 6,
              fontSize: '11px',
              color: '#e9f1ff',
              textAlign: 'center'
            }}>
              ⚙️ Generating ChucK code...
            </div>
          )}
          
          {generatedCode && !generatingCode && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ 
                marginBottom: 8, 
                fontSize: '11px', 
                fontWeight: 'bold',
                color: '#4ade80',
                opacity: 0.9
              }}>
                ✨ Generated Code
              </div>
              <ChuckCodeDisplay 
                doc={{
                  title: 'Generated Code',
                  example_usage: generatedCode,
                  perceptual_tags: ['generated'],
                } as DSPDoc}
                onCopy={(code) => {
                  console.log('[CodeGuide] Generated code copied to clipboard:', code);
                }}
              />
            </div>
          )}
          
          {dspDocs.length > 0 && (() => {
            // Filter out the best match to avoid duplicates
            const filteredDocs = bestMatchId 
              ? dspDocs.filter(doc => doc.id !== bestMatchId)
              : dspDocs;
            
            const displayCount = generatedCode ? 2 : 3;
            const docsToShow = filteredDocs.slice(0, displayCount);
            
            if (docsToShow.length === 0) return null;
            
            return (
              <>
                <div style={{ 
                  marginBottom: 8, 
                  fontSize: '11px', 
                  fontWeight: 'bold',
                  color: '#e9f1ff',
                  opacity: 0.9
                }}>
                  🎵 Reference Examples ({filteredDocs.length})
                </div>
                
                {docsToShow.map((doc, idx) => (
                  <ChuckCodeDisplay 
                    key={doc.id || idx} 
                    doc={doc}
                    onCopy={(code) => {
                      console.log('[CodeGuide] Code copied to clipboard, ready for WebChucK IDE:', code);
                    }}
                  />
                ))}
                
                {filteredDocs.length > displayCount && (
                  <div style={{ 
                    marginTop: 8, 
                    fontSize: '10px', 
                    opacity: 0.7,
                    fontStyle: 'italic'
                  }}>
                    ... and {filteredDocs.length - displayCount} more example{filteredDocs.length - displayCount > 1 ? 's' : ''}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
