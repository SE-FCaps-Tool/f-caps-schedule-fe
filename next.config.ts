import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel's Next.js adapter does not emit the root NFT files that
  // standalone output expects in Next 16. Keep standalone for Docker/self-hosting.
  output: process.env.VERCEL ? undefined : "standalone",
  allowedDevOrigins: ['10.87.58.238', '10.254.83.146', 'localhost:*'],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
