import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["recharts", "eventemitter3"],

  // Proxy all /api/* requests from Vercel → DigitalOcean backend
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://api.ad-ride.me/api/:path*",
      },
    ];
  },
};

export default nextConfig;
