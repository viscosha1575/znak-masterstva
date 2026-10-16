import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained production bundle in .next/standalone — the Docker image
  // runs it as is (see Dockerfile).
  output: "standalone",
  // In development the database and the photos sit in ./data (see src/lib/db.ts).
  // The build traces every file the server code might read and would copy that
  // folder — applicants' data — into the bundle. It is never part of a build.
  outputFileTracingExcludes: { "/*": ["./data/**/*"] },
  // The dev-only Next.js badge sits bottom-left by default — on top of "Выйти".
  devIndicators: { position: "bottom-right" },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // The panel acts on one click; it must never be drawn inside someone else's page.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Addresses here carry search terms and application numbers.
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
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
