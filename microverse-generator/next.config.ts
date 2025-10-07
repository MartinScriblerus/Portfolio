/** @type {import('next').NextConfig} */
const nextConfig = {
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