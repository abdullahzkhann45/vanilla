'use client';
import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { formatPKR, Product, Variant, Size } from '@/lib/shared';
import { useCart } from '@/lib/cart-store';
import { trackViewItem, trackAddToCart } from '@/lib/analytics';

const SWEATPANT_CHART: Array<Record<string, string | number>> = [
  { measurement: 'Waist', S: '28-29"', M: '29-32"', L: '32-34"', XL: '35-38"' },
  { measurement: 'Length', S: '40"', M: '41"', L: '42"', XL: '43"' },
];
const SWEATSHIRT_CHART: Array<Record<string, string | number>> = [
  { measurement: 'Chest', S: '21"', M: '21"', L: '22"', XL: '23"' },
  { measurement: 'Length', S: '26"', M: '27"', L: '28"', XL: '29"' },
  { measurement: 'Sleeve', S: '21"', M: '21"', L: '22"', XL: '22"' },
];

export function ProductBuy({ product }: { product: Product }) {
  const sp = useSearchParams();
  const initialColour = sp?.get('c');
  const colours = useMemo(() => Array.from(new Set(product.variants.map((v) => v.colour))), [product]);
  const [colour, setColour] = useState(initialColour && colours.includes(initialColour) ? initialColour : colours[0]);
  const [size, setSize] = useState<Size | null>(null);
  const [imgIdx, setImgIdx] = useState(0);
  const { add } = useCart();

  useEffect(() => { setSize(null); }, [colour]);

  // GA4 view_item — once per product view.
  useEffect(() => {
    trackViewItem({ id: product._id as string, name: product.name, pricePaisa: product.basePrice });
  }, [product._id, product.name, product.basePrice]);

  // Images for the current colour (fallback to all).
  const colourImages = useMemo(() => {
    const matched = product.images.filter((im) => im.alt?.toLowerCase().includes(colour.toLowerCase()));
    return matched.length ? matched : product.images;
  }, [product.images, colour]);
  useEffect(() => { setImgIdx(0); }, [colour]);
  const mainImg = colourImages[imgIdx] || colourImages[0];

  const variants = product.variants.filter((v) => v.colour === colour);
  const selected: Variant | undefined = variants.find((v) => v.size === size);
  const allSoldOut = product.variants.every((v) => v.stock === 0 || !v.isActive);

  const gsm = Number((product.fabric.match(/(\d{3,4})\s*gsm/i) || [,'420'])[1]);
  const isCrew = product.type === 'sweatshirt';
  const chart = isCrew ? SWEATSHIRT_CHART : SWEATPANT_CHART;
  const SIZES: Size[] = ['S', 'M', 'L', 'XL'];

  const fibre = '100% long-staple cotton';
  const knit = isCrew ? (gsm === 420 ? 'Heavy loopback, brushed inside' : 'Brushed back, soft hand') : (gsm === 420 ? 'Heavy loopback' : 'Brushed back');
  const finish = 'Garment washed twice, pre-shrunk';
  const origin = 'Punjab cotton, spun in Faisalabad, sewn in Lahore';

  return (
    <>
      <div className="pdp-wrap container">
        <div className="crumbs">
          <Link href="/shop">Shop</Link>
          <span className="sep">/</span>
          <Link href={`/shop?type=${product.type}`}>{isCrew ? 'Crewnecks' : 'Sweatpants'}</Link>
          <span className="sep">/</span>
          <span>{product.name}</span>
        </div>

        <div className="pdp">
          <div className="gallery">
            <div className="main">
              <span className="chip">{gsm} gsm · {colour}</span>
              {mainImg && <img src={mainImg.url} alt={mainImg.alt || product.name} />}
              <span className="corner">{imgIdx + 1} / {colourImages.length}</span>
            </div>
            {colourImages.length > 1 && (
              <div className="thumbs">
                {colourImages.map((im, i) => (
                  <button
                    key={i}
                    className={i === imgIdx ? 'active' : ''}
                    onClick={() => setImgIdx(i)}
                    aria-label={`Image ${i + 1}`}
                  >
                    <img src={im.url} alt={im.alt || `${product.name} ${i + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="buy">
            <h1>{product.name}</h1>
            <div className="price">
              {product.compareAtPrice ? <span className="price-was">{formatPKR(product.compareAtPrice)}</span> : null}
              {formatPKR(product.basePrice)}
            </div>
            <div className="taxline">Inclusive of tax. Shipping calculated at checkout.</div>

            <dl className="spec-mini">
              <div className="big">{gsm}<sup>GSM</sup></div>
              <dt>Fibre</dt><dd>{fibre}</dd>
              <dt>Knit</dt><dd>{knit}</dd>
              <dt>Finish</dt><dd>{finish}</dd>
              <dt>Origin</dt><dd>{origin}</dd>
            </dl>

            <div className="section-label">Colour <b>— {colour}</b></div>
            <div className="swatches">
              {colours.map((c) => (
                <button
                  key={c}
                  aria-label={c}
                  className={`swatch ${c.toLowerCase()} ${c === colour ? 'active' : ''}`}
                  onClick={() => setColour(c)}
                />
              ))}
            </div>

            <div className="section-label">Size <b>— {size || 'Select'}</b> <span style={{ float: 'right', borderBottom: '1px solid currentColor' }}>Chart below</span></div>
            <div className="sizes-row">
              {SIZES.map((s) => {
                const v = variants.find((x) => x.size === s);
                const stock = v && v.isActive ? v.stock : 0;
                const soldOut = stock === 0;
                return (
                  <button
                    key={s}
                    className={`size-btn ${size === s ? 'active' : ''}`}
                    disabled={soldOut}
                    onClick={() => setSize(s)}
                  >
                    <span>{s}</span>
                    <span className="size-stock">{soldOut ? 'Out' : `${stock} left`}</span>
                  </button>
                );
              })}
            </div>

            <button
              className="addcart"
              disabled={allSoldOut || !selected || selected.stock === 0}
              onClick={() => {
                if (!selected) return;
                add(product._id as string, selected.sku, 1);
                trackAddToCart({
                  id: selected.sku,
                  name: product.name,
                  pricePaisa: selected.price,
                  quantity: 1,
                });
              }}
            >
              {allSoldOut ? 'Sold out' : !selected ? 'Select a size' : `Add to bag — ${formatPKR(product.basePrice)}`}
            </button>

            <div className="notes">
              <p>{product.description}</p>
              <p>Returns within 14 days, unworn, anywhere in Pakistan.</p>
              <p>{product.care}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Size chart */}
      <div className="container size-chart-block">
        <div className="head">
          <div>
            <div className="tag">Size chart</div>
            <h2>Measured flat, in inches.</h2>
          </div>
          <div className="note">
            Your size is highlighted. Measurements are approximate — stretch a little, give a little.
          </div>
        </div>
        <div className="tag" style={{ marginTop: 16 }}>{product.name.toUpperCase()} — BODY MEASUREMENTS</div>
        <table>
          <thead>
            <tr>
              <th>Measurement</th>
              {SIZES.map((s) => <th key={s}>{s}</th>)}
            </tr>
          </thead>
          <tbody>
            {chart.map((row, ri) => (
              <tr key={ri}>
                <td>{row.measurement}</td>
                {SIZES.map((s) => <td key={s} className={size === s ? 'hl' : ''}>{row[s]}</td>)}
              </tr>
            ))}
            <tr>
              <td>In stock ({colour})</td>
              {SIZES.map((s) => {
                const v = variants.find((x) => x.size === s);
                const stock = v && v.isActive ? v.stock : 0;
                return <td key={s} className={size === s ? 'hl' : stock > 0 ? '' : 'oos'}>{stock > 0 ? `${stock} units` : 'Sold out'}</td>;
              })}
            </tr>
          </tbody>
        </table>

        <div className="fit-row">
          <div>
            <h4>The fit</h4>
            <p>Boxy through the body with a dropped shoulder. True to size. Between sizes and want length? Take the larger.</p>
          </div>
          <div>
            <h4>Shrinkage</h4>
            <p>Washed twice before it ships. Expect under half an inch more over its life, almost all of it in the body length.</p>
          </div>
          <div>
            <h4>How to measure</h4>
            <p>Lay the garment face down, flat, no stretch. Measure pit to pit for chest, and from the highest point of the shoulder straight down for length.</p>
          </div>
        </div>
      </div>
    </>
  );
}
