import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'prod-1.storage.jamendo.com' },
      { protocol: 'https', hostname: 'usercontent.jamendo.com' },
      { protocol: 'https', hostname: 'imgjam1.jamendo.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
};

export default nextConfig;
