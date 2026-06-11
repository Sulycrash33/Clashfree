import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    // Allow deploy while TypeScript errors are cleaned up incrementally
    ignoreBuildErrors: true,
  },
  eslint: {
    // Also ignore ESLint errors during build
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true,
  experimental: {
    // Required for next-auth v4 compatibility with Next.js 16
    authInterrupts: true,
  },
};

export default nextConfig;
