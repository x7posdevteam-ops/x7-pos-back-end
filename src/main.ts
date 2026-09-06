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
import * as fs from 'fs';

dotenv.config();

const logger = new Logger('Bootstrap');

// Manejo seguro de excepciones fatales para evitar spammear el logger de Railway
process.on('uncaughtException', (err: Error) => {
  console.error('=== UNCAUGHT EXCEPTION FATAL ===', err.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  const err = reason as Error;
  console.error('=== UNHANDLED REJECTION FATAL ===', err?.message || reason);
});

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';

  // Configuración del logger optimizada para evitar superar el límite de 500 logs/sec de Railway
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: isProduction
      ? ['error', 'warn', 'log']
      : ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  // Habilitar la resolución de dependencias para class-validator
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.setGlobalPrefix('api');

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('X7-POS APIs')
    .setDescription('Authentication and user management documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  SwaggerModule.setup('api', app, SwaggerModule.createDocument(app, config));

  // ValidationPipe global
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

  // Filtro de excepciones global
  app.useGlobalFilters(new ValidationExceptionFilter());

  app.enableCors();

  // Adaptador de WebSockets con Redis
  const wsRedisEnabled =
    (process.env.WS_REDIS_ENABLED ?? '').toLowerCase() === 'true';
  const redisUrl = process.env.REDIS_URL;
  if (wsRedisEnabled && redisUrl) {
    try {
      const redisAdapter = new RedisIoAdapter(app, redisUrl);
      await redisAdapter.connectToRedis();
      app.useWebSocketAdapter(redisAdapter);
      logger.log('Redis WebSocket Adapter initialized successfully.');
    } catch (redisError) {
      logger.error('Error connecting Redis WebSocket Adapter:', redisError);
    }
  }

  // Garantizar que la carpeta de uploads existe antes de servir estáticos
  const uploadsPath = join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }

  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
  });

  // Capturar el puerto asignado por Railway
  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`Application running on port: ${port}`);
}

bootstrap().catch((err: Error) => {
  logger.error('Error starting application', err.stack || err.message);
  process.exit(1);
});
