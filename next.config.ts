import type { NextConfig } from 'next'

const EXPRESS_PORT = parseInt(process.env.EXPRESS_PORT || '3001', 10)

const nextConfig: NextConfig = {
  // Fixes packages with conditional/optional imports
  serverExternalPackages: ['sequelize'],

  async rewrites() {
    if (process.env.NODE_ENV !== 'production') {
      return {
        fallback: [
          {
            source: '/api/:path*',
            destination: `http://localhost:${EXPRESS_PORT}/api/:path*`,
          },
        ],
      }
    }
    return []
  },
}

export default nextConfig
