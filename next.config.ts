import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Increase body size limit so Vercel doesn't silently drop large image uploads (default is 1MB)
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

