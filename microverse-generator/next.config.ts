/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Ignore type errors during build (we'll fix d3-dispatch separately)
    ignoreBuildErrors: false,
  },
  webpack: (config: { module: { rules: { test: RegExp; resolve: { fullySpecified: boolean; }; }[]; }; }, { isServer }: any) => {
    config.module.rules.push({
      test: /\.m?js/,
      resolve: {
        fullySpecified: false, // 👈 allows import without extension
      },
    });

    return config;
  },
};

export default nextConfig;