import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@madinatyai/prisma';
import { OtpService } from './otp.service';
import { OTP_DELIVERY_PROVIDER, type OtpDeliveryProvider } from './providers/otp-delivery.provider';

const makePrisma = () => ({
  otpChallenge: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
});

const makeConfig = (overrides: Record<string, unknown> = {}) => ({
  get: jest.fn((key: string) => {
    const base: Record<string, unknown> = {
      'auth.otpTtlSeconds': 300,
      'auth.otpMaxAttempts': 5,
      'auth.devBypass': false,
      'auth.devBypassCode': '000000',
    };
    return overrides[key] !== undefined ? overrides[key] : base[key];
  }),
});

const makeDelivery = (): OtpDeliveryProvider & { send: jest.Mock } => ({
  send: jest.fn().mockResolvedValue(undefined),
});

describe('OtpService', () => {
  let service: OtpService;
  let prisma: ReturnType<typeof makePrisma>;
  let config: ReturnType<typeof makeConfig>;
  let delivery: ReturnType<typeof makeDelivery>;

  beforeEach(async () => {
    prisma = makePrisma();
    config = makeConfig();
    delivery = makeDelivery();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
        { provide: OTP_DELIVERY_PROVIDER, useValue: delivery },
      ],
    }).compile();
    service = module.get(OtpService);
  });

  describe('issue', () => {
    it('invalidates pending challenges, creates a new one, dispatches the code', async () => {
      prisma.otpChallenge.updateMany.mockResolvedValue({ count: 1 });
      prisma.otpChallenge.create.mockResolvedValue({ id: 'c1' });

      await service.issue('+201001234567', 'LOGIN');

      expect(prisma.otpChallenge.updateMany).toHaveBeenCalledWith({
        where: expect.objectContaining({ phoneNumber: '+201001234567', consumedAt: null }),
        data: expect.objectContaining({ attempts: 99 }),
      });
      expect(prisma.otpChallenge.create).toHaveBeenCalledTimes(1);
      expect(delivery.send).toHaveBeenCalledTimes(1);
      const [, code] = delivery.send.mock.calls[0];
      expect(code).toMatch(/^\d{6}$/);
    });
  });

  describe('verify', () => {
    it('throws when no active challenge exists', async () => {
      prisma.otpChallenge.findFirst.mockResolvedValue(null);
      await expect(service.verify('+20', '123456')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws when the challenge is expired', async () => {
      prisma.otpChallenge.findFirst.mockResolvedValue({
        id: 'c1',
        codeHash: 'whatever',
        expiresAt: new Date(Date.now() - 1000),
        attempts: 0,
      });
      await expect(service.verify('+20', '123456')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws and increments attempts on wrong code', async () => {
      prisma.otpChallenge.findFirst.mockResolvedValue({
        id: 'c1',
        codeHash: 'definitely-not-matching',
        expiresAt: new Date(Date.now() + 60_000),
        attempts: 0,
      });
      await expect(service.verify('+20', '123456')).rejects.toBeInstanceOf(UnauthorizedException);
      expect(prisma.otpChallenge.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { attempts: 1 },
      });
    });

    it('burns the challenge after too many attempts', async () => {
      config.get.mockImplementation((key: string) =>
        key === 'auth.otpMaxAttempts' ? 3 : key === 'auth.devBypass' ? false : undefined,
      );
      prisma.otpChallenge.findFirst.mockResolvedValue({
        id: 'c1',
        codeHash: 'x',
        expiresAt: new Date(Date.now() + 60_000),
        attempts: 3,
      });
      await expect(service.verify('+20', '123456')).rejects.toBeInstanceOf(UnauthorizedException);
      expect(prisma.otpChallenge.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { consumedAt: expect.any(Date) },
      });
    });

    it('consumes the challenge and returns true on correct code', async () => {
      // The service hashes sha256(`${phone}:${code}`). Match that.
      const { createHash } = await import('node:crypto');
      const codeHash = createHash('sha256').update('+201001234567:482915').digest('hex');
      prisma.otpChallenge.findFirst.mockResolvedValue({
        id: 'c1',
        codeHash,
        expiresAt: new Date(Date.now() + 60_000),
        attempts: 0,
      });
      const ok = await service.verify('+201001234567', '482915');
      expect(ok).toBe(true);
      expect(prisma.otpChallenge.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { consumedAt: expect.any(Date) },
      });
    });

    it('honors the dev bypass code without touching the DB', async () => {
      config.get.mockImplementation((key: string) =>
        key === 'auth.devBypass' ? true : key === 'auth.devBypassCode' ? '000000' : undefined,
      );
      const ok = await service.verify('+20', '000000');
      expect(ok).toBe(true);
      expect(prisma.otpChallenge.findFirst).not.toHaveBeenCalled();
    });
  });
});
