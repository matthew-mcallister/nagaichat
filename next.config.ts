import { API_BASE_URL } from '@/lib/backend/constants'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Fixes packages with conditional/optional imports
  serverExternalPackages: ['sequelize'],

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_BASE_URL}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
