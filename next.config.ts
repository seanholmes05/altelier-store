import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Sample imagery for the storefront placeholder content.
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
    // Product imagery is requested at 90 to keep fabric and stitching detail; 75 is the default.
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
