import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_URL = process.env.FASTAPI_PRIVATE_URL || process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8001';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path, 'POST');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path, 'PATCH');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path, 'DELETE');
}

async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    const filteredPath = pathSegments.filter(segment => segment.length > 0);
    const url = new URL(request.url);
    const queryString = url.search;
    
    const originalPath = url.pathname;
    const hasTrailingSlash = originalPath.endsWith('/');
    
    let backendPath = filteredPath.join('/');
    if (hasTrailingSlash || (method !== 'GET' && method !== 'DELETE')) {
      backendPath = backendPath + '/';
    }
    
    const cleanFastApiUrl = FASTAPI_URL.endsWith('/') ? FASTAPI_URL.slice(0, -1) : FASTAPI_URL;
    const backendUrl = `${cleanFastApiUrl}/${backendPath}${queryString}`;
    
    console.log(`[FastAPI Proxy] ${method} ${backendUrl}`);

    const headers: HeadersInit = {};
    
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    const requestContentType = request.headers.get('content-type');
    if (requestContentType) {
      headers['Content-Type'] = requestContentType;
    }

    const requestOptions: RequestInit = {
      method: method.toUpperCase(),
      headers,
    };

    if (method !== 'GET' && method !== 'DELETE') {
      if (requestContentType?.includes('multipart/form-data')) {
        const formData = await request.formData();
        requestOptions.body = formData;
        delete headers['Content-Type'];
      } else {
        const body = await request.text();
        if (body) {
          requestOptions.body = body;
        }
      }
    }

    requestOptions.method = method;
    const response = await fetch(backendUrl, requestOptions);

    const responseContentType = response.headers.get('content-type') || '';
    let data;
    
    if (responseContentType.startsWith('image/') || 
        responseContentType.startsWith('video/') || 
        responseContentType.startsWith('audio/') ||
        responseContentType === 'application/octet-stream' ||
        responseContentType.includes('application/pdf')) {
      data = await response.arrayBuffer();
      return new NextResponse(data, {
        status: response.status,
        headers: {
          'Content-Type': responseContentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } else if (responseContentType.includes('application/json')) {
      data = await response.json();
      return NextResponse.json(data, {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } else {
      data = await response.text();
      return new NextResponse(data, {
        status: response.status,
        headers: {
          'Content-Type': responseContentType || 'text/plain',
        },
      });
    }
  } catch (error) {
    console.error('FastAPI Proxy error:', error);
    return NextResponse.json(
      { detail: 'Failed to proxy request to FastAPI', error: String(error) },
      { status: 500 }
    );
  }
}

