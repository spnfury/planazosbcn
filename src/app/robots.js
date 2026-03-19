export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/auth/', '/checkout/'],
      },
    ],
    sitemap: 'https://planazosbcn.com/sitemap.xml',
  };
}
