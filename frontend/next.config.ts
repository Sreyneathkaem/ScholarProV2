import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:3000/api/v1";
const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,

  poweredByHeader: false,

  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  turbopack: {
    root: __dirname,
  },

  // 4. API Proxy (Existing)
  async rewrites() {
    return [
      {
        source: "/api/v1/auth/google/callback",
        destination: "/students/auth/google/callback",
      },
      {
        source: "/api/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: "capstone-project-pg",
  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors.
  automaticVercelMonitors: true,
});
