'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/lib/cart-store';

export function SiteHeader() {
  const path = usePathname() || '';
  const { totals, openDrawer } = useCart();
  if (path.startsWith('/admin')) return null;
  const count = totals.lines.reduce((n, l) => n + l.quantity, 0);
  const active = (href: string) =>
    (href === '/' ? path === '/' : path.startsWith(href)) ? 'active' : '';
  return (
    <>
      <div className="announce">
        <div className="container row">
          <span>Cut, sewn and washed in Lahore</span>
          <span>Dispatched in 48 hours · Free shipping over PKR 5,000</span>
        </div>
      </div>
      <header className="site-header">
        <div className="container row">
          <div className="left">
            <Link className="brand" href="/">Vanilla</Link>
            <nav className="nav">
              <Link href="/shop" className={active('/shop')}>Shop</Link>
              <Link href="/about" className={active('/about')}>Fabric</Link>
            </nav>
          </div>
          <div />
          <div className="right">
            <button className="cart-btn" onClick={openDrawer}>
              Bag ({count})
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
