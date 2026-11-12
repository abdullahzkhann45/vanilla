'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-store';
import { formatPKR } from '@vanilla/shared';
import { trackBeginCheckout } from '@/lib/analytics';

export default function CheckoutPage() {
  const { cartId, totals } = useCart();
  const router = useRouter();
  const [f, setF] = useState({
    email: '',
    fullName: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    province: 'Sindh',
    postalCode: '',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // GA4 begin_checkout — once, as soon as the cart has lines.
  const checkoutTracked = useRef(false);
  useEffect(() => {
    if (checkoutTracked.current || !totals.lines.length) return;
    checkoutTracked.current = true;
    trackBeginCheckout(
      totals.total,
      totals.lines.map((l) => ({
        id: l.variantSku,
        name: l.productName,
        pricePaisa: l.unitPrice,
        quantity: l.quantity,
      })),
    );
  }, [totals]);

  const update = (k: keyof typeof f) => (e: any) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cartId) return;
    setBusy(true);
    setErr('');
    try {
      const r = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          cartId,
          email: f.email,
          paymentMethod: 'cod',
          shipping: {
            fullName: f.fullName,
            phone: f.phone,
            line1: f.line1,
            line2: f.line2 || undefined,
            city: f.city,
            province: f.province,
            postalCode: f.postalCode || undefined,
            country: 'PK',
          },
        }),
      });
      if (!r.ok) {
        const t = await r.text();
        throw new Error(t);
      }
      const data = await r.json();
      localStorage.removeItem('vnl_cart_id');
      router.push(`/order/${data.orderNumber}?email=${encodeURIComponent(f.email)}`);
    } catch (e: any) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  };

  if (!totals.lines.length) {
    return (
      <section className="container" style={{ padding: '60px 0' }}>
        <h1 className="h-serif">Your bag is empty</h1>
      </section>
    );
  }

  return (
    <section className="container">
      <h1 className="h-serif" style={{ fontSize: 32, margin: '24px 0 10px' }}>Checkout</h1>
      <form className="checkout-grid" onSubmit={submit}>
        <div className="panel">
          <h2>Contact</h2>
          <div className="form">
            <div className="field"><label>Email</label><input required type="email" value={f.email} onChange={update('email')} /></div>
            <div className="field"><label>Full name</label><input required value={f.fullName} onChange={update('fullName')} /></div>
            <div className="field"><label>Phone</label><input required pattern="^\+?\d{10,15}$" placeholder="03XX-XXXXXXX" value={f.phone} onChange={update('phone')} /></div>
            <div className="field"><label>Address line 1</label><input required value={f.line1} onChange={update('line1')} /></div>
            <div className="field"><label>Address line 2</label><input value={f.line2} onChange={update('line2')} /></div>
            <div className="row2">
              <div className="field"><label>City</label><input required value={f.city} onChange={update('city')} /></div>
              <div className="field"><label>Province</label>
                <select value={f.province} onChange={update('province')}>
                  <option>Sindh</option><option>Punjab</option><option>KPK</option><option>Balochistan</option><option>Gilgit-Baltistan</option><option>AJK</option><option>Islamabad</option>
                </select>
              </div>
            </div>
            <div className="field"><label>Postal code (optional)</label><input value={f.postalCode} onChange={update('postalCode')} /></div>
          </div>

          <h2 style={{ marginTop: 28 }}>Payment</h2>
          <div className="pay-opts">
            <label>
              <input type="radio" name="pay" checked readOnly />
              Cash on delivery — pay the courier on arrival
            </label>
          </div>

          {err && <div style={{ color: '#a33', marginTop: 14, fontSize: 13 }}>Error: {err}</div>}
          <button className="checkout" type="submit" disabled={busy} style={{ display: 'block', marginTop: 24, padding: 14, background: '#111', color: '#fff', width: '100%', fontSize: 13, letterSpacing: '.1em', textTransform: 'uppercase', border: 0 }}>
            {busy ? 'Placing…' : 'Place order'}
          </button>
        </div>

        <div className="panel">
          <h2>Summary</h2>
          {totals.lines.map((l) => (
            <div key={l.variantSku} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0' }}>
              <span>{l.quantity}× {l.productName} ({l.size}, {l.colour})</span>
              <span>{formatPKR(l.lineTotal)}</span>
            </div>
          ))}
          <hr style={{ border: 0, borderTop: '1px solid var(--rule)', margin: '10px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>{formatPKR(totals.subtotal)}</span></div>
          {totals.discountAmount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Discount</span><span>−{formatPKR(totals.discountAmount)}</span></div>}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Shipping</span><span>{totals.shippingAmount === 0 ? 'Free' : formatPKR(totals.shippingAmount)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginTop: 10 }}>
            <span>Total</span><span>{formatPKR(totals.total)}</span>
          </div>
        </div>
      </form>
    </section>
  );
}
