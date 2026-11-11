import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPKR, Product } from '@vanilla/shared';

export const revalidate = 300;
export const metadata = { title: 'Shop — Vanilla' };

export default async function ShopPage({
  searchParams,
}: {
  searchParams: { type?: string };
}) {
  const type = searchParams.type;
  const products = await api<Product[]>(`/products${type ? `?type=${type}` : ''}`).catch(() => []);

  return (
    <section className="container">
      <div className="filters">
        <Link href="/shop">
          <button className={!type ? 'active' : ''}>All</button>
        </Link>
        <Link href="/shop?type=sweatshirt">
          <button className={type === 'sweatshirt' ? 'active' : ''}>Sweatshirts</button>
        </Link>
        <Link href="/shop?type=sweatpants">
          <button className={type === 'sweatpants' ? 'active' : ''}>Sweatpants</button>
        </Link>
      </div>

      <div className="grid">
        {products.map((p) => {
          const soldOut = p.variants.every((v) => v.stock === 0 || !v.isActive);
          return (
            <Link key={p._id} href={`/product/${p.slug}`} className={`card ${soldOut ? 'sold' : ''}`}>
              <div className="ph" style={{ backgroundImage: `url(${p.images[0]?.url})`, backgroundSize: 'cover' }} />
              <h3>{p.name}</h3>
              <div className="price">{formatPKR(p.basePrice)}</div>
              {soldOut && <span className="sold-tag">Sold out</span>}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
