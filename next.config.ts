import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Skip static optimization for dynamic routes
  trailingSlash: true,
};

export default nextConfig;
