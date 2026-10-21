import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  devIndicators: false,
  poweredByHeader: false,
  outputFileTracingExcludes: {
    "/*": ["./.env*", "./.data/**/*", "./artifacts/**/*"],
  },
};
export default nextConfig;
