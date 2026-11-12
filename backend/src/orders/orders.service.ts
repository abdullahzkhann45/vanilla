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

  getById(id: string) {
    return this.model.findById(id);
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
   * Admin dashboard metrics — one aggregation, computed in Mongo (never loads
   * the collection into memory). Revenue excludes cancelled/returned orders.
   * All money is in paisa; the client formats to rupees.
   */
  async dashboard() {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start7 = new Date(now.getTime() - 7 * 86_400_000);
    const start30 = new Date(now.getTime() - 30 * 86_400_000);

    // Count the order; count its total as revenue only if not voided.
    const revenueOf = { $cond: [{ $in: ['$status', ['cancelled', 'returned']] }, 0, '$total'] };
    const windowFacet = (since: Date) => [
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: null, orders: { $sum: 1 }, revenue: { $sum: revenueOf } } },
    ];

    const [res] = await this.model.aggregate([
      {
        $facet: {
          today: windowFacet(startToday),
          last7: windowFacet(start7),
          last30: windowFacet(start30),
          unitsPerVariant: [
            { $match: { status: { $nin: ['cancelled', 'returned'] } } },
            { $unwind: '$items' },
            {
              $group: {
                _id: '$items.variantSku',
                productName: { $first: '$items.productName' },
                size: { $first: '$items.size' },
                colour: { $first: '$items.colour' },
                units: { $sum: '$items.quantity' },
                revenue: { $sum: { $multiply: ['$items.unitPrice', '$items.quantity'] } },
              },
            },
            { $sort: { units: -1 } },
            { $limit: 100 },
          ],
          paymentSplit: [
            {
              $group: {
                _id: { $cond: [{ $eq: ['$paymentMethod', 'cod'] }, 'cod', 'prepaid'] },
                orders: { $sum: 1 },
                revenue: { $sum: revenueOf },
              },
            },
          ],
          recent: [
            { $sort: { createdAt: -1 } },
            { $limit: 20 },
            {
              $project: {
                orderNumber: 1, email: 1, status: 1,
                paymentMethod: 1, paymentStatus: 1, total: 1, createdAt: 1,
              },
            },
          ],
        },
      },
    ]);

    const win = (arr: any[]) => (arr[0] ? { orders: arr[0].orders, revenue: arr[0].revenue } : { orders: 0, revenue: 0 });
    const split = { cod: { orders: 0, revenue: 0 }, prepaid: { orders: 0, revenue: 0 } };
    for (const p of res.paymentSplit as any[]) {
      split[p._id as 'cod' | 'prepaid'] = { orders: p.orders, revenue: p.revenue };
    }

    return {
      today: win(res.today),
      last7: win(res.last7),
      last30: win(res.last30),
      unitsPerVariant: (res.unitsPerVariant as any[]).map((u) => ({
        variantSku: u._id,
        productName: u.productName,
        size: u.size,
        colour: u.colour,
        units: u.units,
        revenue: u.revenue,
      })),
      paymentSplit: split,
      recent: (res.recent as any[]).map((o) => ({
        orderNumber: o.orderNumber,
        email: o.email,
        status: o.status,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        total: o.total,
        createdAt: o.createdAt,
      })),
    };
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
