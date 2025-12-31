import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Ensure proper handling of React 19
  reactStrictMode: true,
  
  // Optimize font loading to reduce preload warnings
  optimizeFonts: true,
  
  // Suppress preload warnings in production (they're just optimization hints)
  // These warnings are harmless and don't affect functionality
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
};

export default nextConfig;
