import type { MetadataRoute } from 'next';
import { api } from '@/lib/api';
import { Product } from '@vanilla/shared';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const products = await api<Product[]>('/products').catch(() => []);
  const now = new Date();
  return [
    { url: base, lastModified: now },
    { url: base + '/shop', lastModified: now },
    { url: base + '/about', lastModified: now },
    { url: base + '/size-guide', lastModified: now },
    { url: base + '/shipping-returns', lastModified: now },
    { url: base + '/privacy', lastModified: now },
    ...products.map((p) => ({ url: `${base}/product/${p.slug}`, lastModified: now })),
  ];
}
