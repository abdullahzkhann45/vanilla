import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Webhook body needs the raw buffer for signature verification
  app.use('/webhooks', (req: any, _res: any, next: any) => {
    if (req.rawBody) req.body = req.rawBody;
    next();
  });

  app.use(helmet());
  app.enableCors({
    origin: process.env.STOREFRONT_ORIGIN?.split(',') || 'http://localhost:3000',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT) || 4000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`[vanilla-api] listening on :${port}`);
}
bootstrap();
