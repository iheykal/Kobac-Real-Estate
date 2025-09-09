/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features properly
  experimental: {
    serverComponentsExternalPackages: ['mongoose', 'argon2', '@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner', 'formidable', 'sharp'],
  },
  
  // Optimized webpack config
  webpack: (config, { isServer, dev }) => {
    // Only externalize heavy packages for server in production
    if (isServer && !dev) {
      config.externals = config.externals || [];
      config.externals.push({
        'mongoose': 'commonjs mongoose',
        'argon2': 'commonjs argon2',
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
  
  // Ensure proper output for Render deployment
  output: 'standalone',
}

module.exports = nextConfig