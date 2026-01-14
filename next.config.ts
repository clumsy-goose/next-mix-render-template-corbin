import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/ssr',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate, stale-if-error'
          }
        ]
      },
      {
        source: '/isr',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate, stale-if-error'
          }
        ]
      }
    ]
  }
};

export default nextConfig;
