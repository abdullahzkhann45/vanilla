'use client';
import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin-client';
import { Settings } from '@vanilla/shared';

export default function AdminSettings() {
  const [s, setS] = useState<Settings | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => { adminFetch<Settings>('/admin/settings').then(setS); }, []);

  if (!s) return <div>Loading…</div>;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = await adminFetch<Settings>('/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify({
        flatShippingRate: Math.round(+s.flatShippingRate),
        freeShippingThreshold: Math.round(+s.freeShippingThreshold),
        codMaxAutoApprove: Math.round(+s.codMaxAutoApprove),
        storeEmail: s.storeEmail,
        maintenanceMode: s.maintenanceMode,
      }),
    });
    setS(updated);
    setMsg('Saved.');
    setTimeout(() => setMsg(''), 2000);
  };

  return (
    <div style={{ maxWidth: 520 }}>
      <h1 className="h-serif" style={{ fontSize: 28, margin: '0 0 16px' }}>Settings</h1>
      <form className="form" onSubmit={save} style={{ background: '#fff', padding: 20, border: '1px solid var(--rule)' }}>
        <div className="field"><label>Flat shipping rate (paisa)</label><input type="number" value={s.flatShippingRate} onChange={(e) => setS({ ...s, flatShippingRate: +e.target.value })} /></div>
        <div className="field"><label>Free shipping threshold (paisa)</label><input type="number" value={s.freeShippingThreshold} onChange={(e) => setS({ ...s, freeShippingThreshold: +e.target.value })} /></div>
        <div className="field"><label>COD auto-approve max (paisa)</label><input type="number" value={s.codMaxAutoApprove} onChange={(e) => setS({ ...s, codMaxAutoApprove: +e.target.value })} /></div>
        <div className="field"><label>Store email</label><input type="email" value={s.storeEmail} onChange={(e) => setS({ ...s, storeEmail: e.target.value })} /></div>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
          <input type="checkbox" checked={s.maintenanceMode} onChange={(e) => setS({ ...s, maintenanceMode: e.target.checked })} />
          Maintenance mode (hides storefront)
        </label>
        <button type="submit" style={{ padding: 12, background: '#111', color: '#fff', border: 0 }}>Save</button>
        {msg && <div style={{ color: '#2a8', fontSize: 13 }}>{msg}</div>}
      </form>
    </div>
  );
}
