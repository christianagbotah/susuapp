import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('iSusuPro Ghana API')
    .setDescription(
      'NestJS backend for iSusuPro — a cross-platform microfinance & susu savings platform ' +
        'serving Web, Windows, macOS, Android and iOS clients.\n\n' +
        'Demo credentials: any seeded phone (e.g. 0241234567) + PIN 123456.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .setContact('iSusuPro Ghana', 'https://isusupro.gh', 'dev@isusupro.gh')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/v1/docs', app, document);

  const config = app.get(ConfigService);
  const port = config.get<number>('port') || 4000;
  await app.listen(port, '0.0.0.0');

  new Logger('Bootstrap').log(
    `iSusuPro API running at http://localhost:${port}/api/v1 — Swagger docs at http://localhost:${port}/api/v1/docs`,
  );
}

bootstrap();
