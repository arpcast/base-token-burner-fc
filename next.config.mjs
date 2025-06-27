// next.config.js
const nextConfig = {
  webpack(config, { isServer }) {
    // Buat loader khusus supaya file ending .js di folder static/media tidak diproses
    config.module.rules.push({
      test: /\.js$/,
      include: /static\/media/,
      issuer: undefined,
      use: [],
    });
    return config;
  },
};

module.exports = nextConfig;

