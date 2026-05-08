/** @type {import('next').NextConfig} */

// Allow-list of remote image hostnames. Default to common providers used by
// the app; extend via NEXT_PUBLIC_IMAGE_HOSTS (comma-separated) without code
// changes. The Supabase storage host is auto-derived from
// NEXT_PUBLIC_SUPABASE_URL when present.
const baseHosts = [
  'res.cloudinary.com',
  'images.unsplash.com',
  'cdn.jsdelivr.net',
  'i.imgur.com',
  'instagram.com',
  'scontent.cdninstagram.com',
  'static.wixstatic.com',
  'lh3.googleusercontent.com',
  'avatars.githubusercontent.com',
];

const supabaseHost = (() => {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return url ? new URL(url).hostname : null;
  } catch {
    return null;
  }
})();

const extraHosts = (process.env.NEXT_PUBLIC_IMAGE_HOSTS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const allowedHosts = Array.from(
  new Set([...baseHosts, supabaseHost, ...extraHosts].filter(Boolean)),
);

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(self), microphone=(self), geolocation=(self), payment=(self)',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

const nextConfig = {
  serverExternalPackages: [
    '@remotion/renderer',
    '@remotion/bundler',
    '@remotion/cli',
  ],
  images: {
    remotePatterns: allowedHosts.map((hostname) => ({
      protocol: 'https',
      hostname,
    })),
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
