'use client';
import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin-client';
import { Discount, formatPKR } from '@vanilla/shared';

export default function AdminDiscounts() {
  const [items, setItems] = useState<Discount[]>([]);
  const [f, setF] = useState({ code: '', kind: 'percentage', value: 10, expiresAt: '', usageLimit: '' });
  const load = () => adminFetch<Discount[]>('/admin/discounts').then(setItems);
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    await adminFetch('/admin/discounts', {
      method: 'POST',
      body: JSON.stringify({
        code: f.code.toUpperCase(),
        kind: f.kind,
        value: f.kind === 'percentage' ? Number(f.value) : Math.round(Number(f.value) * 100),
        expiresAt: f.expiresAt || undefined,
        usageLimit: f.usageLimit ? Number(f.usageLimit) : undefined,
      }),
    });
    setF({ code: '', kind: 'percentage', value: 10, expiresAt: '', usageLimit: '' });
    load();
  };
  const remove = async (id: string) => {
    await adminFetch('/admin/discounts/' + id, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <h1 className="h-serif" style={{ fontSize: 28, margin: '0 0 16px' }}>Discounts</h1>

      <form onSubmit={create} style={{ background: '#fff', padding: 16, border: '1px solid var(--rule)', marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, alignItems: 'end' }}>
        <div className="field"><label>Code</label><input required value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} /></div>
        <div className="field"><label>Kind</label>
          <select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>
            <option value="percentage">%</option>
            <option value="fixed">Fixed PKR</option>
          </select>
        </div>
        <div className="field"><label>Value</label><input type="number" value={f.value} onChange={(e) => setF({ ...f, value: +e.target.value })} /></div>
        <div className="field"><label>Expires</label><input type="date" value={f.expiresAt} onChange={(e) => setF({ ...f, expiresAt: e.target.value })} /></div>
        <div className="field"><label>Usage limit</label><input type="number" value={f.usageLimit} onChange={(e) => setF({ ...f, usageLimit: e.target.value })} /></div>
        <button type="submit" style={{ padding: 10, background: '#111', color: '#fff', border: 0 }}>Create</button>
      </form>

      <table>
        <thead><tr><th>Code</th><th>Kind</th><th>Value</th><th>Expires</th><th>Usage</th><th></th></tr></thead>
        <tbody>
          {items.map((d) => (
            <tr key={d._id}>
              <td><strong>{d.code}</strong></td>
              <td>{d.kind}</td>
              <td>{d.kind === 'percentage' ? `${d.value}%` : formatPKR(d.value)}</td>
              <td>{d.expiresAt ? new Date(d.expiresAt).toLocaleDateString() : '—'}</td>
              <td>{d.usageCount}{d.usageLimit ? ` / ${d.usageLimit}` : ''}</td>
              <td><button onClick={() => remove(d._id)} style={{ fontSize: 12 }}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
