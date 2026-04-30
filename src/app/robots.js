export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/admin', // Esto bloquea a Google de tu panel privado
    },
    sitemap: 'https://028import.com/sitemap.xml',
  }
}