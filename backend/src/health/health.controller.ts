import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { HealthService } from './health.service';
import { AdminGuard } from '../admin/admin.guard';

@Controller('health')
export class HealthController {
  private readonly startedAt = Date.now();

  constructor(
    private health: HealthService,
    @InjectConnection() private readonly conn: Connection,
  ) {}

  /** Public, lightweight liveness probe for an external uptime monitor. */
  @Get()
  liveness() {
    const dbConnected = this.conn.readyState === 1;
    return {
      status: dbConnected ? 'ok' : 'degraded',
      db: dbConnected ? 'connected' : 'disconnected',
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
      time: new Date().toISOString(),
    };
  }

  /** Admin-only: run the preventive sweep on demand and return the report. */
  @UseGuards(AdminGuard)
  @Post('run')
  run() {
    return this.health.runChecks('manual');
  }
}
