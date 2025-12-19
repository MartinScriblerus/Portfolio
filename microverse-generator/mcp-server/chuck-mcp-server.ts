#!/usr/bin/env node
/**
 * MCP Server for ChucK Knowledge Base
 * 
 * Exposes your Supabase ChucK knowledge base to Cursor IDE
 * so it can help write better ChucK code using your 809+ examples
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '@supabase/supabase-js';
import { pipeline } from '@xenova/transformers';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local or .env files (try multiple paths)
const envPaths = [
  join(__dirname, '..', '.env.local'),
  join(__dirname, '..', '.env'),
  join(process.cwd(), '.env.local'),
  join(process.cwd(), '.env'),
];

for (const path of envPaths) {
  dotenv.config({ path });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.error('Or: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Initialize embedding model (same as your app uses)
let embedderPromise: Promise<(text: string) => Promise<number[]>> | null = null;

async function getEmbedder() {
  if (!embedderPromise) {
    embedderPromise = (async () => {
      const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      return async (text: string) => {
        const out = await extractor(text, { pooling: 'mean', normalize: true });
        return Array.from(out.data as Float32Array);
      };
    })();
  }
  return embedderPromise;
}

// Initialize MCP server
const server = new Server(
  {
    name: 'chuck-knowledge-base',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_chuck_docs',
        description: 'Search the ChucK knowledge base for code examples, patterns, and documentation. Returns relevant ChucK code snippets from 809+ examples.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query describing what ChucK code you need (e.g., "synthesizer with ADSR envelope", "reverb effect", "granular synthesis")',
            },
            language: {
              type: 'string',
              enum: ['chuck', 'hydra', 'other'],
              description: 'Filter by language (default: chuck)',
            },
            maxResults: {
              type: 'number',
              description: 'Maximum number of results to return (default: 5)',
              default: 5,
            },
            minSimilarity: {
              type: 'number',
              description: 'Minimum similarity threshold 0-1 (default: 0.4)',
              default: 0.4,
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_chuck_example',
        description: 'Get a specific ChucK code example by ID or title. Useful when you know exactly which example you want.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Document ID from search results',
            },
            title: {
              type: 'string',
              description: 'Title to search for (partial match)',
            },
          },
          required: [],
        },
      },
      {
        name: 'generate_chuck_code',
        description: 'Generate ChucK code using the knowledge base. Searches for relevant examples and provides code suggestions based on your query.',
        inputSchema: {
          type: 'object',
          properties: {
            description: {
              type: 'string',
              description: 'Description of the ChucK code you want to generate (e.g., "a soft pad synthesizer with slow attack" or "granular delay effect")',
            },
            includeExamples: {
              type: 'boolean',
              description: 'Include example code snippets in the response (default: true)',
              default: true,
            },
            maxExamples: {
              type: 'number',
              description: 'Maximum number of example snippets to include (default: 3)',
              default: 3,
            },
          },
          required: ['description'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'search_chuck_docs': {
        const { query, language = 'chuck', maxResults = 5, minSimilarity = 0.4 } = args as {
          query: string;
          language?: 'chuck' | 'hydra' | 'other';
          maxResults?: number;
          minSimilarity?: number;
        };

        if (!query || typeof query !== 'string') {
          throw new Error('Query is required and must be a string');
        }

        // Get embedding for query
        const embedder = await getEmbedder();
        const embedding = await embedder(query);

        // Search Supabase
        const { data, error } = await (supabase as any).rpc('match_dsp_docs', {
          query_embedding: embedding,
          match_count: maxResults,
          min_similarity: minSimilarity,
          filter_language: language,
          perceptual_tags_filter: null,
          technical_tags_filter: null,
        });

        if (error) {
          throw new Error(`Supabase error: ${error.message || JSON.stringify(error)}`);
        }

        const results = (data || []).map((doc: any) => ({
          id: doc.id,
          title: doc.title || 'Untitled',
          language: doc.language,
          content: doc.content || '',
          perceptual_tags: doc.perceptual_tags || [],
          technical_tags: doc.technical_tags || [],
          similarity: doc.similarity || 0,
          source_url: doc.source_url || null,
        }));

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  query,
                  resultsFound: results.length,
                  results: results.map((r: any) => ({
                    id: r.id,
                    title: r.title,
                    similarity: r.similarity.toFixed(3),
                    language: r.language,
                    tags: {
                      perceptual: r.perceptual_tags,
                      technical: r.technical_tags,
                    },
                    codePreview: r.content.substring(0, 200) + (r.content.length > 200 ? '...' : ''),
                    fullCode: r.content,
                    source_url: r.source_url,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_chuck_example': {
        const { id, title } = args as { id?: string; title?: string };

        if (!id && !title) {
          throw new Error('Either id or title must be provided');
        }

        let query = supabase.from('dsp_docs').select('*');

        if (id) {
          query = query.eq('id', id);
        } else if (title) {
          query = query.ilike('title', `%${title}%`);
        }

        const { data, error } = await query.single();

        if (error || !data) {
          throw new Error(`Document not found: ${error?.message || 'No results'}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  id: data.id,
                  title: data.title,
                  language: data.language,
                  content: data.content,
                  perceptual_tags: data.perceptual_tags || [],
                  technical_tags: data.technical_tags || [],
                  example_usage: data.example_usage || [],
                  params: data.params || {},
                  source_url: data.source_url,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'generate_chuck_code': {
        const {
          description,
          includeExamples = true,
          maxExamples = 3,
        } = args as {
          description: string;
          includeExamples?: boolean;
          maxExamples?: number;
        };

        if (!description || typeof description !== 'string') {
          throw new Error('Description is required and must be a string');
        }

        // Search for relevant examples
        const embedder = await getEmbedder();
        const embedding = await embedder(description);

        const { data, error } = await (supabase as any).rpc('match_dsp_docs', {
          query_embedding: embedding,
          match_count: maxExamples,
          min_similarity: 0.4,
          filter_language: 'chuck',
          perceptual_tags_filter: null,
          technical_tags_filter: null,
        });

        if (error) {
          throw new Error(`Supabase error: ${error.message || JSON.stringify(error)}`);
        }

        const examples = (data || []).map((doc: any) => ({
          title: doc.title || 'Untitled',
          content: doc.content || '',
          similarity: doc.similarity || 0,
          tags: {
            perceptual: doc.perceptual_tags || [],
            technical: doc.technical_tags || [],
          },
        }));

        // Format response
        let responseText = `# ChucK Code Generation Guide\n\n`;
        responseText += `**Request:** ${description}\n\n`;
        responseText += `**Found ${examples.length} relevant examples from knowledge base:**\n\n`;

        if (includeExamples && examples.length > 0) {
          examples.forEach((ex: any, idx: number) => {
            responseText += `## Example ${idx + 1}: ${ex.title} (similarity: ${ex.similarity.toFixed(3)})\n\n`;
            if (ex.tags.perceptual.length > 0 || ex.tags.technical.length > 0) {
              responseText += `**Tags:** ${[...ex.tags.perceptual, ...ex.tags.technical].join(', ')}\n\n`;
            }
            responseText += `\`\`\`chuck\n${ex.content}\n\`\`\`\n\n`;
          });
        }

        responseText += `\n**Tips:**\n`;
        responseText += `- Use these examples as reference for syntax and patterns\n`;
        responseText += `- Adapt the code to match your specific needs\n`;
        responseText += `- Check WebChucK compatibility (all examples should work in WebChucK)\n`;

        return {
          content: [
            {
              type: 'text',
              text: responseText,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message || String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🚀 ChucK Knowledge Base MCP Server running');
  console.error(`📊 Connected to Supabase: ${SUPABASE_URL?.substring(0, 30)}...`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});





