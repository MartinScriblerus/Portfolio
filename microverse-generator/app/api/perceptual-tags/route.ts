/**
 * API endpoint to get all unique perceptual tags from dsp_docs table
 * Used for fallback search when no examples are found
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(_req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get all unique perceptual tags from dsp_docs
    const { data, error } = await supabase
      .from('dsp_docs')
      .select('perceptual_tags')
      .not('perceptual_tags', 'is', null);
    
    if (error) {
      console.error('[perceptual-tags] Error fetching tags:', error);
      return NextResponse.json(
        { error: 'Failed to fetch perceptual tags' },
        { status: 500 }
      );
    }
    
    // Extract all unique tags
    const allTags = new Set<string>();
    (data || []).forEach((row: any) => {
      if (Array.isArray(row.perceptual_tags)) {
        row.perceptual_tags.forEach((tag: string) => {
          if (tag && typeof tag === 'string') {
            allTags.add(tag.trim());
          }
        });
      }
    });
    
    return NextResponse.json({
      tags: Array.from(allTags).sort(),
      count: allTags.size
    });
  } catch (error: any) {
    console.error('[perceptual-tags] Exception:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
