import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  basePath: isProd ? '/CAT-TOOL' : '',
  assetPrefix: isProd ? '/CAT-TOOL/' : '',
  turbopack: {},
};

export default nextConfig;
