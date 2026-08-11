import type { NextConfig } from "next";

const apiUpstream =
  process.env.DIDAR_API_UPSTREAM?.replace(/\/$/, "") || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Phone / LAN access in `next dev` (otherwise /_next chunks are blocked → blank/broken UI)
  allowedDevOrigins: [
    "172.20.10.4",
    "192.168.1.83",
    "127.0.0.1",
    "localhost",
  ],
  // Same-origin API proxy so phones don't call 127.0.0.1 on the device itself
  async rewrites() {
    return [
      {
        source: "/didar-api/:path*",
        destination: `${apiUpstream}/:path*`,
      },
    ];
  },
  headers: async () => [
    {
      source: "/sw.js",
      headers: [
        { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        { key: "Service-Worker-Allowed", value: "/" },
      ],
    },
    {
      source: "/manifest.webmanifest",
      headers: [
        { key: "Content-Type", value: "application/manifest+json" },
        { key: "Cache-Control", value: "public, max-age=86400" },
      ],
    },
  ],
};

export default nextConfig;
