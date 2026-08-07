import 'reflect-metadata';
import * as dns from 'dns';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

// Prefer IPv4 over IPv6 for DNS resolution to avoid ENETUNREACH errors on hosts without IPv6 routing (e.g. Render)
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Increase body size limit to 50MB for PDF/file uploads
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Cookie parser middleware
  app.use(cookieParser());

  // CORS with credentials
  const allowedOrigins = (process.env['FRONTEND_URL'] ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, '')); // strip trailing slash

  const isProd = process.env['NODE_ENV'] === 'production';

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (native mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      // Explicitly allowed origins check first
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Allow localhost / 127.0.0.1 origins only in non-production environments
      if (!isProd && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      // Block all other origins — never allow unauthorized origins with credentials
      callback(new Error(`CORS: origin '${origin}' not allowed`), false);
    },
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Simple health check for Render
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/api/v1/health', (_req: unknown, res: { json: (o: object) => void }) => {
    res.json({ status: 'ok' });
  });

  await app.listen(process.env['PORT'] ?? 3001);
}

bootstrap();
