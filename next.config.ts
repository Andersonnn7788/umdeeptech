import type { NextConfig } from 'next'

type ImageConfig = NonNullable<NextConfig['images']>
type RemotePatternList = NonNullable<ImageConfig['remotePatterns']>

const remotePatterns: RemotePatternList = [
  {
  protocol: 'https',
  hostname: 'eketluxoscniasfhhfqt.supabase.co',
  pathname: '/storage/v1/object/public/**',
},
]

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

if (supabaseUrl) {
  try {
    const { hostname } = new URL(supabaseUrl)

    remotePatterns.push({
      protocol: 'https',
      hostname,
      pathname: '/storage/**',
    })
  } catch (error) {
    console.warn(
      'Failed to parse NEXT_PUBLIC_SUPABASE_URL; skipping Supabase image allowlist.',
      error,
    )
  }
}

const images: NextConfig['images'] =
  remotePatterns.length > 0
    ? {
        remotePatterns,
      }
    : undefined

const nextConfig: NextConfig = {
  // hide the floating "N" button entirely in dev
  devIndicators: false,
  images,
}

export default nextConfig

