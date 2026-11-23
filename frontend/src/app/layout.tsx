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

// Resolve the public site URL, ignoring unset or placeholder values that may
// have been pasted into the env (e.g. "https://your-vercel-url"). A valid,
// absolute URL is required for Open Graph images to load in link previews.
const SITE_URL = (() => {
  const v = process.env.NEXT_PUBLIC_SITE_URL;
  if (v && /^https?:\/\//i.test(v) && !/your-|example\.|YOUR-|localhost/i.test(v)) return v;
  return 'https://vanillaretail.com';
})();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
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
