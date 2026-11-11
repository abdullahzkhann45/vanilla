import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { AdminUser, AdminUserDocument } from './admin.schema';

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectModel(AdminUser.name) private model: Model<AdminUserDocument>,
    private jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.model.findOne({ email: email.toLowerCase() });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    const payload = { sub: String(user._id), email: user.email, role: user.role };
    const token = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_SECRET || 'dev-secret',
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });
    const refresh = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_SECRET || 'dev-secret',
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });
    return { token, refresh, email: user.email };
  }
}
