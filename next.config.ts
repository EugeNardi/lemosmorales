import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  devIndicators: false,
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: "/crm/:path*",
        destination: "/consultas/:path*",
        permanent: true,
      },
    ];
  },
  outputFileTracingExcludes: {
    "/*": ["./.env*", "./.data/**/*", "./artifacts/**/*"],
  },
};
export default nextConfig;
