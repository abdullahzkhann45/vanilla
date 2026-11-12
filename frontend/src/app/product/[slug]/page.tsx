import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { formatPKR, Product } from '@vanilla/shared';
import { ProductBuy } from './ProductBuy';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const p = await api<Product>(`/products/${params.slug}`).catch(() => null);
  if (!p) return { title: 'Product — Vanilla' };
  return {
    title: `${p.name} — Vanilla`,
    description: p.description,
    openGraph: {
      title: p.name,
      description: p.description,
      images: p.images.map((i) => ({ url: i.url })),
    },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const p = await api<Product>(`/products/${params.slug}`).catch(() => null);
  if (!p) notFound();

  // Product JSON-LD for Google rich results
  const ld = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: p.name,
    description: p.description,
    image: p.images.map((i) => i.url),
    sku: p.variants[0]?.sku,
    offers: p.variants.map((v) => ({
      '@type': 'Offer',
      sku: v.sku,
      price: (v.price / 100).toFixed(2),
      priceCurrency: p.currency,
      availability: v.stock > 0 && v.isActive ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <ProductBuy product={p} />
    </>
  );
}
