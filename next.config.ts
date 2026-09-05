import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return { beforeFiles: [
      '/library/:path*', '/account/:path*', '/reader/:path*', '/chapter/:path*',
      '/books/policies/:path*', '/books/hfos-phase-1-stability/chapter/:path*',
      '/api/reader/:path*', '/api/entitlements/:path*', '/api/books/entitlements/:path*',
    ].map(source => ({ source, destination: '/book-access-unavailable' })), afterFiles: [], fallback: [] };
  },
};

export default nextConfig;
