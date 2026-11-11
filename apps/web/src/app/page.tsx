import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPKR, Product } from '@vanilla/shared';

// Home: hero + the four products. No carousel, no popup. Static, revalidated.
export const revalidate = 300;

export default async function HomePage() {
  const products = await api<Product[]>('/products').catch(() => []);
  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Quietly made<br/>to wear every day.</h1>
          <p>Vanilla is a small clothing brand from Pakistan. Four pieces at launch — sweatshirts and sweatpants in heavyweight cotton, cut clean, made to last.</p>
          <Link className="cta" href="/shop">Shop the collection</Link>
        </div>
      </section>

      <section className="container">
        <div className="grid">
          {products.map((p) => <ProductCard key={p._id} p={p} />)}
        </div>
      </section>
    </>
  );
}

function ProductCard({ p }: { p: Product }) {
  const soldOut = p.variants.every((v) => v.stock === 0 || !v.isActive);
  return (
    <Link href={`/product/${p.slug}`} className={`card ${soldOut ? 'sold' : ''}`}>
      <div className="ph" style={{ backgroundImage: `url(${p.images[0]?.url})`, backgroundSize: 'cover' }} />
      <h3>{p.name}</h3>
      <div className="price">{formatPKR(p.basePrice)}</div>
      {soldOut && <span className="sold-tag">Sold out</span>}
    </Link>
  );
}
