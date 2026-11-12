import { api } from '@/lib/api';
import { formatPKR, Order } from '@/lib/shared';
import { PurchaseEvent } from './PurchaseEvent';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Order — Vanilla' };

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { email?: string };
}) {
  const email = searchParams.email || '';
  const order = await api<Order>(`/orders/${params.id}?email=${encodeURIComponent(email)}`).catch(() => null);

  if (!order) {
    return (
      <section className="container" style={{ padding: '60px 0' }}>
        <h1 className="h-serif">Order not found</h1>
        <p>We couldn’t find this order for that email. If you just paid, please wait a moment and refresh.</p>
      </section>
    );
  }

  return (
    <section className="container" style={{ padding: '32px 0 80px', maxWidth: 760 }}>
      <PurchaseEvent
        orderNumber={order.orderNumber}
        totalPaisa={order.total}
        items={order.items.map((it) => ({
          id: it.variantSku,
          name: it.productName,
          pricePaisa: it.unitPrice,
          quantity: it.quantity,
        }))}
      />
      <h1 className="h-serif" style={{ fontSize: 32, margin: 0 }}>Thank you — order {order.orderNumber}</h1>
      <p style={{ color: '#666' }}>
        {order.paymentMethod === 'cod'
          ? 'We’ll call or WhatsApp to confirm your order before dispatch.'
          : order.paymentStatus === 'paid'
            ? 'Your payment is confirmed. We’ll ship within 2 business days.'
            : 'Awaiting payment confirmation from the gateway.'}
      </p>
      <div className="panel" style={{ marginTop: 20 }}>
        {order.items.map((it, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--rule)' }}>
            <div style={{ aspectRatio: '1', background: `url(${it.imageUrl}) center/cover`, backgroundColor: '#eee' }} />
            <div>
              <strong>{it.productName}</strong>
              <div style={{ color: '#666', fontSize: 13 }}>{it.size} · {it.colour} · Qty {it.quantity}</div>
            </div>
            <div>{formatPKR(it.unitPrice * it.quantity)}</div>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}><span>Subtotal</span><span>{formatPKR(order.subtotal)}</span></div>
        {order.discountAmount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Discount</span><span>−{formatPKR(order.discountAmount)}</span></div>}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Shipping</span><span>{order.shippingAmount === 0 ? 'Free' : formatPKR(order.shippingAmount)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--rule)' }}>
          <span>Total</span><span>{formatPKR(order.total)}</span>
        </div>
        <p style={{ color: '#666', fontSize: 13, marginTop: 20 }}>
          Status: <strong>{order.status}</strong><br />
          Payment: <strong>{order.paymentMethod.toUpperCase()}</strong> — {order.paymentStatus}<br />
          Delivery estimate: 3–7 business days within Pakistan.
        </p>
      </div>
    </section>
  );
}
