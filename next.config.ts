import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel's Next.js adapter does not emit the root NFT files that
  // standalone output expects in Next 16. Keep standalone for Docker/self-hosting.
  output: process.env.VERCEL ? undefined : "standalone",
};

export default nextConfig;
