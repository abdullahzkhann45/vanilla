import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const base = envUrl && !/your-|example\.|localhost/i.test(envUrl) ? envUrl : 'https://vanillaretail.com';
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/checkout', '/order'] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
