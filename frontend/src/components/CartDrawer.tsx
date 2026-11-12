'use client';
import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useCart } from '@/lib/cart-store';
import { formatPKR } from '@/lib/shared';

export function CartDrawer() {
  const path = usePathname();
  const { drawerOpen, closeDrawer, totals, setQty, remove, applyDiscount } = useCart();
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');

  if (path?.startsWith('/admin')) return null;
  if (!drawerOpen) return null;

  return (
    <>
      <div className="drawer-backdrop" onClick={closeDrawer} />
      <aside className="drawer" role="dialog" aria-label="Shopping bag">
        <header>
          <strong>Your bag</strong>
          <button onClick={closeDrawer} aria-label="Close">×</button>
        </header>

        <div className="lines">
          {totals.lines.length === 0 && <p style={{ color: '#666' }}>Your bag is empty.</p>}
          {totals.lines.map((l) => (
            <div key={l.variantSku} className="line">
              <div className="ph" style={{ backgroundImage: `url(${l.imageUrl})`, backgroundSize: 'cover' }} />
              <div className="meta">
                <div className="n">{l.productName}</div>
                <div className="v">{l.size} · {l.colour}</div>
                <div className="qty">
                  <button onClick={() => setQty(l.variantSku, l.quantity - 1)}>−</button>
                  <span>{l.quantity}</span>
                  <button onClick={() => setQty(l.variantSku, l.quantity + 1)}>+</button>
                  <button onClick={() => remove(l.variantSku)} style={{ marginLeft: 8, fontSize: 11 }}>Remove</button>
                </div>
                {!l.inStock && <div style={{ color: '#a33', fontSize: 11 }}>Out of stock</div>}
              </div>
              <div>{formatPKR(l.lineTotal)}</div>
            </div>
          ))}
        </div>

        <div className="totals">
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            <input
              className="field"
              placeholder="Discount code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{ flex: 1, padding: 8, border: '1px solid var(--rule)' }}
            />
            <button
              onClick={async () => {
                const r = await applyDiscount(code);
                setErr(r.ok ? '' : (r.error || 'Invalid'));
              }}
              style={{ padding: '0 14px', background: '#111', color: '#fff' }}
            >Apply</button>
          </div>
          {err && <div style={{ color: '#a33', fontSize: 12 }}>{err}</div>}
          <div className="row"><span>Subtotal</span><span>{formatPKR(totals.subtotal)}</span></div>
          {totals.discountAmount > 0 && (
            <div className="row"><span>Discount</span><span>−{formatPKR(totals.discountAmount)}</span></div>
          )}
          <div className="row"><span>Shipping</span><span>{totals.shippingAmount === 0 ? 'Free' : formatPKR(totals.shippingAmount)}</span></div>
          <div className="row grand"><span>Total</span><span>{formatPKR(totals.total)}</span></div>
        </div>

        <Link href="/checkout" className="checkout" onClick={closeDrawer}>Checkout</Link>
      </aside>
    </>
  );
}
