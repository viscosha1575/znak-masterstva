import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained production bundle in .next/standalone — the Docker image
  // runs it as is (see Dockerfile).
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 90],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
