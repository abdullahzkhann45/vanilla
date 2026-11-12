export type Size = 'S' | 'M' | 'L' | 'XL';
export type ProductType = 'sweatshirt' | 'sweatpants';
export type OrderStatus =
  | 'pending'
  | 'pending_confirmation'
  | 'confirmed'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned';
export type PaymentMethod = 'cod' | 'safepay';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'failed';

export interface Image {
  url: string;
  alt: string;
  order: number;
}

export interface Variant {
  _id?: string;
  sku: string;
  size: Size;
  colour: string;
  price: number; // paisa
  stock: number;
  isActive: boolean;
}

export interface Product {
  _id: string;
  slug: string;
  name: string;
  type: ProductType;
  description: string;
  fabric: string;
  care: string;
  basePrice: number; // paisa — the price customers pay
  compareAtPrice?: number; // paisa — original/"was" price, shown struck through
  currency: 'PKR';
  images: Image[];
  variants: Variant[];
  isPublished: boolean;
  createdAt: string;
}

export interface CartLine {
  productId: string;
  variantSku: string;
  quantity: number;
}

export interface Cart {
  _id: string;
  lines: CartLine[];
  discountCode?: string;
  updatedAt: string;
}

export interface OrderItem {
  // Snapshot — not a reference
  productId: string;
  productSlug: string;
  productName: string;
  variantSku: string;
  size: Size;
  colour: string;
  unitPrice: number; // paisa, snapshotted
  quantity: number;
  imageUrl: string;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  province: string;
  postalCode?: string;
  country: 'PK';
}

export interface Order {
  _id: string;
  orderNumber: string;
  email: string;
  items: OrderItem[];
  shipping: ShippingAddress;
  subtotal: number; // paisa
  discountAmount: number;
  shippingAmount: number;
  total: number;
  currency: 'PKR';
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  trackingNumber?: string;
  codPhoneVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Discount {
  _id: string;
  code: string;
  kind: 'percentage' | 'fixed';
  value: number; // percentage (0-100) or paisa for fixed
  expiresAt?: string;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
}

export interface Settings {
  _id: 'settings';
  flatShippingRate: number; // paisa
  freeShippingThreshold: number; // paisa
  storeEmail: string;
  maintenanceMode: boolean;
  codMaxAutoApprove: number; // over this, COD requires advance payment (paisa)
}

// Format PKR from paisa
export const formatPKR = (paisa: number): string => {
  const rupees = paisa / 100;
  return 'Rs. ' + rupees.toLocaleString('en-PK', { maximumFractionDigits: 0 });
};
