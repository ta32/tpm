/**
 * @type {import('next').NextConfig}
 */
const path = require('path');

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Custom SVG loader configuration
    config.module.rules.push({
      test: /\.svg$/,
      include: [path.resolve(__dirname, './assets/tags'), path.resolve(__dirname, './assets/ui')],
      use: [{
        loader: path.resolve(__dirname, './components/svg/svg-path-reader.js'),
      }],
    });
    return config;
  },
}

module.exports = withBundleAnalyzer(nextConfig);
