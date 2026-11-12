import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPKR, Product, Size } from '@vanilla/shared';
import { Reveal } from '@/components/Reveal';
import { TiltCard } from '@/components/TiltCard';

export const revalidate = 300;
export const metadata = { title: 'Shop — Vanilla' };

type Params = { type?: string; colour?: string; gsm?: string };

const FILTERS: { label: string; href: string; match: (p: Params) => boolean }[] = [
  { label: 'Everything', href: '/shop', match: (p) => !p.type && !p.colour && !p.gsm },
  { label: 'Crewnecks', href: '/shop?type=sweatshirt', match: (p) => p.type === 'sweatshirt' },
  { label: 'Sweatpants', href: '/shop?type=sweatpants', match: (p) => p.type === 'sweatpants' },
];

function gsmFor(p: Product): number {
  const m = p.fabric.match(/(\d{3,4})\s*gsm/i);
  return m ? Number(m[1]) : 420;
}

export default async function ShopPage({ searchParams }: { searchParams: Params }) {
  const { type, colour, gsm } = searchParams;
  const products = await api<Product[]>(`/products${type ? `?type=${type}` : ''}`).catch(() => []);

  // Expand into one tile per (product × colour).
  type Tile = { product: Product; colour: string; gsm: number; imageUrl?: string; imageUrlB?: string; allOut: boolean };
  const tiles: Tile[] = products.flatMap((p) => {
    const colours = Array.from(new Set(p.variants.map((v) => v.colour)));
    const g = gsmFor(p);
    return colours.map((c, i) => {
      const img = p.images.find((im, idx) => (p.images[idx]?.alt?.includes(c) ?? false)) || p.images[i] || p.images[0];
      const imgB = p.images.find((im) => im.url !== img?.url);
      const allOut = p.variants.filter((v) => v.colour === c).every((v) => v.stock === 0 || !v.isActive);
      return { product: p, colour: c, gsm: g, imageUrl: img?.url, imageUrlB: imgB?.url, allOut };
    });
  }).filter((t) => {
    if (colour && t.colour !== colour) return false;
    if (gsm && String(t.gsm) !== gsm) return false;
    return true;
  });

  return (
    <section className="container">
      <Reveal>
        <div className="section-head">
          <div>
            <div className="micro" style={{ marginBottom: 12 }}>Release 01 — Autumn / Winter 2026</div>
            <h2>Everything we make</h2>
          </div>
          <div className="meta">{tiles.length} of {tiles.length} pieces</div>
        </div>
      </Reveal>

      <div className="filters">
        {FILTERS.map((f) => (
          <Link key={f.label} href={f.href}>
            <span className={`pill ${f.match(searchParams) ? 'active' : ''}`}>{f.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid">
        {tiles.map((t, i) => (
          <Reveal key={i} delay={(i % 4) * 90}>
            <ShopTile t={t} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function ShopTile({ t }: { t: { product: Product; colour: string; gsm: number; imageUrl?: string; imageUrlB?: string; allOut: boolean } }) {
  const SIZES: Size[] = ['S', 'M', 'L', 'XL'];
  const stockOf = (s: Size) => {
    const v = t.product.variants.find((x) => x.colour === t.colour && x.size === s);
    return v && v.isActive ? v.stock : 0;
  };
  const total = SIZES.reduce((n, s) => n + stockOf(s), 0);
  const sub = `${t.colour} · ${t.product.fabric.split('·')[0].trim()}`;
  return (
    <Link href={`/product/${t.product.slug}?c=${encodeURIComponent(t.colour)}`} className={`card ${t.allOut ? 'sold' : ''}`}>
      <TiltCard>
        <div className="tilt-inner">
          <div className="tile">
            <span className="chip">{t.gsm} gsm</span>
            {t.allOut && <span className="soldpill">Sold out</span>}
            {t.imageUrl && <img className="img-a" src={t.imageUrl} alt={`${t.product.name} in ${t.colour}`} />}
            {t.imageUrlB && <img className="img-b" src={t.imageUrlB} alt="" />}
            {!t.allOut && <span className="view-cue">View piece</span>}
          </div>
        </div>
      </TiltCard>
      <div className="head">
        <h3>{t.product.name}</h3>
        <span className="price">
          {t.product.compareAtPrice ? <span className="price-was">{formatPKR(t.product.compareAtPrice)}</span> : null}
          {formatPKR(t.product.basePrice)}
        </span>
      </div>
      <div className="sub">{sub}{total > 0 ? ` · ${total} in stock` : ''}</div>
      <div className="sizes">
        {SIZES.map((s) => (
          <span key={s} className={stockOf(s) > 0 ? '' : 'oos'}>{s}</span>
        ))}
      </div>
    </Link>
  );
}
