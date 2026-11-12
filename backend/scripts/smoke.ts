/* eslint-disable no-console */
import 'reflect-metadata';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import mongoose from 'mongoose';
import { seed } from '../src/seed';

async function run() {
  const mongo = await MongoMemoryServer.create({ binary: { version: '7.0.14' } });
  const uri = mongo.getUri();
  process.env.MONGODB_URI = uri;
  process.env.PORT = '4001';
  process.env.STOREFRONT_ORIGIN = 'http://localhost:3000';
  process.env.JWT_SECRET = 'smoke-secret';
  process.env.SAFEPAY_SECRET = 'smoke-webhook';
  process.env.SEED_ADMIN_EMAIL = 'admin@vanilla.test';
  process.env.SEED_ADMIN_PASSWORD = 'changeme';
  console.log('[smoke] mongo at', uri);

  await seed({ uri, disconnect: false });
  await mongoose.disconnect(); // let Nest open its own connection

  const { AppModule } = await import('../src/app.module');
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.listen(4001);
  const base = 'http://127.0.0.1:4001';

  const results: Array<[string, boolean, any?]> = [];
  const check = async (name: string, fn: () => Promise<any>) => {
    try { const v = await fn(); results.push([name, true, v]); console.log('✓', name); }
    catch (e: any) { results.push([name, false, e.message]); console.log('✗', name, e.message); }
  };

  await check('GET /products returns 4', async () => {
    const r = await fetch(base + '/products');
    const body = await r.json();
    if (body.length !== 4) throw new Error('got ' + body.length);
    return body.length;
  });

  await check('GET /products/sweatshirt-01 ok', async () => {
    const r = await fetch(base + '/products/sweatshirt-01');
    const b = await r.json();
    if (b.variants.length !== 8) throw new Error('variants=' + b.variants.length);
    return b.variants.length;
  });

  let cartId!: string;
  await check('POST /cart creates a cart', async () => {
    const r = await fetch(base + '/cart', { method: 'POST' });
    const b = await r.json();
    cartId = b.id;
    return cartId;
  });

  // Load one product to get a variant sku + id
  let productId = '', sku = '';
  await check('fetch product for variant', async () => {
    const r = await fetch(base + '/products/sweatshirt-01');
    const b = await r.json();
    productId = b._id;
    sku = b.variants[0].sku;
    return sku;
  });

  await check('PATCH /cart adds a line, totals correct', async () => {
    const r = await fetch(base + '/cart/' + cartId, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ lines: [{ productId, variantSku: sku, quantity: 2 }] }),
    });
    const t = await r.json();
    if (t.lines.length !== 1) throw new Error('lines=' + t.lines.length);
    if (t.subtotal !== 2 * 850000) throw new Error('subtotal=' + t.subtotal);
    // 1700000 paisa > 5000 PKR threshold (500000), so shipping free
    if (t.shippingAmount !== 0) throw new Error('shipping=' + t.shippingAmount);
    return t.total;
  });

  await check('POST /cart/:id/discount applies 10%', async () => {
    const r = await fetch(base + '/cart/' + cartId + '/discount', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: 'WELCOME10' }),
    });
    const t = await r.json();
    if (t.discountAmount !== Math.floor(t.subtotal * 0.1)) throw new Error('discount=' + t.discountAmount);
    return t.discountAmount;
  });

  await check('POST /checkout/session (COD) creates order', async () => {
    const r = await fetch(base + '/checkout/session', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        cartId, email: 'buyer@example.com', paymentMethod: 'cod',
        shipping: {
          fullName: 'Ayesha K', phone: '03001234567',
          line1: '123 Street', city: 'Karachi', province: 'Sindh', country: 'PK',
        },
      }),
    });
    if (!r.ok) throw new Error('status=' + r.status + ' ' + (await r.text()));
    const b = await r.json();
    if (!b.orderNumber?.startsWith('VNL-')) throw new Error('bad orderNumber');
    return b.orderNumber;
  });

  await check('admin login returns token', async () => {
    const r = await fetch(base + '/admin/auth/login', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'admin@vanilla.test', password: 'changeme' }),
    });
    if (!r.ok) throw new Error('status=' + r.status);
    const b = await r.json();
    if (!b.token) throw new Error('no token');
    return b.token.slice(0, 16) + '…';
  });

  // Price-tampering: client sending a price field is rejected (whitelist strips it)
  await check('client cannot send price — rejected / stripped', async () => {
    const r = await fetch(base + '/cart/' + cartId, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ lines: [{ productId, variantSku: sku, quantity: 1, price: 1 }] }),
    });
    if (r.ok) throw new Error('should have been rejected');
    return 'rejected: ' + r.status;
  });

  // Webhook signature: unsigned request rejected
  await check('webhook without signature rejected', async () => {
    const r = await fetch(base + '/webhooks/payment', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ orderNumber: 'VNL-NONE', status: 'paid' }),
    });
    if (r.ok) throw new Error('should be 400');
    return r.status;
  });

  await app.close();
  await mongo.stop();

  const failed = results.filter((r) => !r[1]);
  if (failed.length) { console.error('\n' + failed.length + ' check(s) failed'); process.exit(1); }
  console.log('\nAll checks passed.');
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
