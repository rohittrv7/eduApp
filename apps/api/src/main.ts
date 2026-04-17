import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

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
  app.enableCors({
    origin: process.env['FRONTEND_URL'] ?? 'http://localhost:3000',
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
