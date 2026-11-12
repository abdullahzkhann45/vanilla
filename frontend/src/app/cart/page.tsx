'use client';
import Link from 'next/link';
import { useCart } from '@/lib/cart-store';
import { formatPKR } from '@/lib/shared';

export default function CartPage() {
  const { totals, setQty, remove } = useCart();

  if (!totals.lines.length) {
    return (
      <section className="container" style={{ padding: '60px 0' }}>
        <h1 className="h-serif" style={{ fontSize: 32 }}>Your bag is empty</h1>
        <Link href="/shop" className="cta" style={{ display: 'inline-block', marginTop: 16, padding: '12px 22px', background: '#111', color: '#fff', textTransform: 'uppercase', fontSize: 13, letterSpacing: '.08em' }}>Shop</Link>
      </section>
    );
  }

  return (
    <section className="container" style={{ padding: '32px 0 80px' }}>
      <h1 className="h-serif" style={{ fontSize: 32, margin: 0 }}>Your bag</h1>
      <div className="checkout-grid" style={{ marginTop: 20 }}>
        <div className="panel">
          {totals.lines.map((l) => (
            <div key={l.variantSku} className="line" style={{ display: 'grid', gridTemplateColumns: '90px 1fr auto', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--rule)' }}>
              <div className="ph" style={{ aspectRatio: '1', background: `url(${l.imageUrl}) center/cover` }} />
              <div>
                <strong>{l.productName}</strong>
                <div style={{ color: '#666', fontSize: 13 }}>{l.size} · {l.colour}</div>
                <div className="qty" style={{ marginTop: 6 }}>
                  <button onClick={() => setQty(l.variantSku, l.quantity - 1)}>−</button>{' '}
                  <span>{l.quantity}</span>{' '}
                  <button onClick={() => setQty(l.variantSku, l.quantity + 1)}>+</button>{' '}
                  <button onClick={() => remove(l.variantSku)} style={{ marginLeft: 8, fontSize: 11 }}>Remove</button>
                </div>
              </div>
              <div>{formatPKR(l.lineTotal)}</div>
            </div>
          ))}
        </div>
        <div className="panel">
          <h2>Summary</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>{formatPKR(totals.subtotal)}</span></div>
          {totals.discountAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Discount</span><span>−{formatPKR(totals.discountAmount)}</span></div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Shipping</span><span>{totals.shippingAmount === 0 ? 'Free' : formatPKR(totals.shippingAmount)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--rule)' }}>
            <span>Total</span><span>{formatPKR(totals.total)}</span>
          </div>
          <Link href="/checkout" className="checkout" style={{ display: 'block', marginTop: 20, padding: 14, background: '#111', color: '#fff', textAlign: 'center', fontSize: 13, letterSpacing: '.1em', textTransform: 'uppercase' }}>Checkout</Link>
        </div>
      </div>
    </section>
  );
}
