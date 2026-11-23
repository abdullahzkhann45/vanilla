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
import { MetaPixel } from '@/components/MetaPixel';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://vanilla-gules.vercel.app'),
  title: 'Vanilla — Lahore',
  description:
    'Four pieces. One cloth. A sweats brand from Lahore — long-staple cotton, cut, sewn and washed in Pakistan.',
  openGraph: {
    title: 'Vanilla — Lahore',
    description: 'Four pieces. One cloth. Made in Lahore.',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Vanilla' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vanilla — Lahore',
    description: 'Four pieces. One cloth. Made in Lahore.',
    images: ['/og.png'],
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
        <MetaPixel />
      </body>
    </html>
  );
}
