import type { NextConfig } from "next";

const nextConfig: NextConfig = {
 experimental: {
    serverComponentsExternalPackages: [],
  },
  trailingSlash: true,
  
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // สำหรับ Netlify
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
};


export default nextConfig;
