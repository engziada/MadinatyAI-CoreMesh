import { Test, TestingModule } from '@nestjs/testing';
import { SoukElKantoService, SoukListingStatus } from './soukelkanto.service';
import { PrismaService } from '@madinatyai/prisma';
import { EventsService } from '@madinatyai/events';
import { TokensService } from '@madinatyai/tokens';
import { SoukCategory, SoukCondition } from './dto/create-listing.dto';

const mockPrisma = () => ({
  soukListing: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  soukOffer: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
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
  $queryRawUnsafe: jest.fn(),
});

const mockEvents = () => ({ emit: jest.fn() });
const mockTokens = () => ({ spend: jest.fn(), credit: jest.fn() });

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
      ],
    }).compile();

    service = module.get(SoukElKantoService);
    prisma = module.get(PrismaService) as unknown as ReturnType<typeof mockPrisma>;
  });

  describe('createListing', () => {
    it('should create a listing with photos', async () => {
      const dto = {
        title: 'IKEA Crib',
        description: 'Like new',
        category: SoukCategory.KIDS_GEAR,
        condition: SoukCondition.LIKE_NEW,
        askingPrice: 1800,
        district: 'B5',
        photos: [{ r2Key: 'u-1/a.jpg', position: 0 }],
      };
      prisma.soukListing.create.mockResolvedValue({ id: 'l1', ...dto });

      const result = await service.createListing('u1', dto);
      expect(result.id).toBe('l1');
      expect(prisma.soukListing.create).toHaveBeenCalled();
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
      prisma.soukOffer.findUnique.mockResolvedValue({
        id: 'o1',
        sellerId: 's1',
        buyerId: 'b1',
        listingId: 'l1',
        status: 'PENDING',
        tokenHoldAmount: null,
      });
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
