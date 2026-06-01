import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import {
  AllExceptionsFilter,
  ResponseEnvelopeInterceptor,
  AccessLogInterceptor,
} from '@madinatyai/gateway';
import { LoggerService } from '@madinatyai/logging';
import { AppModule } from './app/app.module';

/**
 * Bootstraps the MadinatyAI Ecosystem Hub API gateway.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const config = app.get(ConfigService);

  // Gateway: /api/v1 prefix on every route
  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );

  // Gateway: global filter + interceptors
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(
    new ResponseEnvelopeInterceptor(app.get('Reflector')),
    new AccessLogInterceptor(app.get(LoggerService)),
  );

  const origins = config.get<string[]>('corsOrigins') ?? ['http://localhost:3000'];
  app.enableCors({ origin: origins, credentials: true });

  // Swagger / OpenAPI
  const docsDisabled = config.get<string>('GATEWAY_DOCS_DISABLE') === 'true';
  if (!docsDisabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('MadinatyAI Ecosystem Hub')
      .setDescription('Unified API surface for internal platforms')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/v1/docs', app, document, {
      swaggerOptions: { urls: [{ url: 'api/v1/openapi.json', name: 'Hub API' }] },
    });
    // ReDoc
    app.use('api/v1/redoc', (_req: unknown, res: { send: (html: string) => void }) => {
      res.send(`<!DOCTYPE html><html><head><title>Hub API Docs</title>
        <meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
        <style>body{margin:0;padding:0;}</style></head>
        <body><redoc spec-url='/api/v1/openapi.json'></redoc>
        <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
        </body></html>`);
    });
  }

  const port = config.get<number>('port') ?? 3000;
  await app.listen(port);
  new Logger('Bootstrap').log(`MadinatyAI Hub listening on http://localhost:${port}/api/v1`);
}

bootstrap();
