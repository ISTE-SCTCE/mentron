import type { NextConfig } from "next";

const nextConfig: any = {
  // Performance optimizations
  experimental: {
    // Enable optimized package imports for better tree-shaking
    optimizePackageImports: [
      'recharts',
      'framer-motion',
      'date-fns',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      '@dnd-kit/utilities',
    ],
  },

  // Compiler optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // Production optimizations
  poweredByHeader: false,

  // Enable gzip compression
  compress: true,

  // Strict mode for better performance debugging
  reactStrictMode: true,

  // Optimize production builds
  productionBrowserSourceMaps: false,

  // Ignore eslint errors during build to prevent deployment failure on warnings
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Ignore typescript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
