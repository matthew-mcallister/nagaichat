import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Fixes packages with conditional/optional imports
  serverExternalPackages: ['sequelize'],
}

export default nextConfig
