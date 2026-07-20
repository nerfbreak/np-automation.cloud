import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // RF-02 FIX: Playwright uses native Node.js binaries that cannot be bundled by webpack.
  // These packages must be excluded from the server bundle and loaded natively at runtime.
  serverExternalPackages: [
    "playwright",
    "playwright-core",
    "bullmq",
    "ioredis",
  ],
};

export default nextConfig;
