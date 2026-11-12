import 'reflect-metadata';
import 'dotenv/config';
import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vanilla';
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@vanilla.test';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'changeme';

const SIZES = ['S', 'M', 'L', 'XL'] as const;

function placeholderImage(label: string, colour: string, kind: 'crewneck' | 'sweatpant') {
  const bg = '#eae4d7';
  const fill = colour === 'Bone' ? '#eee5d2' : '#2a2724';
  const shade = colour === 'Bone' ? '#d9ceb6' : '#1a1816';
  const shadow = 'rgba(0,0,0,.08)';
  const body =
    kind === 'crewneck'
      ? `
        <ellipse cx='400' cy='820' rx='210' ry='22' fill='${shadow}'/>
        <path d='M240 320 Q 310 280 400 280 Q 490 280 560 320 L 640 400 L 600 440 L 560 420 L 560 780 L 240 780 L 240 420 L 200 440 L 160 400 Z' fill='${fill}'/>
        <path d='M340 280 Q 400 310 460 280 Q 440 300 400 300 Q 360 300 340 280 Z' fill='${shade}'/>
        <rect x='240' y='750' width='320' height='30' fill='${shade}' opacity='.5'/>`
      : `
        <ellipse cx='400' cy='920' rx='220' ry='22' fill='${shadow}'/>
        <path d='M260 240 Q 400 220 540 240 L 560 900 L 420 900 L 410 500 L 390 500 L 380 900 L 240 900 Z' fill='${fill}'/>
        <rect x='240' y='870' width='140' height='30' fill='${shade}' opacity='.5'/>
        <rect x='420' y='870' width='140' height='30' fill='${shade}' opacity='.5'/>`;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 1000'>
    <rect width='800' height='1000' fill='${bg}'/>
    ${body}
    <text x='40' y='60' font-family='Georgia,serif' font-size='18' fill='#8b857a' letter-spacing='3'>${label.toUpperCase()}</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

const products = [
  {
    slug: 'mill-crewneck',
    name: 'The Mill Crewneck',
    type: 'sweatshirt',
    kind: 'crewneck' as const,
    gsm: 420,
    description:
      'Boxy body, dropped shoulder, true to size. A 420 gsm loopback crewneck in long-staple cotton, cut once and left alone.',
    fabric: '420 gsm loopback · 100% long-staple cotton · brushed inside · garment washed twice, pre-shrunk',
    care: 'Wash cold, inside out, dry flat. It will last a decade.',
    basePrice: 1850000, // PKR 18,500
    colours: ['Bone', 'Charcoal'],
    skuRoot: 'VNL-MC',
  },
  {
    slug: 'ravi-crewneck',
    name: 'The Ravi Crewneck',
    type: 'sweatshirt',
    kind: 'crewneck' as const,
    gsm: 380,
    description:
      'Boxy body, dropped shoulder, true to size. A 380 gsm brushed-back crewneck for the months Lahore is almost warm.',
    fabric: '380 gsm brushed back · 100% long-staple cotton · garment washed twice, pre-shrunk',
    care: 'Wash cold, inside out, dry flat.',
    basePrice: 1680000, // PKR 16,800
    colours: ['Bone', 'Charcoal'],
    skuRoot: 'VNL-RC',
  },
  {
    slug: 'mill-sweatpant',
    name: 'The Mill Sweatpant',
    type: 'sweatpants',
    kind: 'sweatpant' as const,
    gsm: 420,
    description:
      'Straight leg, ribbed cuff, flat drawcord. A 420 gsm loopback sweatpant in long-staple cotton.',
    fabric: '420 gsm loopback · 100% long-staple cotton · garment washed twice, pre-shrunk',
    care: 'Wash cold, inside out, dry flat.',
    basePrice: 1650000, // PKR 16,500
    colours: ['Bone', 'Charcoal'],
    skuRoot: 'VNL-MS',
  },
  {
    slug: 'ravi-sweatpant',
    name: 'The Ravi Sweatpant',
    type: 'sweatpants',
    kind: 'sweatpant' as const,
    gsm: 380,
    description:
      'Straight leg, ribbed cuff, flat drawcord. A 380 gsm brushed-back sweatpant.',
    fabric: '380 gsm brushed back · 100% long-staple cotton · garment washed twice, pre-shrunk',
    care: 'Wash cold, inside out, dry flat.',
    basePrice: 1490000, // PKR 14,900
    colours: ['Bone', 'Charcoal'],
    skuRoot: 'VNL-RS',
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
      url: placeholderImage(`${p.gsm} GSM · ${c}`, c, p.kind),
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
