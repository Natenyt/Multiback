import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_PRIVATE_URL || 'http://localhost:8000/api';

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
    // Reconstruct the backend path
    // Filter out empty segments
    const filteredPath = pathSegments.filter(segment => segment.length > 0);
    const url = new URL(request.url);
    const queryString = url.search;
    
    // Check if original URL had trailing slash (Django requires it for POST)
    // Next.js might strip it, so we check the original request URL
    const originalPath = url.pathname;
    const hasTrailingSlash = originalPath.endsWith('/');
    
    // Build backend path - always add trailing slash for POST/PATCH/PUT requests to Django
    // Django requires trailing slashes for these methods
    let backendPath = filteredPath.join('/');
    if (hasTrailingSlash || (method !== 'GET' && method !== 'DELETE')) {
      // Add trailing slash if original had it OR if it's a POST/PATCH/PUT request
      backendPath = backendPath + '/';
    }
    
    // Build the full backend URL
    // Remove trailing slash from BACKEND_URL if present
    const cleanBackendUrl = BACKEND_URL.endsWith('/') ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
    const backendUrl = `${cleanBackendUrl}/${backendPath}${queryString}`;
    
    // Debug logging (remove in production if needed)
    console.log(`[Proxy] ${method} ${backendUrl} (original: ${originalPath}, hasTrailing: ${hasTrailingSlash})`);

    // Get headers from the request
    const headers: HeadersInit = {};
    
    // Forward authorization header if present
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    // Forward content-type for non-GET requests
    const requestContentType = request.headers.get('content-type');
    if (requestContentType) {
      headers['Content-Type'] = requestContentType;
    }

    // Prepare request options - ensure method is explicitly set
    const requestOptions: RequestInit = {
      method: method.toUpperCase(), // Ensure uppercase
      headers,
    };

    // For requests with body (POST, PATCH, PUT)
    if (method !== 'GET' && method !== 'DELETE') {
      // Check if it's FormData (for file uploads)
      if (requestContentType?.includes('multipart/form-data')) {
        // For FormData, we need to get the body as FormData
        const formData = await request.formData();
        requestOptions.body = formData;
        // Don't set Content-Type header for FormData, browser will set it with boundary
        delete headers['Content-Type'];
      } else {
        // For JSON, get the body as text and parse
        const body = await request.text();
        if (body) {
          requestOptions.body = body;
        }
      }
    }

    // Make the request to the backend
    // Ensure method is explicitly set
    requestOptions.method = method;
    const response = await fetch(backendUrl, requestOptions);

    // Get the response data
    const responseContentType = response.headers.get('content-type');
    let data;
    
    if (responseContentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Return the response with the same status and headers
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { detail: 'Failed to proxy request to backend', error: String(error) },
      { status: 500 }
    );
  }
}

