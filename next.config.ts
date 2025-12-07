import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Uncomment for standalone build (Docker deployment)
  // output: 'standalone',

  eslint: {
    // Temporarily disable ESLint during builds
    // TODO: Fix linting errors and re-enable
    ignoreDuringBuilds: false,
  },

  images: {
    unoptimized: true
  },

  // Enable React Strict Mode for better development experience
  reactStrictMode: true,
};

export default nextConfig;
