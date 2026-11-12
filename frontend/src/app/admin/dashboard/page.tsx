'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminFetch } from '@/lib/admin-client';
import { formatPKR } from '@/lib/shared';

type Window = { orders: number; revenue: number };
type Variant = { variantSku: string; productName: string; size: string; colour: string; units: number; revenue: number };
type Split = { cod: Window; prepaid: Window };
type Recent = {
  orderNumber: string; email: string; status: string;
  paymentMethod: string; paymentStatus: string; total: number; createdAt: string;
};
type Dashboard = {
  today: Window; last7: Window; last30: Window;
  unitsPerVariant: Variant[]; paymentSplit: Split; recent: Recent[];
};

export default function AdminDashboard() {
  const [d, setD] = useState<Dashboard | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    adminFetch<Dashboard>('/admin/dashboard').then(setD).catch((e) => setErr(String(e)));
  }, []);

  if (err) return <div style={{ color: '#a33' }}>Failed to load: {err}</div>;
  if (!d) return <div style={{ color: '#666' }}>Loading…</div>;

  return (
    <div>
      <h1 className="h-serif" style={{ fontSize: 28, margin: '0 0 20px' }}>Dashboard</h1>

      {/* KPI windows */}
      <div className="kpi-row">
        <Kpi label="Today" w={d.today} />
        <Kpi label="Last 7 days" w={d.last7} />
        <Kpi label="Last 30 days" w={d.last30} />
      </div>

      {/* Payment split */}
      <h2 className="dash-h2">Payment method</h2>
      <div className="kpi-row">
        <div className="kpi">
          <div className="kpi-label">Cash on delivery</div>
          <div className="kpi-big">{formatPKR(d.paymentSplit.cod.revenue)}</div>
          <div className="kpi-sub">{orders(d.paymentSplit.cod.orders)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Prepaid</div>
          <div className="kpi-big">{formatPKR(d.paymentSplit.prepaid.revenue)}</div>
          <div className="kpi-sub">{orders(d.paymentSplit.prepaid.orders)}</div>
        </div>
      </div>

      {/* Best sellers */}
      <h2 className="dash-h2">Units sold by variant</h2>
      <table>
        <thead>
          <tr><th>Product</th><th>Size</th><th>Colour</th><th>SKU</th><th style={{ textAlign: 'right' }}>Units</th><th style={{ textAlign: 'right' }}>Revenue</th></tr>
        </thead>
        <tbody>
          {d.unitsPerVariant.map((v) => (
            <tr key={v.variantSku}>
              <td>{v.productName}</td>
              <td>{v.size}</td>
              <td>{v.colour}</td>
              <td style={{ color: '#888', fontSize: 12 }}>{v.variantSku}</td>
              <td style={{ textAlign: 'right', fontWeight: 600 }}>{v.units}</td>
              <td style={{ textAlign: 'right' }}>{formatPKR(v.revenue)}</td>
            </tr>
          ))}
          {!d.unitsPerVariant.length && <tr><td colSpan={6} style={{ color: '#666' }}>No sales yet.</td></tr>}
        </tbody>
      </table>

      {/* Recent orders */}
      <h2 className="dash-h2">Last 20 orders</h2>
      <table>
        <thead>
          <tr><th>Order</th><th>Status</th><th>Payment</th><th style={{ textAlign: 'right' }}>Total</th><th>Placed</th><th></th></tr>
        </thead>
        <tbody>
          {d.recent.map((o) => (
            <tr key={o.orderNumber}>
              <td><strong>{o.orderNumber}</strong></td>
              <td><span className={`badge badge-${o.status}`}>{o.status.replace(/_/g, ' ')}</span></td>
              <td>{o.paymentMethod.toUpperCase()} · {o.paymentStatus}</td>
              <td style={{ textAlign: 'right' }}>{formatPKR(o.total)}</td>
              <td>{new Date(o.createdAt).toLocaleDateString()}</td>
              <td><Link href="/admin/orders">View</Link></td>
            </tr>
          ))}
          {!d.recent.length && <tr><td colSpan={6} style={{ color: '#666' }}>No orders yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function orders(n: number) {
  return `${n} ${n === 1 ? 'order' : 'orders'}`;
}

function Kpi({ label, w }: { label: string; w: Window }) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-big">{formatPKR(w.revenue)}</div>
      <div className="kpi-sub">{orders(w.orders)}</div>
    </div>
  );
}
