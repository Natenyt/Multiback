import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Ensure proper handling of React 19
  reactStrictMode: true,
  // Optimize for production builds
  swcMinify: true,
  // Handle potential build issues
  typescript: {
    // Don't fail build on TypeScript errors during deployment (optional)
    // ignoreBuildErrors: false,
  },
  eslint: {
    // Don't fail build on ESLint errors during deployment
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
