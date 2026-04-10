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

const SUPABASE_INTERNAL_URL = process.env.SUPABASE_INTERNAL_URL || 'http://172.16.1.214:8000';

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },

  images: {
    unoptimized: true,
  },

  reactStrictMode: true,

  // Proxy Supabase requests ผ่าน Next.js เพื่อแก้ Mixed Content (HTTP → HTTPS)
  async rewrites() {
    return [
      {
        source: '/supabase/:path*',
        destination: `${SUPABASE_INTERNAL_URL}/:path*`,
      },
    ];
  },
};

export default withPWA(nextConfig);
