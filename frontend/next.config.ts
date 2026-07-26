import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/biometrics',
        destination: '/biometric',
      },
    ];
  },
};

export default nextConfig;
