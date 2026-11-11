import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/lib/cart-store';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { CartDrawer } from '@/components/CartDrawer';

export const metadata: Metadata = {
  title: 'Vanilla — considered basics',
  description: 'Vanilla. Considered basics, made in Pakistan.',
  openGraph: {
    title: 'Vanilla',
    description: 'Considered basics, made in Pakistan.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <SiteHeader />
          <main>{children}</main>
          <CartDrawer />
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  );
}
