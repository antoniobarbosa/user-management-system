import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: "standalone",
  /** Use app dir so Docker builds (context = ./frontend) match local standalone tracing. */
  outputFileTracingRoot: __dirname,
  async rewrites() {
    const apiUrl = process.env.API_URL?.trim();
    if (!apiUrl) {
      throw new Error(
        "Set API_URL (e.g. API_URL=http://localhost:3001) in .env.local for the /api proxy.",
      );
    }
    const base = apiUrl.replace(/\/$/, "");
    return [
      {
        source: "/api/:path*",
        destination: `${base}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
