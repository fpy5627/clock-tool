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
  // 这是 Next.js 推荐的优化方式，会自动进行 tree-shaking 和代码分割
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
  // 移除自定义 webpack splitChunks 配置
  // Next.js 的默认代码分割策略已经足够优化，自定义配置可能导致 vendor 包过大
};

// Make sure experimental mdx flag is enabled
const configWithMDX = {
  ...nextConfig,
  experimental: {
    ...nextConfig.experimental,
    mdxRs: true,
  },
};

export default withBundleAnalyzer(withNextIntl(withMDX(configWithMDX)));
