/**
 * @type {import('next').NextConfig}
 */
const path = require('path');

const isProd = process.env.NODE_ENV === 'production';
const internalHost = process.env.TAURI_DEV_HOST || 'localhost';

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  assetPrefix: isProd ? undefined : `http://${internalHost}:3000`,
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Custom SVG loader configuration
    config.module.rules.push({
      test: /\.svg$/,
      include: [path.resolve(__dirname, './src/assets/tags'), path.resolve(__dirname, './src/assets/ui')],
      use: [{
        loader: path.resolve(__dirname, './scripts/svg-path-reader.js'),
      }],
    });
    return config;
  },
}

module.exports = withBundleAnalyzer(nextConfig);
