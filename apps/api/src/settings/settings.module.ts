import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Settings, SettingsSchema } from './settings.schema';
import { SettingsService } from './settings.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Settings.name, schema: SettingsSchema }])],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
