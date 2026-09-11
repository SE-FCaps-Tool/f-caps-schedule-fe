import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    proxyTimeout: 300000,
  },
  async rewrites() {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.BACKEND_URL ||
      process.env.API_URL;

    if (!apiUrl) {
      return [];
    }

    const destination = apiUrl.endsWith("/")
      ? `${apiUrl}api/:path*`
      : `${apiUrl}/api/:path*`;

    return [
      {
        source: "/api/:path*",
        destination,
      },
    ];
  },
  // Vercel's Next.js adapter does not emit the root NFT files that
  // standalone output expects in Next 16. Keep standalone for Docker/self-hosting.
  output: process.env.VERCEL ? undefined : "standalone",
};

export default nextConfig;