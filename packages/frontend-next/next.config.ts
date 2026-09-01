import type { NextConfig } from 'next'

const backendOrigin = process.env.BACKEND_ORIGIN || 'http://127.0.0.1:3000'
const basePath = ''

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Type checking runs as a separate build step. Next 16.3.2 currently fails
  // while parsing TypeScript 5.9's otherwise valid `tsc --showConfig` output.
  typescript: { ignoreBuildErrors: true },
  experimental: { useTypeScriptCli: false },
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  async headers() {
    return [
      {
        source: '/((?!api|_next|uploads|robots|sitemap|manifest|sw\\.js|favicon|icon|apple-touch).*)',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=600' },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${backendOrigin}/api/:path*`, basePath: false },
      { source: '/uploads/:path*', destination: `${backendOrigin}/uploads/:path*`, basePath: false },
    ]
  },
}

export default nextConfig
