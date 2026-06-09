import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    // TypeScript errors now surfaced at build time
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  experimental: {
    // Required for next-auth v4 compatibility with Next.js 16
    authInterrupts: true,
  },
};

export default nextConfig;
