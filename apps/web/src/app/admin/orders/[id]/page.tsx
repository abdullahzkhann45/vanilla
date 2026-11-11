'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { adminFetch } from '@/lib/admin-client';
import { formatPKR, Order } from '@vanilla/shared';

const NEXT: Record<string, string[]> = {
  pending_confirmation: ['confirmed', 'cancelled'],
  pending: ['confirmed', 'cancelled'],
  confirmed: ['packed', 'cancelled'],
  packed: ['shipped'],
  shipped: ['delivered', 'returned'],
  delivered: ['returned'],
};

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState('');
  const [err, setErr] = useState('');

  const load = () =>
    adminFetch<Order>(`/admin/orders/${id}`).then((o) => { setOrder(o); setTracking(o.trackingNumber || ''); });
  useEffect(() => { load(); }, [id]);

  if (!order) return <div>Loading…</div>;

  const setStatus = async (status: string) => {
    try {
      await adminFetch(`/admin/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setErr(''); load();
    } catch (e: any) {
      setErr(e.message || 'Error');
    }
  };
  const saveTracking = async () => {
    await adminFetch(`/admin/orders/${id}/tracking`, { method: 'PATCH', body: JSON.stringify({ trackingNumber: tracking }) });
    load();
  };

  const print = () => window.print();

  return (
    <div>
      <h1 className="h-serif" style={{ fontSize: 24, margin: 0 }}>{order.orderNumber}</h1>
      <div style={{ color: '#666' }}>{order.email} · {new Date(order.createdAt).toLocaleString()}</div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginTop: 20 }}>
        <div style={{ background: '#fff', padding: 20, border: '1px solid var(--rule)' }}>
          <h2 style={{ marginTop: 0 }}>Items</h2>
          {order.items.map((it, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 1fr auto', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--rule)' }}>
              <div style={{ aspectRatio: '1', background: `url(${it.imageUrl}) center/cover` }} />
              <div>
                <strong>{it.productName}</strong><br/>
                <span style={{ color: '#666', fontSize: 12 }}>{it.size} · {it.colour} · SKU {it.variantSku}</span>
              </div>
              <div>{it.quantity} × {formatPKR(it.unitPrice)}</div>
            </div>
          ))}
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>{formatPKR(order.subtotal)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Discount</span><span>−{formatPKR(order.discountAmount)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Shipping</span><span>{formatPKR(order.shippingAmount)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}><span>Total</span><span>{formatPKR(order.total)}</span></div>
          </div>
          <button onClick={print} style={{ marginTop: 16, padding: '8px 14px' }}>Print packing slip</button>
        </div>

        <div style={{ background: '#fff', padding: 20, border: '1px solid var(--rule)' }}>
          <h2 style={{ marginTop: 0 }}>Shipping</h2>
          <div style={{ fontSize: 14 }}>
            {order.shipping.fullName}<br/>
            {order.shipping.phone}<br/>
            {order.shipping.line1}<br/>
            {order.shipping.line2 && <>{order.shipping.line2}<br/></>}
            {order.shipping.city}, {order.shipping.province}<br/>
            {order.shipping.postalCode}<br/>
            {order.shipping.country}
          </div>

          <h2 style={{ marginTop: 20 }}>Status</h2>
          <div><strong>{order.status}</strong></div>
          <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(NEXT[order.status] || []).map((s) => (
              <button key={s} onClick={() => setStatus(s)} style={{ padding: '6px 10px', fontSize: 12 }}>→ {s}</button>
            ))}
          </div>
          {err && <div style={{ color: '#a33', fontSize: 12, marginTop: 8 }}>{err}</div>}

          <h2 style={{ marginTop: 20 }}>Tracking</h2>
          <input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Courier tracking number" style={{ padding: 8, width: '100%' }} />
          <button onClick={saveTracking} style={{ padding: '6px 14px', marginTop: 6 }}>Save & mark shipped</button>

          <h2 style={{ marginTop: 20 }}>Payment</h2>
          <div>{order.paymentMethod.toUpperCase()} — {order.paymentStatus}</div>
        </div>
      </div>
    </div>
  );
}
