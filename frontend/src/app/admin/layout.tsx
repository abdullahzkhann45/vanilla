'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { clearToken, getToken } from '@/lib/admin-client';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (path === '/admin/login') return;
    if (!getToken()) router.replace('/admin/login');
  }, [path, router]);

  if (path === '/admin/login') return <>{children}</>;

  const item = (href: string, label: string) => (
    <Link href={href} className={path.startsWith(href) ? 'active' : ''}>{label}</Link>
  );

  return (
    <div className="admin-layout">
      <nav className="admin-nav">
        <h2>Vanilla admin</h2>
        {item('/admin/dashboard', 'Dashboard')}
        {item('/admin/orders', 'Orders')}
        {item('/admin/products', 'Products')}
        {item('/admin/discounts', 'Discounts')}
        {item('/admin/settings', 'Settings')}
        <button
          onClick={() => { clearToken(); router.replace('/admin/login'); }}
          style={{ marginTop: 20, padding: '8px 10px', background: 'transparent', color: '#bbb', border: '1px solid #333', width: '100%' }}
        >Sign out</button>
      </nav>
      <main className="admin-main">{children}</main>
    </div>
  );
}
