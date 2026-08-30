import type { NextConfig } from "next";

/**
 * `/api/*` is proxied to the FastAPI service so the browser makes same-origin
 * requests and CORS never enters the picture in development.
 *
 * Point it elsewhere with AERODEX_API_ORIGIN (e.g. a Cloudflare Tunnel URL).
 * To bypass the proxy entirely and call a deployed API directly, set
 * NEXT_PUBLIC_API_URL instead — `lib/api.ts` prefixes every request with it.
 */
const API_ORIGIN = process.env.AERODEX_API_ORIGIN ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_ORIGIN}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
