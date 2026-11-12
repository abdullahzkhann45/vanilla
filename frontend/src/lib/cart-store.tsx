'use client';
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

// localStorage mirror of the server cart. The server is truth; this holds the id and a cached snapshot for fast UI.

export type CartLine = {
  productId: string;
  productSlug: string;
  productName: string;
  variantSku: string;
  size: string;
  colour: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  imageUrl: string;
  inStock: boolean;
};

export type CartTotals = {
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  total: number;
  currency: 'PKR';
  lines: CartLine[];
};

const EMPTY: CartTotals = { subtotal: 0, discountAmount: 0, shippingAmount: 0, total: 0, currency: 'PKR', lines: [] };

type Ctx = {
  cartId: string | null;
  totals: CartTotals;
  drawerOpen: boolean;
  openDrawer(): void;
  closeDrawer(): void;
  add(productId: string, variantSku: string, qty: number): Promise<void>;
  setQty(variantSku: string, qty: number): Promise<void>;
  remove(variantSku: string): Promise<void>;
  applyDiscount(code: string): Promise<{ ok: boolean; error?: string }>;
  refresh(): Promise<void>;
};

const CartCtx = createContext<Ctx | null>(null);

async function post<T>(path: string, body?: any): Promise<T> {
  const r = await fetch('/api' + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error('API ' + r.status);
  return r.json();
}
async function patch<T>(path: string, body: any): Promise<T> {
  const r = await fetch('/api' + path, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error('API ' + r.status);
  return r.json();
}
async function get<T>(path: string): Promise<T> {
  const r = await fetch('/api' + path, { cache: 'no-store' });
  if (!r.ok) throw new Error('API ' + r.status);
  return r.json();
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartId, setCartId] = useState<string | null>(null);
  const [totals, setTotals] = useState<CartTotals>(EMPTY);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Boot: load cartId from localStorage or create a new one.
  useEffect(() => {
    (async () => {
      let id = localStorage.getItem('vnl_cart_id');
      if (!id) {
        const c = await post<{ id: string }>('/cart');
        id = c.id;
        localStorage.setItem('vnl_cart_id', id);
      }
      setCartId(id);
      try {
        const t = await get<CartTotals>(`/cart/${id}`);
        setTotals(t);
      } catch {
        // cart expired — reset
        const c = await post<{ id: string }>('/cart');
        localStorage.setItem('vnl_cart_id', c.id);
        setCartId(c.id);
      }
    })();
  }, []);

  const refresh = useCallback(async () => {
    if (!cartId) return;
    const t = await get<CartTotals>(`/cart/${cartId}`);
    setTotals(t);
  }, [cartId]);

  const add = useCallback(async (productId: string, variantSku: string, qty: number) => {
    if (!cartId) return;
    const existing = totals.lines.find((l) => l.variantSku === variantSku);
    const nextLines = existing
      ? totals.lines.map((l) => (l.variantSku === variantSku ? { ...l, quantity: l.quantity + qty } : l))
      : [...totals.lines, { productId, variantSku, quantity: qty } as any];
    const t = await patch<CartTotals>(`/cart/${cartId}`, {
      lines: nextLines.map((l) => ({ productId: l.productId, variantSku: l.variantSku, quantity: l.quantity })),
    });
    setTotals(t);
    setDrawerOpen(true);
  }, [cartId, totals]);

  const setQty = useCallback(async (variantSku: string, qty: number) => {
    if (!cartId) return;
    const nextLines = totals.lines
      .map((l) => (l.variantSku === variantSku ? { ...l, quantity: qty } : l))
      .filter((l) => l.quantity > 0);
    const t = await patch<CartTotals>(`/cart/${cartId}`, {
      lines: nextLines.map((l) => ({ productId: l.productId, variantSku: l.variantSku, quantity: l.quantity })),
    });
    setTotals(t);
  }, [cartId, totals]);

  const remove = useCallback((sku: string) => setQty(sku, 0), [setQty]);

  const applyDiscount = useCallback(async (code: string) => {
    if (!cartId) return { ok: false, error: 'No cart' };
    try {
      const t = await post<CartTotals>(`/cart/${cartId}/discount`, { code });
      setTotals(t);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: 'Invalid code' };
    }
  }, [cartId]);

  const value = useMemo<Ctx>(() => ({
    cartId, totals, drawerOpen,
    openDrawer: () => setDrawerOpen(true),
    closeDrawer: () => setDrawerOpen(false),
    add, setQty, remove, applyDiscount, refresh,
  }), [cartId, totals, drawerOpen, add, setQty, remove, applyDiscount, refresh]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error('useCart must be inside CartProvider');
  return c;
}
