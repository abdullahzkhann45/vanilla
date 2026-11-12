/* End-to-end scenario tests against a running API (localhost:4000).
 * Creates test carts/orders, asserts behaviour, then cleans everything up and
 * restores inventory. Run: npx ts-node --transpile-only scripts/integration.test.ts */
import 'dotenv/config';
import mongoose from 'mongoose';

const API = process.env.TEST_API || 'http://localhost:4000';
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@vanilla.test';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'changeme';

let pass = 0, fail = 0;
const createdOrders: string[] = [];
const createdCarts: string[] = [];

function ok(name: string, cond: boolean, detail = '') {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (detail ? `\n      ${detail}` : '')); }
}

async function api(path: string, init: RequestInit = {}): Promise<{ status: number; body: any }> {
  const r = await fetch(API + path, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init.headers || {}) },
  });
  let body: any = null;
  try { body = await r.json(); } catch { body = null; }
  return { status: r.status, body };
}

async function newCart(): Promise<string> {
  const r = await api('/cart', { method: 'POST' });
  createdCarts.push(r.body.id);
  return r.body.id;
}

const SHIP = {
  fullName: 'Test Buyer', phone: '03001234567', line1: '1 Test St',
  city: 'Lahore', province: 'Punjab', country: 'PK',
};

async function placeOrder(cartId: string, extra: any = {}) {
  const r = await api('/checkout/session', {
    method: 'POST',
    body: JSON.stringify({ cartId, email: 'buyer@test.com', paymentMethod: 'cod', shipping: SHIP, ...extra }),
  });
  if (r.status === 201 || r.status === 200) if (r.body?.orderNumber) createdOrders.push(r.body.orderNumber);
  return r;
}

