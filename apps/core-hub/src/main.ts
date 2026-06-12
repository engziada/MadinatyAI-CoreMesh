import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import {
  AllExceptionsFilter,
  ResponseEnvelopeInterceptor,
  AccessLogInterceptor,
  AuditLogInterceptor,
  RateLimitGuard,
  IdempotencyInterceptor,
} from '@madinatyai/gateway';
import { LoggerService } from '@madinatyai/logging';
import { AppModule } from './app/app.module';
import { uploadMiddleware } from './upload.middleware';

/**
 * Bootstraps the MadinatyAI Ecosystem Hub API gateway.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: false,
    bodyParser: false, // We install body parser manually after the raw-upload middleware
  });
  const config = app.get(ConfigService);

  // R-11 F-11 — security headers on every response.
  //
  // Helmet is mounted BEFORE the upload middleware so PUT/GET on /uploads/*
  // also pick up `X-Content-Type-Options: nosniff` etc. CSP is tuned to allow
  // Swagger UI (inline scripts) and ReDoc (cdn.redoc.ly) when docs are
  // enabled; we disable strict CSP and rely on the upload middleware's own
  // nosniff + sanitised content-type for the GET path.
  const isProd = config.get<string>('nodeEnv') === 'production';
  app.use(
    helmet({
      // Disable CSP at the API layer — Swagger UI + ReDoc both require
      // `unsafe-inline` and CDN scripts. The FE (Vercel) sets its own CSP.
      contentSecurityPolicy: false,
      // HSTS only meaningful behind TLS. Cloudflare proxies TLS in prod;
      // in dev (`http://localhost:3000`) HSTS would force HTTPS unnecessarily.
      hsts: isProd
        ? { maxAge: 63072000, includeSubDomains: true, preload: true }
        : false,
      // Browsers shouldn't sniff response types — already enforced; this
      // is the explicit Helmet equivalent.
      noSniff: true,
      // Block embedding in iframes by default (clickjacking).
      frameguard: { action: 'sameorigin' },
      // Hide the `X-Powered-By: Express` banner.
      hidePoweredBy: true,
      // Disable cross-origin resource policy enforcement at the API layer —
      // the FE consumes our JSON cross-origin, and we already manage CORS
      // explicitly via `enableCors`.
      crossOriginResourcePolicy: false,
    }),
  );

  // Raw upload middleware must run BEFORE JSON body parsing so PUT binary
  // bodies for local-disk photo uploads are streamed to disk untouched.
  app.use(uploadMiddleware);

  // Re-enable JSON/urlencoded body parsing for all other routes
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // R-11 F-15 — cookie-parser so JwtAuthGuard can read the `madinaty.access`
  // HTTP-only cookie. Mounted AFTER body parsing so it doesn't interfere
  // with the raw-upload middleware.
  app.use(cookieParser());

  // Gateway: /api/v1 prefix on every route — exclude docs paths so they don't get envelope-wrapped
  app.setGlobalPrefix('api/v1', {
    exclude: ['docs', 'docs-json', 'docs-yaml', 'redoc', 'openapi.json'],
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );

  // Gateway: global filter + interceptors + guard (DI provides LoggerService, Reflector)
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalGuards(new RateLimitGuard(app.get(Reflector)));
  app.useGlobalInterceptors(
    new ResponseEnvelopeInterceptor(app.get(Reflector)),
    new AccessLogInterceptor(app.get(LoggerService)),
    new AuditLogInterceptor(app.get(Reflector), app.get(LoggerService)),
    new IdempotencyInterceptor(),
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

    // Serve raw JSON at /api/v1/openapi.json (Express middleware, before NestJS routing)
    const jsonSpec = JSON.stringify(document);
    app.use(
      '/api/v1/openapi.json',
      (
        _req: unknown,
        res: { setHeader: (k: string, v: string) => void; send: (body: string) => void },
      ) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(jsonSpec);
      },
    );

    // Swagger UI at /api/v1/docs — NestJS serves this
    SwaggerModule.setup('api/v1/docs', app, document, {
      swaggerOptions: { urls: [{ url: '/api/v1/openapi.json', name: 'Hub API' }] },
    });

    // ReDoc at /api/v1/redoc (Express middleware)
    app.use(
      '/api/v1/redoc',
      (
        _req: unknown,
        res: { setHeader: (k: string, v: string) => void; send: (html: string) => void },
      ) => {
        res.setHeader('Content-Type', 'text/html');
        res.send(`<!DOCTYPE html><html><head><title>Hub API Docs</title>
        <meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
        <style>body{margin:0;padding:0;}</style></head>
        <body><redoc spec-url='/api/v1/openapi.json'></redoc>
        <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
        </body></html>`);
      },
    );
  }

  const port = config.get<number>('port') ?? 3000;
  await app.listen(port);
  new Logger('Bootstrap').log(`MadinatyAI Hub listening on http://localhost:${port}/api/v1`);
}

bootstrap();
