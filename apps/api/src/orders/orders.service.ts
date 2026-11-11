import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { customAlphabet } from 'nanoid';
import { Order, OrderDocument } from './order.schema';
import { ProductsService } from '../products/products.service';
import { DiscountsService } from '../discounts/discounts.service';

const genOrderNumber = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) public model: Model<OrderDocument>,
    private products: ProductsService,
    private discounts: DiscountsService,
  ) {}

  create(data: Partial<Order>) {
    return this.model.create({ orderNumber: 'VNL-' + genOrderNumber(), ...data });
  }

  list(filter: any = {}) {
    return this.model.find(filter).sort({ createdAt: -1 }).lean();
  }

  async getByNumber(orderNumber: string) {
    const o = await this.model.findOne({ orderNumber });
    if (!o) throw new NotFoundException('Order not found');
    return o;
  }

  async getForGuest(orderNumber: string, email: string) {
    const o = await this.getByNumber(orderNumber);
    if (o.email.toLowerCase() !== email.toLowerCase()) {
      throw new ForbiddenException('Email does not match this order');
    }
    return o;
  }

  async setStatus(id: string, status: string) {
    return this.model.findByIdAndUpdate(id, { status }, { new: true });
  }

  async setTracking(id: string, trackingNumber: string) {
    return this.model.findByIdAndUpdate(id, { trackingNumber, status: 'shipped' }, { new: true });
  }

  /**
   * Transition order to `confirmed`:
   * - atomically decrement each variant's stock
   * - if any decrement fails, revert the ones already done and throw
   * - consume discount code usage
   */
  async confirmAndDecrementStock(order: OrderDocument) {
    const decremented: Array<{ productId: string; sku: string; qty: number }> = [];
    try {
      for (const item of order.items) {
        const ok = await this.products.tryDecrementStock(item.productId, item.variantSku, item.quantity);
        if (!ok) throw new Error(`Out of stock: ${item.variantSku}`);
        decremented.push({ productId: item.productId, sku: item.variantSku, qty: item.quantity });
      }
      if (order.discountCode) await this.discounts.consume(order.discountCode);
      order.status = 'confirmed';
      await order.save();
      return order;
    } catch (e) {
      for (const d of decremented) {
        await this.products.tryDecrementStock(d.productId, d.sku, -d.qty);
      }
      throw e;
    }
  }
}
