'use client';
import { useMemo, useState } from 'react';
import { formatPKR, Product, Variant, Size } from '@vanilla/shared';
import { useCart } from '@/lib/cart-store';

const SIZE_CHART_SWEATSHIRT = [
  { size: 'S', chest_cm: 102, length_cm: 68 },
  { size: 'M', chest_cm: 108, length_cm: 70 },
  { size: 'L', chest_cm: 114, length_cm: 72 },
  { size: 'XL', chest_cm: 120, length_cm: 74 },
];
const SIZE_CHART_SWEATPANTS = [
  { size: 'S', waist_cm: 72, inseam_cm: 74 },
  { size: 'M', waist_cm: 78, inseam_cm: 75 },
  { size: 'L', waist_cm: 84, inseam_cm: 76 },
  { size: 'XL', waist_cm: 90, inseam_cm: 77 },
];

export function ProductBuy({ product }: { product: Product }) {
  const [imgIdx, setImgIdx] = useState(0);
  const colours = useMemo(() => Array.from(new Set(product.variants.map((v) => v.colour))), [product]);
  const [colour, setColour] = useState(colours[0]);
  const [size, setSize] = useState<Size | null>(null);
  const { add } = useCart();

  const variants = product.variants.filter((v) => v.colour === colour);
  const selected: Variant | undefined = variants.find((v) => v.size === size);
  const allSoldOut = product.variants.every((v) => v.stock === 0 || !v.isActive);

  const chart = product.type === 'sweatshirt' ? SIZE_CHART_SWEATSHIRT : SIZE_CHART_SWEATPANTS;

  return (
    <>
      <div className="gallery">
        <div
          className="main"
          style={{ backgroundImage: `url(${product.images[imgIdx]?.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          aria-label={product.images[imgIdx]?.alt || product.name}
        />
        <div className="thumbs">
          {product.images.map((im, i) => (
            <button
              key={i}
              className={i === imgIdx ? 'active' : ''}
              style={{ backgroundImage: `url(${im.url})`, backgroundSize: 'cover' }}
              onClick={() => setImgIdx(i)}
              aria-label={`Image ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <div>
        <h1>{product.name}</h1>
        <div className="price">{formatPKR(product.basePrice)}</div>

        <span className="label">Colour · {colour}</span>
        <div className="swatches">
          {colours.map((c) => (
            <button key={c} className={`swatch ${c === colour ? 'active' : ''}`} onClick={() => { setColour(c); setSize(null); }}>
              {c}
            </button>
          ))}
        </div>

        <span className="label">Size</span>
        <div className="sizes">
          {(['S', 'M', 'L', 'XL'] as Size[]).map((s) => {
            const v = variants.find((x) => x.size === s);
            const soldOut = !v || v.stock === 0 || !v.isActive;
            return (
              <button
                key={s}
                className={`size ${size === s ? 'active' : ''}`}
                disabled={soldOut}
                onClick={() => setSize(s)}
              >
                {s}
              </button>
            );
          })}
        </div>

        <button
          className="addcart"
          disabled={allSoldOut || !selected || selected.stock === 0}
          onClick={() => selected && add(product._id as string, selected.sku, 1)}
        >
          {allSoldOut ? 'Sold out' : !selected ? 'Select a size' : 'Add to bag'}
        </button>

        <div className="spec">
          <h4>Description</h4>
          <p>{product.description}</p>
        </div>
        <div className="spec">
          <h4>Fabric</h4>
          <p>{product.fabric}</p>
        </div>
        <div className="spec">
          <h4>Care</h4>
          <p>{product.care}</p>
        </div>
        <div className="size-chart" aria-label="Size chart">
          <h4 style={{ margin: 0, marginBottom: 6 }}>Size chart (cm)</h4>
          <table>
            <thead>
              <tr><th>Size</th>{Object.keys(chart[0]).filter((k) => k !== 'size').map((k) => <th key={k}>{k.replace('_cm', ' (cm)')}</th>)}</tr>
            </thead>
            <tbody>
              {chart.map((row: any) => (
                <tr key={row.size}>
                  <td>{row.size}</td>
                  {Object.keys(row).filter((k) => k !== 'size').map((k) => <td key={k}>{row[k]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
