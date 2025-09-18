import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/auth/:path*",
        destination: "http://141.11.156.52:3203/auth/:path*",
      },
      {
        source: "/kyc/:path*",
        destination: "http://141.11.156.52:3205/kyc/:path*",
      },
    ];
  },
};

export default nextConfig;
