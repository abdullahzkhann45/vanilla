'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/lib/cart-store';

export function SiteHeader() {
  const path = usePathname();
  const { totals, openDrawer } = useCart();
  if (path?.startsWith('/admin')) return null;
  const count = totals.lines.reduce((n, l) => n + l.quantity, 0);
  return (
    <header className="site-header">
      <div className="container row">
        <Link className="brand" href="/">Vanilla</Link>
        <nav className="nav">
          <Link href="/shop">Shop</Link>
          <Link href="/about">About</Link>
          <Link href="/track">Track</Link>
        </nav>
        <button className="cart-btn" onClick={openDrawer}>
          Bag {count > 0 && <span className="count">{count}</span>}
        </button>
      </div>
    </header>
  );
}
