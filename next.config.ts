/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'exstandaloneort',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  reactStrictMode: false,
};

module.exports = nextConfig;
