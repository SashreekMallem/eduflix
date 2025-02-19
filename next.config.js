/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
module.exports = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/landing',
        permanent: true,
      },
    ];
  },
};
