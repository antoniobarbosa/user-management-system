import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: "standalone",
  /** Use app dir so Docker builds (context = ./frontend) match local standalone tracing. */
  outputFileTracingRoot: __dirname,
  /** `/api/*` is handled by `src/app/api/[...path]/route.ts` so `Cookie` / `Set-Cookie` reach the backend. */
};

export default nextConfig;
