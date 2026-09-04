// src/main.ts
import './polyfill';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, BadRequestException, Logger } from '@nestjs/common';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as dotenv from 'dotenv';
import { useContainer } from 'class-validator';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';
import { RedisIoAdapter } from './realtime/adapters/redis-io.adapter';

dotenv.config();

const logger = new Logger('Bootstrap');

// Capturadores globales de errores fatales
process.on('uncaughtException', (err: Error) => {
  logger.error('=== UNCAUGHT EXCEPTION FATAL ===', err.stack || err.message);
});

process.on('unhandledRejection', (reason: unknown) => {
  const err = reason as Error;
  logger.error('=== UNHANDLED REJECTION FATAL ===', err?.stack || reason);
});

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  // Habilitar la resolución de dependencias para class-validator
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('X7-POS APIs')
    .setDescription('Authentication and user management documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  SwaggerModule.setup('api', app, SwaggerModule.createDocument(app, config));

  // Global validation pipe with better error messages
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => {
          const constraints = error.constraints;
          if (constraints) {
            return Object.values(constraints).join(', ');
          }
          return `${error.property} has invalid value`;
        });
        return new BadRequestException({
          message: messages.length > 1 ? messages : messages[0],
          errors: messages,
        });
      },
    }),
  );

  // Global exception filter for validation errors
  app.useGlobalFilters(new ValidationExceptionFilter());

  app.enableCors();

  const wsRedisEnabled =
    (process.env.WS_REDIS_ENABLED ?? '').toLowerCase() === 'true';
  const redisUrl = process.env.REDIS_URL;
  if (wsRedisEnabled && redisUrl) {
    try {
      const redisAdapter = new RedisIoAdapter(app, redisUrl);
      await redisAdapter.connectToRedis();
      app.useWebSocketAdapter(redisAdapter);
    } catch (redisError) {
      logger.error('Error connecting Redis WebSocket Adapter:', redisError);
    }
  }

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`Application is running on: http://localhost:${port}/api`);
}

bootstrap().catch((err: Error) => {
  logger.error('Error starting application', err.stack || err.message);
});
