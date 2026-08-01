import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Vercel's static-asset CDN 404s on dot-prefixed path segments (.well-known),
        // so the key is served by an actual route handler instead of a public/ file.
        source: "/.well-known/appspecific/com.tesla.3p.public-key.pem",
        destination: "/api/tesla-public-key",
      },
    ];
  },
};

export default nextConfig;
