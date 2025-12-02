import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const videoUrl = searchParams.get('url');
  
  if (!videoUrl) {
    return new NextResponse('Missing video URL', { status: 400 });
  }
  
  try {
    // Get the range header for video seeking support
    const range = request.headers.get('range');
    
    // Fetch the video from the original source
    const fetchHeaders: HeadersInit = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    };
    
    if (range) {
      fetchHeaders['Range'] = range;
    }
    
    const response = await fetch(videoUrl, {
      headers: fetchHeaders,
    });
    
    if (!response.ok && response.status !== 206) {
      console.error('[Video Proxy] Fetch failed:', response.status, response.statusText);
      return new NextResponse(`Failed to fetch video: ${response.statusText}`, { status: response.status });
    }
    
    // Get response body
    const body = response.body;
    if (!body) {
      return new NextResponse('No video data', { status: 500 });
    }
    
    // Return the video stream with proper CORS headers
    return new NextResponse(body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'video/mp4',
        'Content-Length': response.headers.get('Content-Length') || '',
        'Content-Range': response.headers.get('Content-Range') || '',
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
        'Access-Control-Allow-Headers': 'Range, Content-Type',
        'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('[Video Proxy] Error:', error);
    return new NextResponse(`Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

