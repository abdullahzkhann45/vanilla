'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminFetch } from '@/lib/admin-client';
import { formatPKR, Order } from '@/lib/shared';

const STATUSES = ['', 'pending_confirmation', 'pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'returned'];

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    adminFetch<Order[]>(`/admin/orders${filter ? `?status=${filter}` : ''}`).then(setOrders).catch(() => {});
  }, [filter]);

  return (
    <div>
      <h1 className="h-serif" style={{ fontSize: 28, margin: '0 0 16px' }}>Orders</h1>
      <div style={{ marginBottom: 14 }}>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: 8 }}>
          {STATUSES.map((s) => <option key={s} value={s}>{s || 'All statuses'}</option>)}
        </select>
      </div>
      <table>
        <thead>
          <tr><th>Order</th><th>Email</th><th>Status</th><th>Payment</th><th>Total</th><th>Placed</th><th></th></tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o._id}>
              <td><strong>{o.orderNumber}</strong></td>
              <td>{o.email}</td>
              <td>{o.status}</td>
              <td>{o.paymentMethod.toUpperCase()} · {o.paymentStatus}</td>
              <td>{formatPKR(o.total)}</td>
              <td>{new Date(o.createdAt).toLocaleDateString()}</td>
              <td><Link href={`/admin/orders/${o._id}`}>Open</Link></td>
            </tr>
          ))}
          {!orders.length && <tr><td colSpan={7} style={{ color: '#666' }}>No orders.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
