import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Ensure proper handling of React 19
  reactStrictMode: true,
  
  // Note: Font optimization is handled automatically by Next.js
  // The preload warnings in browser console are harmless optimization hints
  // They don't affect functionality and can be safely ignored
};

export default nextConfig;
