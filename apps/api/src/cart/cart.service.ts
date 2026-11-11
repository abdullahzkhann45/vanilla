import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cart, CartDocument } from './cart.schema';
import { ProductsService } from '../products/products.service';
import { DiscountsService } from '../discounts/discounts.service';
import { SettingsService } from '../settings/settings.service';
import { computeTotals } from './pricing';

export interface Totals {
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  total: number;
  currency: 'PKR';
  lines: Array<{
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
  }>;
}

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private model: Model<CartDocument>,
    private products: ProductsService,
    private discounts: DiscountsService,
    private settings: SettingsService,
  ) {}

  async create() {
    return this.model.create({ lines: [] });
  }

  async get(id: string) {
    const cart = await this.model.findById(id);
    if (!cart) throw new NotFoundException('Cart not found');
    return cart;
  }

  async update(id: string, data: Partial<Cart>) {
    const cart = await this.get(id);
    if (data.lines !== undefined) cart.lines = data.lines as any;
    if (data.discountCode !== undefined) cart.discountCode = data.discountCode;
    cart.updatedAt = new Date();
    await cart.save();
    return cart;
  }

  async applyDiscount(id: string, code: string) {
    const d = await this.discounts.findValid(code);
    if (!d) throw new BadRequestException('Invalid or expired discount code');
    return this.update(id, { discountCode: d.code });
  }

  /** The one place totals are computed. Prices NEVER come from the client. */
  async priceCart(id: string): Promise<Totals> {
    const cart = await this.get(id);
    const settings = await this.settings.get();

    const lines: Totals['lines'] = [];
    for (const l of cart.lines) {
      const found = await this.products.findVariant(l.productId, l.variantSku);
      if (!found) continue;
      const { product, variant } = found;
      const inStock = variant.isActive && variant.stock >= l.quantity;
      const unitPrice = variant.price;
      lines.push({
        productId: String((product as any)._id),
        productSlug: product.slug,
        productName: product.name,
        variantSku: variant.sku,
        size: variant.size,
        colour: variant.colour,
        unitPrice,
        quantity: l.quantity,
        lineTotal: unitPrice * l.quantity,
        imageUrl: product.images[0]?.url || '',
        inStock,
      });
    }

    const d = cart.discountCode ? await this.discounts.findValid(cart.discountCode) : null;
    const totals = computeTotals(
      lines.map((l) => ({ unitPrice: l.unitPrice, quantity: l.quantity })),
      { flatShippingRate: settings.flatShippingRate, freeShippingThreshold: settings.freeShippingThreshold },
      d ? { kind: d.kind as any, value: d.value } : null,
    );

    return { ...totals, currency: 'PKR', lines };
  }
}
