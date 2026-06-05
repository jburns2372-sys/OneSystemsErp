import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async redirects() {
    return [
      {
        source: '/projects/:projectId/accomplishments',
        destination: '/progress/:projectId/accomplishments',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
