import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Settings, SettingsDocument } from './settings.schema';

@Injectable()
export class SettingsService {
  constructor(@InjectModel(Settings.name) private model: Model<SettingsDocument>) {}

  async get() {
    let s = await this.model.findOne();
    if (!s) s = await this.model.create({});
    return s;
  }

  async update(data: Partial<Settings>) {
    const s = await this.get();
    Object.assign(s, data);
    await s.save();
    return s;
  }
}
