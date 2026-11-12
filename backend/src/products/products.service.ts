import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './product.schema';

@Injectable()
export class ProductsService {
  constructor(@InjectModel(Product.name) private model: Model<ProductDocument>) {}

  listPublished(type?: string) {
    const q: any = { isPublished: true };
    if (type) q.type = type;
    return this.model.find(q).sort({ createdAt: -1 }).lean();
  }

  async getBySlug(slug: string) {
    const p = await this.model.findOne({ slug, isPublished: true }).lean();
    if (!p) throw new NotFoundException('Product not found');
    return p;
  }

  // Admin helpers
  listAll() {
    return this.model.find().sort({ createdAt: -1 }).lean();
  }
  create(data: Partial<Product>) {
    return this.model.create(data);
  }
  update(id: string, data: Partial<Product>) {
    return this.model.findByIdAndUpdate(id, data, { new: true });
  }
  remove(id: string) {
    return this.model.findByIdAndDelete(id);
  }

  async findVariant(productId: string, sku: string) {
    const product = await this.model.findById(productId).lean();
    if (!product) return null;
    const variant = product.variants.find((v) => v.sku === sku);
    if (!variant) return null;
    return { product, variant };
  }

  /** Atomic: decrement stock by qty if it stays >= 0. Returns true iff successful. */
  async tryDecrementStock(productId: string, sku: string, qty: number): Promise<boolean> {
    const res = await this.model.updateOne(
      { _id: productId, variants: { $elemMatch: { sku, stock: { $gte: qty }, isActive: true } } },
      { $inc: { 'variants.$.stock': -qty } },
    );
    return res.modifiedCount === 1;
  }
}
