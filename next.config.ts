import type { NextConfig } from 'next';

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
    importScripts: ["/custom-sw.js"],
  },
});

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

export default withPWA(nextConfig);
