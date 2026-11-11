import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Discount, DiscountDocument } from './discount.schema';

@Injectable()
export class DiscountsService {
  constructor(@InjectModel(Discount.name) private model: Model<DiscountDocument>) {}

  async findValid(code: string) {
    const d = await this.model.findOne({ code: code.toUpperCase(), isActive: true });
    if (!d) return null;
    if (d.expiresAt && d.expiresAt.getTime() < Date.now()) return null;
    if (d.usageLimit !== undefined && d.usageCount >= d.usageLimit) return null;
    return d;
  }

  async consume(code: string) {
    return this.model.updateOne({ code: code.toUpperCase() }, { $inc: { usageCount: 1 } });
  }

  list() { return this.model.find().sort({ createdAt: -1 }).lean(); }
  create(data: Partial<Discount>) { return this.model.create(data); }
  update(id: string, data: Partial<Discount>) { return this.model.findByIdAndUpdate(id, data, { new: true }); }
  remove(id: string) { return this.model.findByIdAndDelete(id); }
}
