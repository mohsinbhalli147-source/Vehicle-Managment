import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  // Standard Next.js for production hosting
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
