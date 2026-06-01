/**
 * Integration tests for the full gateway HTTP pipeline.
 * Each test gets a fresh NestJS app so rate-limit state doesn't leak.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Controller, Get, Post, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import {
  GatewayModule,
  AllExceptionsFilter,
  ResponseEnvelopeInterceptor,
  AccessLogInterceptor,
  AuditLogInterceptor,
  RateLimitGuard,
  IdempotencyInterceptor,
  AuditAction,
  NotFoundError,
  ErrorCode,
} from '../index';
import { LoggerService } from '@madinatyai/logging';

@Controller('test')
class TestController {
  @Get('ok')
  ok() {
    return { message: 'hello' };
  }

  @Get('not-found')
  notFound() {
    throw new NotFoundError('test-resource');
  }

  @Get('plain-http')
  plainHttp() {
    throw new HttpException('plain error', HttpStatus.BAD_REQUEST);
  }

  @Post('audit')
  @AuditAction({ action: 'test.do', target: 'test' })
  audit() {
    return { done: true };
  }
}

/** Create a fresh app per test to avoid rate-limit / idempotency state leaking. */
async function createApp(): Promise<{ app: INestApplication; loggerService: LoggerService }> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      GatewayModule.forRoot({
        logging: {
          service: 'test',
          env: 'test',
          level: 'silent',
          disableFile: true,
          disableConsole: true,
        },
      }),
    ],
    controllers: [TestController],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api/v1');

  const reflector = app.get(Reflector);
  const loggerService = app.get(LoggerService);

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalGuards(new RateLimitGuard(reflector));
  app.useGlobalInterceptors(
    new ResponseEnvelopeInterceptor(reflector),
    new AccessLogInterceptor(loggerService),
    new AuditLogInterceptor(reflector, loggerService),
    new IdempotencyInterceptor(),
  );

  await app.init();
  return { app, loggerService };
}

describe('Gateway Integration (full HTTP pipeline)', () => {
  // ─── Success envelope ───────────────────────────────────────────
  it('wraps successful responses in { success: true, data, meta }', async () => {
    const { app } = await createApp();
    const res = await request(app.getHttpServer()).get('/api/v1/test/ok');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      data: { message: 'hello' },
    });
    expect(res.body.meta).toHaveProperty('ts');
    await app.close();
  });

  // ─── GatewayException error envelope ────────────────────────────
  it('wraps GatewayException in { success: false, error: { code, message } }', async () => {
    const { app } = await createApp();
    const res = await request(app.getHttpServer()).get('/api/v1/test/not-found');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      success: false,
      error: { code: ErrorCode.NOT_FOUND },
    });
    expect(res.body.error.message).toBeDefined();
    expect(res.body.meta).toHaveProperty('ts');
    await app.close();
  });

  // ─── Plain HttpException error envelope ─────────────────────────
  it('wraps plain HttpException in standard error envelope', async () => {
    const { app } = await createApp();
    const res = await request(app.getHttpServer()).get('/api/v1/test/plain-http');
    expect(res.status).toBe(400);
    // AllExceptionsFilter maps 400 to VALIDATION_ERROR (closest match)
    expect(res.body).toMatchObject({
      success: false,
      error: { code: ErrorCode.VALIDATION_ERROR },
    });
    await app.close();
  });

  // ─── Rate limit headers ─────────────────────────────────────────
  it('returns X-RateLimit-Remaining header on success', async () => {
    const { app } = await createApp();
    const res = await request(app.getHttpServer()).get('/api/v1/test/ok');
    expect(res.status).toBe(200);
    expect(res.headers['x-ratelimit-remaining']).toBeDefined();
    await app.close();
  });

  // ─── Rate limit exhaustion ──────────────────────────────────────
  it('returns 429 when rate limit is exhausted', async () => {
    const { app } = await createApp();
    // ANONYMOUS tier = 30 req/min; exhaust it
    const requests = Array(35)
      .fill(null)
      .map(() => request(app.getHttpServer()).get('/api/v1/test/ok'));

    const responses = await Promise.all(requests);
    const tooMany = responses.filter((r: { status: number }) => r.status === 429);
    expect(tooMany.length).toBeGreaterThan(0);

    const first429 = tooMany[0];
    expect(first429.body).toMatchObject({
      success: false,
      error: { code: ErrorCode.RATE_LIMIT_EXCEEDED },
    });
    expect(first429.headers['retry-after']).toBeDefined();
    await app.close();
  });

  // ─── Idempotency-Key replay ───────────────────────────────────
  it('replays response when same Idempotency-Key is sent twice', async () => {
    const { app } = await createApp();
    const key = `test-idem-${Date.now()}`;

    // First request
    const first = await request(app.getHttpServer())
      .post('/api/v1/test/audit')
      .set('Idempotency-Key', key);
    expect(first.status).toBe(201);

    // Second request with same key
    const second = await request(app.getHttpServer())
      .post('/api/v1/test/audit')
      .set('Idempotency-Key', key);
    expect(second.status).toBe(first.status);
    expect(second.body.success).toBe(true);
    expect(second.body.data).toEqual(first.body.data);
    await app.close();
  });

  // ─── Audit log emission ────────────────────────────────────────
  it('emits audit log for @AuditAction-decorated routes', async () => {
    const { app, loggerService } = await createApp();
    const auditSpy = jest.spyOn(loggerService, 'audit').mockImplementation();

    await request(app.getHttpServer()).post('/api/v1/test/audit');

    expect(auditSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'test.do',
      }),
    );

    auditSpy.mockRestore();
    await app.close();
  });

  // ─── Access log emission ──────────────────────────────────────
  it('emits access log for every request', async () => {
    const { app, loggerService } = await createApp();
    const accessSpy = jest.spyOn(loggerService, 'access').mockImplementation();

    await request(app.getHttpServer()).get('/api/v1/test/ok');

    expect(accessSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        path: '/api/v1/test/ok',
      }),
    );

    accessSpy.mockRestore();
    await app.close();
  });
});
