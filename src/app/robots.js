export default function robots() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://planazosbcn.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/checkout/',
          '/cuenta/',
          '/restaurant/',
          '/completar-perfil/',
          '/qr/',
          '/login',
          '/registro',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
