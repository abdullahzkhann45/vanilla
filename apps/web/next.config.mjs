/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@vanilla/shared'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '**' },
    ],
    // placeholder seeds use data: URIs — allow unoptimized for those
    unoptimized: true,
  },
  async rewrites() {
    return [
      // Proxy /api/* to the NestJS backend so the browser never pierces CORS in prod.
      { source: '/api/:path*', destination: (process.env.API_URL || 'http://localhost:4000') + '/:path*' },
    ];
  },
};
export default nextConfig;
