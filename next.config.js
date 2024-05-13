/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public'
})
const path = require('path');

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(
  withPWA({
    // config
    i18n: {
      locales: ['en-US', 'es-ES'],
      defaultLocale: 'en-US',
    },
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
      // Custom SVG loader configuration
      config.module.rules.push({
        test: /\.svg$/,
        include: [path.resolve(__dirname, './assets/tags'), path.resolve(__dirname, './assets/ui')],
        use: [{
          loader: path.resolve(__dirname, './svg/svg_path_reader.js'),
        }],
      });
      return config;
    },
  }
))
