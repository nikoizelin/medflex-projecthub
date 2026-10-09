import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client"],
  async headers() {
    return [
      {
        // Supportformular darf nur auf der eigenen Website eingebettet werden
        source: "/support/neue-anfrage",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://medflex-schweiz.ch https://www.medflex-schweiz.ch",
          },
        ],
      },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
