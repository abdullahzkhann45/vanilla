import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/lib/cart-store';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { CartDrawer } from '@/components/CartDrawer';
import { Grain } from '@/components/Grain';
import { IntroLoader } from '@/components/IntroLoader';
import { Cursor } from '@/components/Cursor';
import { GoogleAnalytics } from '@next/third-parties/google';

export const metadata: Metadata = {
  title: 'Vanilla — Lahore',
  description:
    'Four pieces. One cloth. A sweats brand from Lahore — 420 and 380 gsm long-staple cotton, cut, sewn and washed in Pakistan.',
  openGraph: {
    title: 'Vanilla — Lahore',
    description: 'Four pieces. One cloth. Made in Lahore.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <IntroLoader />
          <Cursor />
          <Grain />
          <SiteHeader />
          <main>{children}</main>
          <CartDrawer />
          <SiteFooter />
        </CartProvider>
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  );
}
