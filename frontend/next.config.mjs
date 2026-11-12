/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '**' },
    ],
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          ...(process.env.NODE_ENV === 'production'
            ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
            : []),
        ],
      },
    ];
  },
  async rewrites() {
    const api = process.env.API_URL || 'http://localhost:4000';
    if (!process.env.API_URL) {
      // Don't crash the build over a missing env var — warn loudly instead.
      // Set API_URL to your backend URL in the host env, then redeploy so the
      // /api proxy points at it (rewrites are baked in at build time).
      console.warn('[next.config] API_URL is not set — /api proxy falls back to localhost. Set API_URL and redeploy for production.');
    }
    return [{ source: '/api/:path*', destination: `${api}/:path*` }];
  },
};
export default nextConfig;
