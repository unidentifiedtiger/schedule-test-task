import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // In a monorepo, trace files from the repo root so workspace packages are included
  outputFileTracingRoot: path.join(process.cwd(), "../../"),
  transpilePackages: ["@app/shared"],
};

export default nextConfig;