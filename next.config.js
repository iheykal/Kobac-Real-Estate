/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features properly
  experimental: {
    serverComponentsExternalPackages: ['mongoose', 'argon2', 'bcryptjs', '@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner', 'formidable', 'sharp'],
  },
  
  // Environment variables for deployment
  env: {
    VERCEL: process.env.VERCEL,
  },
  
  // Image configuration for Cloudflare R2
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.r2.dev',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pub-744f24f8a5918e0d996c5ff4009a7adb.r2.dev',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'kobac-real-estate.r2.dev',
        port: '',
        pathname: '/**',
      },
      // Allow local uploads during transition period
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
    ],
  },
  
  // Optimized webpack config
  webpack: (config, { isServer, dev }) => {
    // Only externalize heavy packages for server in production
    if (isServer && !dev) {
      config.externals = config.externals || [];
      config.externals.push({
        'mongoose': 'commonjs mongoose',
        'argon2': 'commonjs argon2',
        'bcryptjs': 'commonjs bcryptjs',
        '@aws-sdk/client-s3': 'commonjs @aws-sdk/client-s3',
        '@aws-sdk/s3-request-presigner': 'commonjs @aws-sdk/s3-request-presigner',
        'formidable': 'commonjs formidable',
        'sharp': 'commonjs sharp',
      });
    }

    return config;
  },
  
  // Enable proper build optimizations
  productionBrowserSourceMaps: false,
  swcMinify: true,
  
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Ensure proper output for Render deployment (only in production)
  ...(process.env.NODE_ENV === 'production' && { output: 'standalone' }),
}

module.exports = nextConfig