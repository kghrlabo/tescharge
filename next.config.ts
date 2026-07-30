import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Tesla Fleet API domain verification key — must be served as text/plain.
        source: "/.well-known/appspecific/com.tesla.3p.public-key.pem",
        headers: [
          {
            key: "Content-Type",
            value: "text/plain",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
