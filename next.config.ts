import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required by @opennextjs/cloudflare — produces the self-contained server
  // bundle at .next/standalone/ which OpenNext repackages into the Worker.
  output: "standalone",
};

export default nextConfig;
