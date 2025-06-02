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
};


export default nextConfig;
