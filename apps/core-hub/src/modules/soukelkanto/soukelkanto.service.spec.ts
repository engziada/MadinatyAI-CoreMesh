import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SoukElKantoService, SoukListingStatus } from './soukelkanto.service';
import { PrismaService } from '@madinatyai/prisma';
import { EventsService } from '@madinatyai/events';
import { TokensService } from '@madinatyai/tokens';
import { ReportsService } from '../reports/reports.service';
import { R2StorageService } from './storage/r2-storage.service';
import { WahaNotificationService } from '../notifications/waha-notification.service';
import { SoukCategory, SoukCondition } from './dto/create-listing.dto';

const mockPrisma = () => {
  const prisma = {
    soukListing: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    soukOffer: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn().mockResolvedValue(null), // default: no dup PENDING (R-08)
      findMany: jest.fn().mockResolvedValue([]),    // default: no siblings to cascade (R-01)
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    soukHandover: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    soukRating: {
      create: jest.fn(),
    },
    soukFavorite: {
      upsert: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    soukSafeMeetSpot: {
      findMany: jest.fn(),
    },
    globalUser: {
      findUnique: jest.fn(),
    },
    $queryRawUnsafe: jest.fn(),
    // R-01 + R-08 wrap state changes in $transaction. The unit-test mock
    // resolves the callback with the same prisma instance so every tx.soukX.*
    // call lands on the mocked methods above.
    $transaction: jest.fn(),
  };
  // Self-reference: inject the same mock as the transaction client.
  (prisma.$transaction as jest.Mock).mockImplementation(
    (fn: (tx: typeof prisma) => unknown) => Promise.resolve(fn(prisma)),
  );
  return prisma;
};

const mockEvents = () => ({ emit: jest.fn() });
const mockTokens = () => ({ spend: jest.fn(), credit: jest.fn() });
const mockConfig = () => ({
  get: jest.fn((key: string) => (key === 'trustScore.banThreshold' ? 20 : undefined)),
});
const mockReports = () => ({ file: jest.fn() });
const mockStorage = () => ({
  isConfigured: jest.fn(() => true),
  presignUpload: jest.fn(),
  // R-11 F-12: createListing derives photo URL via this helper. Default:
  // null so callers fall back to the local-upload path.
  publicUrlForKey: jest.fn((key: string) => `https://r2-test.example/${key}`),
});
const mockWaha = () => ({
  // The service only calls sendOfferNotification (via the private notifyAsync
  // helper). Return a resolved promise so the fire-and-forget pattern stays
  // clean in tests.
  sendOfferNotification: jest.fn().mockResolvedValue(undefined),
});

describe('SoukElKantoService', () => {
  let service: SoukElKantoService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SoukElKantoService,
        { provide: PrismaService, useFactory: mockPrisma },
        { provide: EventsService, useFactory: mockEvents },
        { provide: TokensService, useFactory: mockTokens },
        { provide: ConfigService, useFactory: mockConfig },
        { provide: ReportsService, useFactory: mockReports },
        { provide: R2StorageService, useFactory: mockStorage },
        { provide: WahaNotificationService, useFactory: mockWaha },
      ],
    }).compile();

    service = module.get(SoukElKantoService);
    prisma = module.get(PrismaService) as unknown as ReturnType<typeof mockPrisma>;
  });

  describe('createListing', () => {
    // R-11 F-12: r2Key must start with `uploads/<sellerId>/` — the prefix is
    // enforced by the service before the DB write. Tests now use the correct
    // shape.
    const baseDto = {
      title: 'IKEA Crib',
      description: 'Like new',
      category: SoukCategory.KIDS_GEAR,
      condition: SoukCondition.LIKE_NEW,
      askingPrice: 1800,
      district: 'B5',
      photos: [{ r2Key: 'uploads/u1/2026-06-12/abc.jpg', position: 0 }],
    };

    it('should create a listing with photos when seller trust is above threshold', async () => {
      prisma.globalUser.findUnique.mockResolvedValue({ trustScore: 87 });
      prisma.soukListing.create.mockResolvedValue({ id: 'l1', ...baseDto });

      const result = await service.createListing('u1', baseDto);
      expect(result.id).toBe('l1');
      expect(prisma.soukListing.create).toHaveBeenCalled();
    });

    it('throws INSUFFICIENT_TRUST when seller score is at the ban threshold', async () => {
      prisma.globalUser.findUnique.mockResolvedValue({ trustScore: 20 });
      await expect(service.createListing('u1', baseDto)).rejects.toMatchObject({
        message: 'INSUFFICIENT_TRUST',
      });
      expect(prisma.soukListing.create).not.toHaveBeenCalled();
    });
  });

  describe('listListings', () => {
    it('should return paginated listings', async () => {
      prisma.soukListing.findMany.mockResolvedValue([{ id: 'l1' }]);
      prisma.soukListing.count.mockResolvedValue(1);

      const result = await service.listListings({});
      expect(result.data).toHaveLength(1);
      expect(result.pagination.total_items).toBe(1);
    });
  });

  describe('createOffer', () => {
    it('should create an offer on an active listing', async () => {
      prisma.soukListing.findUnique.mockResolvedValue({
        id: 'l1',
        sellerId: 's1',
        status: SoukListingStatus.ACTIVE,
      });
      prisma.soukOffer.create.mockResolvedValue({
        id: 'o1',
        listingId: 'l1',
        buyerId: 'b1',
        amount: 1600,
      });

      const result = await service.createOffer('b1', { listingId: 'l1', amount: 1600 });
      expect(result.id).toBe('o1');
    });
  });

  describe('acceptOffer', () => {
    it('should accept a pending offer', async () => {
      // R-01 added a listing.status === 'ACTIVE' precondition + a sibling
      // cascade in a $transaction. The mock has to surface listing.status
      // and findMany must return [] (no siblings) so the happy path completes.
      prisma.soukOffer.findUnique.mockResolvedValue({
        id: 'o1',
        sellerId: 's1',
        buyerId: 'b1',
        listingId: 'l1',
        status: 'PENDING',
        tokenHoldAmount: null,
        listing: { id: 'l1', title: 'Crib', status: 'ACTIVE' },
      });
      prisma.soukOffer.findMany.mockResolvedValue([]);
      prisma.soukOffer.update.mockResolvedValue({ id: 'o1', status: 'ACCEPTED' });
      prisma.soukListing.update.mockResolvedValue({ id: 'l1', status: 'RESERVED' });

      const result = await service.acceptOffer('o1', 's1');
      expect(result.status).toBe('ACCEPTED');
    });
  });

  describe('addFavorite', () => {
    it('should add a favorite and increment count', async () => {
      prisma.soukListing.findUnique.mockResolvedValue({ id: 'l1' });
      prisma.soukFavorite.upsert.mockResolvedValue({ id: 'f1' });
      prisma.soukListing.update.mockResolvedValue({ id: 'l1' });

      const result = await service.addFavorite('u1', 'l1');
      expect(result.id).toBe('f1');
    });
  });

  describe('getCategories', () => {
    it('should return all categories with labels', () => {
      const cats = service.getCategories();
      expect(cats.length).toBe(Object.keys(SoukCategory).length);
      expect(cats[0]).toHaveProperty('labelEn');
      expect(cats[0]).toHaveProperty('labelAr');
    });
  });
});
