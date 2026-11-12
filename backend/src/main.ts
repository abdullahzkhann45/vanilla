import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { env, validateEnvOrDie } from './env';

/** Best-effort crash alert straight to ntfy (no DI available here). */
function crashAlert(kind: string, err: unknown) {
  const topic = env.NTFY_ALERT_TOPIC;
  if (!topic) return;
  try {
    void fetch(`https://ntfy.sh/${topic}`, {
      method: 'POST',
      headers: { Title: `Vanilla API ${kind}`, Priority: 'max', Tags: 'rotating_light' },
      body: `The API hit a fatal ${kind} and is restarting:\n\n${String((err as any)?.stack || err).slice(0, 800)}`,
    }).catch(() => undefined);
  } catch {
    /* never let the alert itself throw */
  }
}

// A stray rejected promise should be logged, not silently swallowed — but it
// must NOT take the whole API down.
process.on('unhandledRejection', (reason) => {
  // eslint-disable-next-line no-console
  console.error('[vanilla-api] unhandledRejection:', reason);
});

// An uncaught exception leaves the process in an unknown state. Alert, then exit
// so the process manager (pm2/systemd/platform) restarts a clean instance.
process.on('uncaughtException', (err) => {
  // eslint-disable-next-line no-console
  console.error('[vanilla-api] uncaughtException:', err);
  crashAlert('crash', err);
  setTimeout(() => process.exit(1), 500);
});

async function bootstrap() {
  // Fail fast if any required env var is missing or weak.
  validateEnvOrDie();

  const app = await NestFactory.create(AppModule, { bufferLogs: false });

  // When behind a reverse proxy (nginx, Fly, Railway, Render, etc.) we need
  // req.ip to reflect the real client IP for rate-limiting and logging.
  app.getHttpAdapter().getInstance().set('trust proxy', env.TRUST_PROXY);

  app.use(
    helmet({
      // The API only serves JSON, never HTML, so CSP would reject nothing useful.
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.enableCors({
    origin: env.STOREFRONT_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: env.NODE_ENV === 'production',
    }),
  );

  // Any unexpected error becomes a clean 500 instead of a leak or a crash.
  app.useGlobalFilters(new AllExceptionsFilter());

  // Graceful shutdown: close DB connections and finish in-flight requests.
  app.enableShutdownHooks();

  await app.listen(env.PORT, '0.0.0.0');
  const log = new Logger('vanilla-api');
  log.log(`listening on :${env.PORT} (${env.NODE_ENV})`);
  log.log(`notifications: ${env.NTFY_TOPIC ? `enabled (topic ${env.NTFY_TOPIC})` : 'DISABLED — NTFY_TOPIC is empty'}`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[vanilla-api] failed to start:', err);
  crashAlert('startup failure', err);
  process.exit(1);
});
