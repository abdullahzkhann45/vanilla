import 'reflect-metadata';
import 'dotenv/config';
import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vanilla';
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@vanilla.test';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'changeme';

const SIZES = ['S', 'M', 'L', 'XL'] as const;

function placeholderImage(label: string, colour: string) {
  // Simple inline SVG as a data URL — works with next/image via `unoptimized` or direct <img>.
  const hex = ({
    Black: '#111111',
    'Off White': '#f1ece0',
    Charcoal: '#2a2a2a',
    Sand: '#d8c7a7',
  } as Record<string, string>)[colour] || '#888';
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 1000'>
    <rect width='800' height='1000' fill='${hex}'/>
    <text x='50%' y='50%' text-anchor='middle' font-family='serif' font-size='40' fill='rgba(255,255,255,.6)'>${label}</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

const products = [
  {
    slug: 'sweatshirt-01',
    name: 'Essential Crew Sweatshirt',
    type: 'sweatshirt',
    description:
      'A heavyweight crew in brushed French terry. Clean lines, considered proportions, built to live in year-round.',
    fabric: '400 gsm French terry, 80% cotton / 20% polyester',
    care: 'Machine wash cold, inside out. Do not tumble dry. Reshape and lay flat to dry.',
    basePrice: 850000, // 8 500 PKR
    colours: ['Black', 'Off White'],
    skuRoot: 'VNL-SW01',
  },
  {
    slug: 'sweatshirt-02',
    name: 'Studio Hooded Sweatshirt',
    type: 'sweatshirt',
    description:
      'A quieter take on the hoodie. Mid-weight loopback cotton, a shaped hood, and a cropped boxy fit.',
    fabric: '380 gsm loopback cotton, 100% cotton',
    care: 'Machine wash cold. Line dry. Cool iron if needed.',
    basePrice: 950000,
    colours: ['Charcoal', 'Sand'],
    skuRoot: 'VNL-SW02',
  },
  {
    slug: 'sweatpants-01',
    name: 'Essential Jogger',
    type: 'sweatpants',
    description:
      'Our everyday jogger. Tapered leg, elastic waist with a flat drawcord, deep side pockets.',
    fabric: '400 gsm French terry, 80% cotton / 20% polyester',
    care: 'Machine wash cold, inside out. Do not tumble dry.',
    basePrice: 800000,
    colours: ['Black', 'Off White'],
    skuRoot: 'VNL-SP01',
  },
  {
    slug: 'sweatpants-02',
    name: 'Studio Wide-Leg Pant',
    type: 'sweatpants',
    description:
      'Relaxed through the hip and thigh, straight at the hem. Falls softly. Dress it up or down.',
    fabric: '380 gsm loopback cotton, 100% cotton',
    care: 'Machine wash cold. Line dry.',
    basePrice: 900000,
    colours: ['Charcoal', 'Sand'],
    skuRoot: 'VNL-SP02',
  },
];

export async function seed(opts: { uri?: string; disconnect?: boolean } = {}) {
  const uri = opts.uri || MONGODB_URI;
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
    console.log('[seed] connected', uri);
  }

  const db = mongoose.connection.db!;

  // -- products
  const productsCol = db.collection('products');
  await productsCol.createIndex({ slug: 1 }, { unique: true });

  for (const p of products) {
    const variants = p.colours.flatMap((colour) =>
      SIZES.map((size) => ({
        sku: `${p.skuRoot}-${colour.replace(/\s+/g, '').toUpperCase().slice(0, 3)}-${size}`,
        size,
        colour,
        price: p.basePrice,
        stock: 15,
        isActive: true,
      })),
    );
    const images = p.colours.map((c, i) => ({
      url: placeholderImage(p.name, c),
      alt: `${p.name} in ${c}`,
      order: i,
    }));

    await productsCol.updateOne(
      { slug: p.slug },
      {
        $set: {
          slug: p.slug,
          name: p.name,
          type: p.type,
          description: p.description,
          fabric: p.fabric,
          care: p.care,
          basePrice: p.basePrice,
          currency: 'PKR',
          images,
          variants,
          isPublished: true,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    );
    console.log(`[seed] product: ${p.slug} (${variants.length} variants)`);
  }

  // -- admin
  const adminsCol = db.collection('adminusers');
  await adminsCol.createIndex({ email: 1 }, { unique: true });
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await adminsCol.updateOne(
    { email: ADMIN_EMAIL.toLowerCase() },
    {
      $set: { email: ADMIN_EMAIL.toLowerCase(), passwordHash: hash, role: 'admin', updatedAt: new Date() },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true },
  );
  console.log(`[seed] admin: ${ADMIN_EMAIL} (password: ${ADMIN_PASSWORD})`);

  // -- settings
  const settingsCol = db.collection('settings');
  await settingsCol.updateOne(
    {},
    {
      $setOnInsert: {
        flatShippingRate: 20000,
        freeShippingThreshold: 500000,
        storeEmail: 'orders@vanilla.pk',
        maintenanceMode: false,
        codMaxAutoApprove: 1000000,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );
  console.log('[seed] settings: default');

  // -- sample discount
  const discountsCol = db.collection('discounts');
  await discountsCol.createIndex({ code: 1 }, { unique: true });
  await discountsCol.updateOne(
    { code: 'WELCOME10' },
    {
      $set: {
        code: 'WELCOME10',
        kind: 'percentage',
        value: 10,
        isActive: true,
        usageCount: 0,
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true },
  );
  console.log('[seed] discount: WELCOME10 (10%)');

  if (opts.disconnect !== false) {
    await mongoose.disconnect();
    console.log('[seed] disconnected');
  }
  console.log('[seed] done');
}

if (require.main === module) {
  seed().catch((e) => { console.error(e); process.exit(1); });
}
