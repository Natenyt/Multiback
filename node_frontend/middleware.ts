import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Very simple mobile user-agent detection. This does not need to be perfect,
// just good enough to block obvious phone browsers.
const MOBILE_UA_REGEX =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow Next.js internals and API routes through without blocking.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/mobile-block")
  ) {
    return NextResponse.next();
  }

  const ua = request.headers.get("user-agent") || "";

  if (MOBILE_UA_REGEX.test(ua)) {
    const url = request.nextUrl.clone();
    url.pathname = "/mobile-block";
    url.search = "";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}


