import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Necessário para rodar em container Docker (imagem de produção menor)
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
      {
        protocol: "https",
        hostname: "*.cloudflare.com",
      },
      // Allow any domain for flexibility (narrow this down in production)
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
