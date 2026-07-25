import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "playwright",
    "playwright-core",
    "bullmq",
    "ioredis",
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;