import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/auth/:path*",
        destination: "http://141.11.156.52:3203/auth/:path*",
      },
    ];
  },
};

export default nextConfig;