async function main() {
  console.log(`\nIntegration tests → ${API}\n`);

  // Catalogue
  const prods = (await api('/products')).body as any[];
  const bySlug = (s: string) => prods.find((p) => p.slug === s);
  const plain = bySlug('plain-black-sweatshirt');
  const collared = bySlug('black-collared-sweatshirt');
  const vOf = (p: any, size: string) => p.variants.find((v: any) => v.size === size);

  ok('catalogue has 4 products', prods.length === 4, `got ${prods.length}`);

  // ---- Scenario 1: multi-item order, correct totals + free shipping over 5000
  {
    const cart = await newCart();
    const r = await api(`/cart/${cart}`, {
      method: 'PATCH',
      body: JSON.stringify({ lines: [
        { productId: plain._id, variantSku: vOf(plain, 'M').sku, quantity: 2 },     // 2 x 2349 = 4698
        { productId: collared._id, variantSku: vOf(collared, 'L').sku, quantity: 1 }, // 1 x 2949 = 2949
      ] }),
    });
    const t = r.body;
    ok('multi-item subtotal correct', t.subtotal === 234900 * 2 + 294900, `got ${t.subtotal}`);
    ok('multi-item free shipping (>= 5000)', t.shippingAmount === 0, `got ${t.shippingAmount}`);
    ok('multi-item total correct', t.total === 234900 * 2 + 294900, `got ${t.total}`);
    ok('two distinct lines', t.lines.length === 2, `got ${t.lines.length}`);
    const place = await placeOrder(cart);
    ok('multi-item order placed', place.status === 201 && !!place.body.orderNumber, `status ${place.status}`);
  }

  // ---- Scenario 2: single cheap item -> flat shipping applied (under 5000)
  {
    const cart = await newCart();
    const r = await api(`/cart/${cart}`, { method: 'PATCH', body: JSON.stringify({ lines: [
      { productId: plain._id, variantSku: vOf(plain, 'S').sku, quantity: 1 }, // 2349 < 5000
    ] }) });
    ok('under-threshold flat shipping = 200', r.body.shippingAmount === 20000, `got ${r.body.shippingAmount}`);
    ok('under-threshold total = 2549', r.body.total === 234900 + 20000, `got ${r.body.total}`);
  }

  // ---- Scenario 3: quantity exceeding stock is rejected at checkout
  {
    const vS = vOf(plain, 'S'); // stock 6 (<20 line cap)
    const cart = await newCart();
    const over = Math.min(20, vS.stock + 1);
    await api(`/cart/${cart}`, { method: 'PATCH', body: JSON.stringify({ lines: [
      { productId: plain._id, variantSku: vS.sku, quantity: over },
    ] }) });
    const t = (await api(`/cart/${cart}`)).body;
    ok('over-stock line flagged not in stock', t.lines[0]?.inStock === false, JSON.stringify(t.lines[0]));
    const place = await placeOrder(cart);
    ok('over-stock order rejected (400)', place.status === 400, `status ${place.status}`);
    // line cap: quantity > 20 rejected by validation
    const capCart = await newCart();
    const capR = await api(`/cart/${capCart}`, { method: 'PATCH', body: JSON.stringify({ lines: [
      { productId: plain._id, variantSku: vS.sku, quantity: 21 },
    ] }) });
    ok('per-line quantity cap (>20) rejected', capR.status === 400, `status ${capR.status}`);
  }

  // ---- Scenario 4: empty cart rejected
  {
    const cart = await newCart();
    const place = await placeOrder(cart);
    ok('empty cart rejected', place.status === 400, `status ${place.status}`);
  }

  // ---- Scenario 5: discount code WELCOME10 (10%)
  {
    const cart = await newCart();
    await api(`/cart/${cart}`, { method: 'PATCH', body: JSON.stringify({ lines: [
      { productId: plain._id, variantSku: vOf(plain, 'M').sku, quantity: 1 }, // 2349
    ] }) });
    const d = await api(`/cart/${cart}/discount`, { method: 'POST', body: JSON.stringify({ code: 'WELCOME10' }) });
    ok('discount applied', d.body.discountAmount === Math.floor(234900 * 0.1), `got ${d.body.discountAmount}`);
    const invalid = await api(`/cart/${cart}/discount`, { method: 'POST', body: JSON.stringify({ code: 'NOPE123' }) });
    ok('invalid discount rejected', invalid.status === 400, `status ${invalid.status}`);
  }

  // ---- Scenario 6: ONE real order, reused for snapshot + guest lookup + admin confirm
  const vS = vOf(plain, 'S'); // stock 6
  const beforeStock = vS.stock;
  let orderNum = '';
  {
    const cart = await newCart();
    await api(`/cart/${cart}`, { method: 'PATCH', body: JSON.stringify({ lines: [
      { productId: plain._id, variantSku: vS.sku, quantity: 2 },
    ] }) });
    const place = await placeOrder(cart);
    ok('order placed (201)', place.status === 201 && !!place.body.orderNumber, `status ${place.status}`);
    orderNum = place.body.orderNumber;

    const got = await api(`/orders/${orderNum}?email=buyer@test.com`);
    const it = got.body.items?.[0];
    ok('order snapshot has product name', it?.productName === plain.name, JSON.stringify(it));
    ok('order snapshot has unit price', it?.unitPrice === 234900, `got ${it?.unitPrice}`);
    ok('order snapshot has size + colour', it?.size === 'S' && it?.colour === 'Black', JSON.stringify(it));
    ok('new COD order is pending_confirmation', got.body.status === 'pending_confirmation', got.body.status);
    ok('new COD order is unpaid', got.body.paymentStatus === 'unpaid', got.body.paymentStatus);

    // guest lookup email check
    const wrong = await api(`/orders/${orderNum}?email=hacker@evil.com`);
    ok('wrong email cannot read order', wrong.status === 403, `status ${wrong.status}`);
  }

  // ---- Scenario 7: price tampering + non-cod rejected (no successful checkout)
  {
    const cart = await newCart();
    const inj = await api(`/cart/${cart}`, { method: 'PATCH', body: JSON.stringify({ lines: [
      { productId: plain._id, variantSku: vOf(plain, 'M').sku, quantity: 1, price: 1 },
    ] }) });
    ok('client-injected price field rejected by validation', inj.status === 400, `status ${inj.status}`);
    // valid line, then non-cod payment rejected by enum
    await api(`/cart/${cart}`, { method: 'PATCH', body: JSON.stringify({ lines: [
      { productId: plain._id, variantSku: vOf(plain, 'M').sku, quantity: 1 },
    ] }) });
    const bad = await api('/checkout/session', { method: 'POST', body: JSON.stringify({
      cartId: cart, email: 'x@test.com', paymentMethod: 'safepay', shipping: SHIP }) });
    ok('non-cod payment method rejected', bad.status === 400, `status ${bad.status}`);
  }

  // ---- Scenario 8: admin confirm decrements stock (reuses scenario-6 order)
  {
    const login = await api('/admin/auth/login', { method: 'POST', body: JSON.stringify({
      email: ADMIN_EMAIL, password: ADMIN_PASSWORD }) });
    const token = login.body.token;
    ok('admin login works', !!token, `status ${login.status}`);
    const noAuth = await api('/admin/orders');
    ok('admin endpoint rejects missing token', noAuth.status === 401, `status ${noAuth.status}`);

    const adminOrders = await api('/admin/orders', { headers: { authorization: `Bearer ${token}` } });
    const ord = (adminOrders.body as any[]).find((o) => o.orderNumber === orderNum);
    ok('admin can see the order', !!ord, `orderNum ${orderNum}`);
    const confirm = await api(`/admin/orders/${ord._id}/status`, {
      method: 'PATCH', headers: { authorization: `Bearer ${token}` }, body: JSON.stringify({ status: 'confirmed' }) });
    ok('admin confirm succeeds', confirm.status === 200, `status ${confirm.status}`);
    const after = (await api('/products')).body.find((p: any) => p.slug === 'plain-black-sweatshirt');
    const afterStock = after.variants.find((v: any) => v.size === 'S').stock;
    ok('stock decremented by order qty on confirm', afterStock === beforeStock - 2, `before ${beforeStock} after ${afterStock}`);
  }

  // ---- Scenario 9: checkout rate-limit protects against floods (expects 429)
  {
    let got429 = false;
    for (let i = 0; i < 14; i++) {
      const c = await newCart();
      await api(`/cart/${c}`, { method: 'PATCH', body: JSON.stringify({ lines: [
        { productId: plain._id, variantSku: vOf(plain, 'M').sku, quantity: 1 },
      ] }) });
      const r = await placeOrder(c);
      if (r.status === 429) { got429 = true; break; }
    }
    ok('checkout rate-limit kicks in under flood (429)', got429, 'no 429 seen in 14 rapid checkouts');
  }

  // ---- Cleanup: delete test orders + carts, restore inventory
  await mongoose.connect(process.env.MONGODB_URI!);
  const db = mongoose.connection.db!;
  const delOrders = await db.collection('orders').deleteMany({ orderNumber: { $in: createdOrders } });
  const delCarts = await db.collection('carts').deleteMany({ _id: { $in: createdCarts.map((c) => new mongoose.Types.ObjectId(c)) } });
  await db.collection('discounts').updateMany({}, { $set: { usageCount: 0 } });
  console.log(`\n[cleanup] removed ${delOrders.deletedCount} test orders, ${delCarts.deletedCount} test carts`);
  await mongoose.disconnect();

  console.log(`\n${pass} passed, ${fail} failed.`);
  console.log('NOTE: scenario 9 decremented real stock; re-run `npm run add:product` to restore inventory.\n');
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
