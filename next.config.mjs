import bundleAnalyzer from "@next/bundle-analyzer";
import createNextIntlPlugin from "next-intl/plugin";
import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only use standalone output when explicitly set (e.g., for Docker builds)
  // This avoids symlink permission issues on Windows
  ...(process.env.NEXT_OUTPUT_STANDALONE === "true" && { output: "standalone" }),
  reactStrictMode: false,
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*",
      },
    ],
  },
  async redirects() {
    return [];
  },
  // Remove console logs in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'], // Keep error and warn logs even in production
    } : false,
  },
  // 优化包导入，减少未使用的代码
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-accordion',
      '@radix-ui/react-navigation-menu',
      '@radix-ui/react-sheet',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      'lucide-react',
      'moment',
      'framer-motion',
    ],
  },
  // Webpack 配置优化
  webpack: (config, { isServer, dev }) => {
    if (!isServer && !dev) {
      // 优化客户端包分割
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // 将大型库单独打包
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /[\\/]node_modules[\\/]/,
              priority: 20,
              minChunks: 1,
            },
            // UI 组件库单独打包
            radixUI: {
              name: 'radix-ui',
              chunks: 'all',
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              priority: 30,
            },
            // 图标库单独打包
            icons: {
              name: 'icons',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](lucide-react|@tabler\/icons-react|react-icons)[\\/]/,
              priority: 25,
            },
            // 工具库单独打包
            utils: {
              name: 'utils',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](moment|clsx|tailwind-merge|class-variance-authority)[\\/]/,
              priority: 15,
            },
          },
        },
      };
    }
    return config;
  },
};

// Make sure experimental mdx flag is enabled
const configWithMDX = {
  ...nextConfig,
  experimental: {
    mdxRs: true,
  },
};

export default withBundleAnalyzer(withNextIntl(withMDX(configWithMDX)));
