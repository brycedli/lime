import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'v3b.fal.media',
        port: '',
        pathname: '/files/**',
      },
    ],
  },
};

export default nextConfig;
