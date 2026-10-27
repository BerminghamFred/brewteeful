import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async redirects() {
    // Routes from the previous single-shirt store.
    return [
      { source: "/collection/:slug*", destination: "/designs", permanent: true },
      { source: "/product/:slug", destination: "/designs/:slug", permanent: true },
      { source: "/cart", destination: "/basket", permanent: true },
    ];
  },
};

export default nextConfig;
