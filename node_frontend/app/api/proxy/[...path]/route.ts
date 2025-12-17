import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_PRIVATE_URL || 'http://localhost:8000/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'POST');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'PATCH');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'DELETE');
}

async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    // Reconstruct the backend path
    const backendPath = pathSegments.join('/');
    const url = new URL(request.url);
    const queryString = url.search;
    
    // Build the full backend URL
    const backendUrl = `${BACKEND_URL}/${backendPath}${queryString}`;

    // Get headers from the request
    const headers: HeadersInit = {};
    
    // Forward authorization header if present
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    // Forward content-type for non-GET requests
    const contentType = request.headers.get('content-type');
    if (contentType) {
      headers['Content-Type'] = contentType;
    }

    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers,
    };

    // For requests with body (POST, PATCH, PUT)
    if (method !== 'GET' && method !== 'DELETE') {
      // Check if it's FormData (for file uploads)
      const contentType = request.headers.get('content-type');
      if (contentType?.includes('multipart/form-data')) {
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
    const response = await fetch(backendUrl, requestOptions);

    // Get the response data
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType?.includes('application/json')) {
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

