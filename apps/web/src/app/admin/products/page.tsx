'use client';
import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin-client';
import { formatPKR, Product } from '@vanilla/shared';

export default function AdminProducts() {
  const [items, setItems] = useState<Product[]>([]);
  const load = () => adminFetch<Product[]>('/admin/products').then(setItems);
  useEffect(() => { load(); }, []);

  const togglePublish = async (p: Product) => {
    await adminFetch(`/admin/products/${p._id}`, { method: 'PATCH', body: JSON.stringify({ isPublished: !p.isPublished }) });
    load();
  };

  const updateStock = async (p: Product, sku: string, stock: number) => {
    const variants = p.variants.map((v) => (v.sku === sku ? { ...v, stock } : v));
    await adminFetch(`/admin/products/${p._id}`, { method: 'PATCH', body: JSON.stringify({ variants }) });
    load();
  };

  const updatePrice = async (p: Product, basePrice: number) => {
    // Apply to all variants (simple; the UI could be per-variant)
    const variants = p.variants.map((v) => ({ ...v, price: basePrice }));
    await adminFetch(`/admin/products/${p._id}`, { method: 'PATCH', body: JSON.stringify({ basePrice, variants }) });
    load();
  };

  return (
    <div>
      <h1 className="h-serif" style={{ fontSize: 28, margin: '0 0 16px' }}>Products</h1>
      {items.map((p) => (
        <div key={p._id} style={{ background: '#fff', padding: 20, marginBottom: 16, border: '1px solid var(--rule)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>{p.name}</strong> <span style={{ color: '#666', fontSize: 12 }}>/{p.slug}</span>
              <div style={{ color: '#666', fontSize: 13 }}>{p.type} · {p.variants.length} variants · {formatPKR(p.basePrice)}</div>
            </div>
            <div>
              <label style={{ fontSize: 12 }}>Price (PKR): </label>
              <input
                type="number"
                defaultValue={p.basePrice / 100}
                onBlur={(e) => {
                  const val = Math.round(parseFloat(e.target.value) * 100);
                  if (val !== p.basePrice) updatePrice(p, val);
                }}
                style={{ width: 100, padding: 4 }}
              />{' '}
              <button onClick={() => togglePublish(p)} style={{ padding: '6px 10px', fontSize: 12 }}>
                {p.isPublished ? 'Unpublish' : 'Publish'}
              </button>
            </div>
          </div>
          <table style={{ marginTop: 10 }}>
            <thead><tr><th>SKU</th><th>Size</th><th>Colour</th><th>Stock</th><th>Active</th></tr></thead>
            <tbody>
              {p.variants.map((v) => (
                <tr key={v.sku}>
                  <td style={{ fontSize: 12 }}>{v.sku}</td>
                  <td>{v.size}</td>
                  <td>{v.colour}</td>
                  <td>
                    <input
                      type="number" defaultValue={v.stock} style={{ width: 60, padding: 4 }}
                      onBlur={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        if (val !== v.stock) updateStock(p, v.sku, val);
                      }}
                    />
                  </td>
                  <td>{v.isActive ? '✓' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
