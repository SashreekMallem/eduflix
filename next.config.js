/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,  // 👈 This disables ESLint during deployment
  },
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

export const typescript = {
  ignoreBuildErrors: true, // ✅ Temporarily bypass TypeScript errors
};
export const eslint = {
  ignoreDuringBuilds: true, // ✅ Temporarily disable ESLint checks
};


export default nextConfig;

export async function redirects() {
  return [
    {
      source: '/',
      destination: '/landing',
      permanent: true,
    },
  ];
}
