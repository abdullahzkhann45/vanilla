'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function SiteFooter() {
  const path = usePathname();
  if (path?.startsWith('/admin')) return null;
  return (
    <footer className="site-footer">
      <div className="container cols">
        <div>
          <div className="brand" style={{ color: '#111', marginBottom: 10 }}>Vanilla</div>
          <div>Considered basics, made in Pakistan.</div>
        </div>
        <div>
          <strong>Shop</strong>
          <div><Link href="/shop">All</Link></div>
          <div><Link href="/shop?type=sweatshirt">Sweatshirts</Link></div>
          <div><Link href="/shop?type=sweatpants">Sweatpants</Link></div>
        </div>
        <div>
          <strong>Help</strong>
          <div><Link href="/size-guide">Size guide</Link></div>
          <div><Link href="/shipping-returns">Shipping & returns</Link></div>
          <div><Link href="/track">Track an order</Link></div>
        </div>
        <div>
          <strong>Brand</strong>
          <div><Link href="/about">About</Link></div>
          <div><Link href="/privacy">Privacy</Link></div>
          <div>© {new Date().getFullYear()} Vanilla</div>
        </div>
      </div>
    </footer>
  );
}
