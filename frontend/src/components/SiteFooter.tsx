'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function SiteFooter() {
  const path = usePathname() || '';
  if (path.startsWith('/admin')) return null;
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="news">
          <div>
            <div className="label">Restocks and nothing else</div>
            <form onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="your@email.com" aria-label="Email" />
              <button type="submit">Join</button>
            </form>
          </div>
          <div />
        </div>

        <div className="cols">
          <div>
            <div className="label">Shop</div>
            <Link href="/shop">Everything</Link>
            <Link href="/shop?type=sweatshirt">Crewnecks</Link>
            <Link href="/shop?type=sweatpants">Sweatpants</Link>
          </div>
          <div>
            <div className="label">Help</div>
            <Link href="/size-guide">Sizing and fit</Link>
            <Link href="/shipping-returns">Shipping</Link>
            <Link href="/shipping-returns">Returns within 14 days</Link>
            <Link href="/about">Care and washing</Link>
          </div>
          <div>
            <div className="label">Vanilla</div>
            <Link href="/about">The cloth</Link>
            <Link href="/about">The workshop</Link>
            <Link href="/privacy">Privacy</Link>
            <a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a>
          </div>
        </div>

        <div className="legal">
          <span>Vanilla — Lahore, Pakistan</span>
          <span>Prices in PKR, inclusive of tax</span>
        </div>
      </div>
    </footer>
  );
}
