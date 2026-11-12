import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPKR, Product } from '@/lib/shared';
import { ClothHero } from '@/components/ClothHero';
import { Reveal } from '@/components/Reveal';
import { Magnetic } from '@/components/Magnetic';
import { TiltCard } from '@/components/TiltCard';
import { Marquee } from '@/components/Marquee';

export const revalidate = 300;

export default async function HomePage() {
  const products = await api<Product[]>('/products').catch(() => []);
  return (
    <>
      {/* Hero */}
      <section className="container">
        <div className="hero">
          <div className="hero-grid">
            <div>
              <div className="eyebrow">
                <span>Lahore</span>
                <span>·</span>
                <span>Est. 2026</span>
                <span>·</span>
                <span>Four pieces</span>
              </div>
              <h1>
                <span className="ln"><span>Four pieces.</span></span>
                <span className="ln"><span>One cloth.</span></span>
              </h1>
              <p>
                A 390 gsm loopback knitted outside Lahore, cut once and left alone.
                We make a crewneck and a sweatpant in two weights, in two colours,
                and nothing else.
              </p>
              <div className="cta-row">
                <Magnetic><Link className="btn-primary" href="/shop">Shop the four</Link></Magnetic>
                <Magnetic><Link className="btn-ghost" href="/about">Read the cloth</Link></Magnetic>
              </div>
            </div>
            <div className="hero-canvas">
              <span className="ghost">Vanilla</span>
              <ClothHero />
              <div className="corner">The cloth follows your cursor</div>
            </div>
          </div>
        </div>
      </section>

      <Marquee items={['Cut in Lahore', 'Garment washed twice', '100% long-staple cotton', 'Dispatched in 48 hours', 'Free shipping over PKR 5,000']} />

      {/* Specification */}
      <section className="container">
        <Reveal><div className="spec-heading">The specification</div></Reveal>
        <div className="spec-row">
          {[
            { n: '390', cap: 'Grams per square metre', p: 'The crewneck weight. Heavy enough to hold a shoulder, soft on the inside from the first wear.' },
            { n: '280', cap: 'Grams per square metre', p: 'The everyday weight. Brushed back, for the months Lahore is almost warm.' },
            { n: '100%', cap: 'Long-staple cotton', p: 'Grown and spun in Punjab. No polyester, no elastane, nothing to pill.' },
            { n: '2×', cap: 'Garment washed', p: 'Washed twice before it reaches you, so it keeps its shape after yours.' },
          ].map((s, i) => (
            <Reveal key={s.cap} delay={i * 90}>
              <div>
                <div className="big">{s.n}</div>
                <div className="cap">{s.cap}</div>
                <p>{s.p}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* The whole range preview */}
      <section className="container">
        <Reveal>
          <div className="section-head">
            <span className="idx">02 / The range</span>
            <h2>The whole range</h2>
            <div className="meta">All four · Two colours · S to XL</div>
          </div>
        </Reveal>
        <div className="grid">
          {products.map((p, i) => (
            <Reveal key={p._id} delay={(i % 4) * 90}>
              <RangeTile p={p} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Making */}
      <section className="container">
        <div className="making">
          <Reveal>
            <div className="plate">
              <div className="plate-label">Plate 01 — Stack, Lahore studio</div>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div>
              <div className="micro">The making</div>
              <h3>Knitted, cut, sewn and washed inside forty kilometres.</h3>
              <p>
                Pakistan grows some of the best long-staple cotton in the world and then
                ships it away. Vanilla keeps it here. The yarn is spun in Faisalabad,
                knitted on circular machines into a heavy loopback, garment-washed
                twice so it stops moving, and sewn in a shop of eleven people in Lahore.
              </p>
              <p style={{ marginTop: 12 }}>
                Two weights. Two colours. Four sizes. We would rather make four things
                properly than forty badly.
              </p>
              <Magnetic><Link className="link" href="/shop">See the range</Link></Magnetic>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function RangeTile({ p }: { p: Product }) {
  const gsm = Number((p.fabric.match(/(\d{3,4})\s*gsm/i) || [, '420'])[1]);
  const img = p.images[0]?.url;
  const imgB = p.images[1]?.url;
  return (
    <Link href={`/product/${p.slug}`} className="card">
      <TiltCard>
        <div className="tilt-inner">
          <div className="tile">
            <span className="chip">{gsm} gsm</span>
            {img && <img className="img-a" src={img} alt={p.images[0]?.alt || p.name} />}
            {imgB && <img className="img-b" src={imgB} alt="" />}
            <span className="view-cue">View piece</span>
          </div>
        </div>
      </TiltCard>
      <div className="head">
        <h3>{p.name}</h3>
        <span className="price">
          {p.compareAtPrice ? <span className="price-was">{formatPKR(p.compareAtPrice)}</span> : null}
          {formatPKR(p.basePrice)}
        </span>
      </div>
    </Link>
  );
}
