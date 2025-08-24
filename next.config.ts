import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const BUILD_OUTPUT = process.env.NEXT_STANDALONE_OUTPUT
  ? "standalone"
  : undefined;

export default () => {
  const nextConfig: NextConfig = {
    output: BUILD_OUTPUT,
    cleanDistDir: true,
    devIndicators: {
      position: "bottom-right",
    },
    env: {
      NO_HTTPS: process.env.NO_HTTPS,
    },
    experimental: {
      taint: true,
      // Aggressive performance optimizations
      optimizePackageImports: [
        "@radix-ui/react-icons",
        "lucide-react",
        "@radix-ui/react-dialog",
        "@radix-ui/react-tabs",
        "framer-motion",
        "ai",
      ],
      // Disable heavy features temporarily
      typedRoutes: false,
      serverActions: {
        bodySizeLimit: "1mb",
      },
    },
    // Enable Turbopack for faster development builds
    turbopack: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
      // Disable heavy features
      resolveExtensions: [".js", ".jsx", ".ts", ".tsx"],
      moduleRules: [
        {
          test: /\.(png|jpe?g|gif|svg)$/i,
          type: "asset/resource",
        },
      ],
    },
    allowedDevOrigins: ["chat.sayers.app", "localhost:3000", "localhost:3001"],
    // Optimize webpack for development
    webpack: (config, { dev, isServer }) => {
      if (dev && !isServer) {
        // Disable expensive optimizations in development
        config.optimization = {
          ...config.optimization,
          removeAvailableModules: false,
          removeEmptyChunks: false,
          splitChunks: false,
          minimize: false,
          concatenateModules: false,
        };

        // Faster source maps
        config.devtool = "eval-cheap-module-source-map";

        // Disable heavy loaders temporarily
        config.module.rules.forEach((rule) => {
          if (rule.test && rule.test.toString().includes("svg")) {
            rule.type = "asset/resource";
          }
        });
      }
      return config;
    },
  };
  const withNextIntl = createNextIntlPlugin();
  return withNextIntl(nextConfig);
};
