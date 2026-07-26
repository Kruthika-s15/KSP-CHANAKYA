import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // DO NOT use output: "export" on Catalyst / Slate
  images: {
    unoptimized: true,
  },
  typescript: {
    // Allows builds to complete even if minor type warnings pop up
    ignoreBuildErrors: true,
  },
  eslint: {
    // Prevents ESLint rules from failing production builds
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
