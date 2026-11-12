import 'dotenv/config';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;
const SIZES = ['S', 'M', 'L', 'XL'] as const;
type Size = (typeof SIZES)[number];

type ProductDef = {
  slug: string;
  name: string;
  type: 'sweatshirt' | 'sweatpants';
  description: string;
  fabric: string;
  care: string;
  basePrice: number; // paisa — price customers pay
  compareAtPrice: number; // paisa — original price, struck through
  colours: string[];
  skuRoot: string;
  images: string[];
  stock: Record<Size, number>; // units per size (inventory as of 2026-11-12)
};

const products: ProductDef[] = [
  {
    slug: 'black-wide-leg-heavy-sweatpants',
    name: 'Black Wide Leg Heavy Sweatpants',
    type: 'sweatpants',
    description:
      'A wide-leg sweatpant with weight. Cut full through the hip, relaxed down the thigh, and left loose at the hem — no tapered ankle, no gathered cuff. Heavyweight cotton drapes straight, holds a crease where you want one, and softens with every wash. Pleated front, deep side pockets, a flat drawcord at the waist. Made to be worn.',
    fabric: '280 gsm loopback · 100% long-staple cotton · garment washed twice, pre-shrunk',
    care: 'Wash cold, inside out, dry flat. Cool iron if you like a crease.',
    basePrice: 256000, // PKR 2,560
    compareAtPrice: 350000, // PKR 3,500
    colours: ['Charcoal'],
    skuRoot: 'VNL-WL01',
    images: [
      '/products/wide-leg-heavy/1.jpg',
      '/products/wide-leg-heavy/2.jpg',
      '/products/wide-leg-heavy/3.jpg',
    ],
    stock: { S: 5, M: 3, L: 2, XL: 2 },
  },
  {
    slug: 'black-collared-sweatshirt',
    name: 'Black Collared Sweatshirt',
    type: 'sweatshirt',
    description:
      'A sweatshirt with a collar, not a hood. An open polo placket sits clean under the jaw, a short notch at the throat for air. Heavy brushed cotton on the inside, a dry surface on the outside, ribbed cuffs and hem that hold their shape. Boxy through the body, dropped shoulder, long enough to layer. The kind of thing you reach for first and keep reaching for.',
    fabric: '280 gsm brushed fleece · 100% long-staple cotton · garment washed twice, pre-shrunk',
    care: 'Wash cold, inside out, dry flat. Reshape the collar while damp.',
    basePrice: 294900, // PKR 2,949
    compareAtPrice: 360000, // PKR 3,600
    colours: ['Black'],
    skuRoot: 'VNL-CS01',
    images: [
      '/products/black-collared/1.jpg',
      '/products/black-collared/2.jpg',
      '/products/black-collared/3.jpg',
    ],
    stock: { S: 5, M: 9, L: 3, XL: 6 },
  },
  {
    slug: 'plain-black-sweatshirt',
    name: 'Plain Black Sweatshirt',
    type: 'sweatshirt',
    description:
      'A plain crewneck, done properly. No logo, no seam at the chest, no clever cut — just a clean crew in heavy brushed cotton. Ribbed collar, cuffs and hem that hold, a boxy body that sits where it should, and a dropped shoulder that softens as the fabric settles. The black you reach for first every winter.',
    fabric: '390 gsm brushed loopback · 100% long-staple cotton · garment washed twice, pre-shrunk',
    care: 'Wash cold, inside out, dry flat. Reshape at the shoulders while damp.',
    basePrice: 234900, // PKR 2,349
    compareAtPrice: 280000, // PKR 2,800
    colours: ['Black'],
    skuRoot: 'VNL-PB01',
    images: [
      '/products/plain-black-sweatshirt/1.jpg',
      '/products/plain-black-sweatshirt/2.jpg',
    ],
    stock: { S: 6, M: 10, L: 5, XL: 3 },
  },
  {
    slug: 'grey-wide-leg-heavy-sweatpants',
    name: 'Grey Wide Leg Heavy Sweatpants',
    type: 'sweatpants',
    description:
      'The wide leg in heather grey. Full through the hip, relaxed down the thigh, left loose at the hem. The same heavyweight cotton that drapes straight and softens with every wash — now in a marled grey that wears quietly with anything. Pleated front, deep side pockets, flat drawcord at the waist.',
    fabric: '280 gsm loopback · 100% long-staple cotton · garment washed twice, pre-shrunk',
    care: 'Wash cold, inside out, dry flat. Cool iron if you like a crease.',
    basePrice: 256000, // PKR 2,560
    compareAtPrice: 350000, // PKR 3,500
    colours: ['Grey'],
    skuRoot: 'VNL-WL02',
    images: [
      '/products/wide-leg-heavy-grey/1.jpg',
      '/products/wide-leg-heavy-grey/2.jpg',
    ],
    stock: { S: 7, M: 7, L: 4, XL: 7 },
  },
];

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('[add-product] connected');
  const col = mongoose.connection.db!.collection('products');

  for (const p of products) {
    const variants = p.colours.flatMap((colour) =>
      SIZES.map((size) => ({
        sku: `${p.skuRoot}-${colour.slice(0, 3).toUpperCase()}-${size}`,
        size,
        colour,
        price: p.basePrice,
        stock: p.stock[size],
        isActive: true,
      })),
    );
    const images = p.images.map((url, i) => ({
      url,
      alt: `${p.name} — image ${i + 1}`,
      order: i,
    }));
    await col.updateOne(
      { slug: p.slug },
      {
        $set: {
          slug: p.slug, name: p.name, type: p.type, description: p.description,
          fabric: p.fabric, care: p.care, basePrice: p.basePrice,
          compareAtPrice: p.compareAtPrice, currency: 'PKR',
          images, variants, isPublished: true, updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    );
    console.log(`[add-product] ${p.slug}: ${variants.length} variants, ${images.length} images`);
  }
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
