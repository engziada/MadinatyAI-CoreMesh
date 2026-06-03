import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@madinatyai/prisma';
import { EventsService } from '@madinatyai/events';
import { TokensService } from '@madinatyai/tokens';
import { SoukCategory, SoukCondition } from './dto/create-listing.dto';

export enum SoukListingStatus {
  ACTIVE = 'ACTIVE',
  RESERVED = 'RESERVED',
  SOLD = 'SOLD',
  PENDING_REVIEW = 'PENDING_REVIEW',
  REMOVED = 'REMOVED',
  EXPIRED = 'EXPIRED',
}

export enum SoukOfferStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  COUNTERED = 'COUNTERED',
  WITHDRAWN = 'WITHDRAWN',
  EXPIRED = 'EXPIRED',
  HANDOVER_PENDING = 'HANDOVER_PENDING',
  CONFIRMED = 'CONFIRMED',
  CLOSED = 'CLOSED',
}

/**
 * Core Souk ElKanto business logic service.
 * Handles listings, offers, handover, ratings, and favorites in the
 * `tenant_soukelkanto` schema, with cross-schema reads to `core` for users,
 * trust scores, and token wallets.
 */
@Injectable()
export class SoukElKantoService {
  private readonly logger = new Logger(SoukElKantoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
    private readonly tokens: TokensService,
  ) {}

  // ─────────────── Listings ───────────────

  async createListing(
    sellerId: string,
    dto: {
      title: string;
      description: string;
      category: SoukCategory;
      condition: SoukCondition;
      askingPrice: number;
      district: string;
      photos?: Array<{ r2Key: string; position: number }>;
    },
  ) {
    const listing = await this.prisma.soukListing.create({
      data: {
        sellerId,
        title: dto.title,
        description: dto.description,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        category: dto.category as unknown as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        condition: dto.condition as unknown as any,
        askingPrice: dto.askingPrice,
        district: dto.district,
        status: 'ACTIVE',
        photos: dto.photos?.length
          ? {
              create: dto.photos.map((p) => ({
                r2Key: p.r2Key,
                url: '',
                width: 0,
                height: 0,
                bytes: 0,
                position: p.position,
              })),
            }
          : undefined,
      },
      include: { photos: true },
    });
    this.logger.log(`Listing created: ${listing.id} by ${sellerId}`);
    return listing;
  }

  async listListings(params: {
    category?: SoukCategory;
    condition?: SoukCondition;
    district?: string;
    minPrice?: number;
    maxPrice?: number;
    q?: string;
    sort?: 'newest' | 'price_asc' | 'price_desc' | 'popular';
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(50, Math.max(1, params.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { status: 'ACTIVE' };
    if (params.category) where.category = params.category;
    if (params.condition) where.condition = params.condition;
    if (params.district) where.district = params.district;
    if (params.minPrice !== undefined || params.maxPrice !== undefined) {
      where.askingPrice = {};
      if (params.minPrice !== undefined)
        (where.askingPrice as Record<string, unknown>).gte = params.minPrice;
      if (params.maxPrice !== undefined)
        (where.askingPrice as Record<string, unknown>).lte = params.maxPrice;
    }
    if (params.q) {
      where.OR = [
        { title: { contains: params.q, mode: 'insensitive' } },
        { description: { contains: params.q, mode: 'insensitive' } },
      ];
    }

    const orderBy =
      params.sort === 'price_asc'
        ? { askingPrice: 'asc' as const }
        : params.sort === 'price_desc'
          ? { askingPrice: 'desc' as const }
          : params.sort === 'popular'
            ? { viewCount: 'desc' as const }
            : { createdAt: 'desc' as const };

    const [items, total] = await Promise.all([
      this.prisma.soukListing.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: { photos: { orderBy: { position: 'asc' }, take: 1 } },
      }),
      this.prisma.soukListing.count({ where }),
    ]);

    return {
      data: items,
      pagination: { page, limit, total_items: total, total_pages: Math.ceil(total / limit) },
    };
  }

  async getListing(id: string) {
    const listing = await this.prisma.soukListing.findUnique({
      where: { id },
      include: { photos: { orderBy: { position: 'asc' } } },
    });
    if (!listing) throw new NotFoundException(`Listing ${id} not found`);
    // Increment view count
    await this.prisma.soukListing.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
    return listing;
  }

  async updateListing(
    id: string,
    sellerId: string,
    dto: Partial<{
      title: string;
      description: string;
      category: SoukCategory;
      condition: SoukCondition;
      askingPrice: number;
      district: string;
    }>,
  ) {
    const listing = await this.prisma.soukListing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException(`Listing ${id} not found`);
    if (listing.sellerId !== sellerId) throw new ForbiddenException('Not the owner');

    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.condition !== undefined) data.condition = dto.condition;
    if (dto.askingPrice !== undefined) data.askingPrice = dto.askingPrice;
    if (dto.district !== undefined) data.district = dto.district;

    return this.prisma.soukListing.update({ where: { id }, data, include: { photos: true } });
  }

  async deleteListing(id: string, sellerId: string) {
    const listing = await this.prisma.soukListing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException(`Listing ${id} not found`);
    if (listing.sellerId !== sellerId) throw new ForbiddenException('Not the owner');

    return this.prisma.soukListing.update({
      where: { id },
      data: { status: 'REMOVED', removedAt: new Date() },
    });
  }

  // ─────────────── Offers ───────────────

  async createOffer(
    buyerId: string,
    dto: { listingId: string; amount: number; note?: string; tokenHoldAmount?: number },
  ) {
    const listing = await this.prisma.soukListing.findUnique({ where: { id: dto.listingId } });
    if (!listing) throw new NotFoundException(`Listing ${dto.listingId} not found`);
    if (listing.status !== 'ACTIVE') throw new ForbiddenException('Listing is not active');
    if (listing.sellerId === buyerId) throw new ForbiddenException('Cannot offer on own listing');

    const offer = await this.prisma.soukOffer.create({
      data: {
        listingId: dto.listingId,
        buyerId,
        sellerId: listing.sellerId,
        amount: dto.amount,
        note: dto.note,
        tokenHoldAmount: dto.tokenHoldAmount,
        tokenHoldExpiresAt: dto.tokenHoldAmount ? new Date(Date.now() + 72 * 60 * 60 * 1000) : null,
        status: 'PENDING',
      },
    });

    this.logger.log(`Offer ${offer.id} created on listing ${dto.listingId}`);
    return offer;
  }

  async getOffer(id: string) {
    const offer = await this.prisma.soukOffer.findUnique({
      where: { id },
      include: { listing: true, handover: true, safeMeetSpot: true },
    });
    if (!offer) throw new NotFoundException(`Offer ${id} not found`);
    return offer;
  }

  async acceptOffer(offerId: string, sellerId: string) {
    const offer = await this.prisma.soukOffer.findUnique({ where: { id: offerId } });
    if (!offer) throw new NotFoundException(`Offer ${offerId} not found`);
    if (offer.sellerId !== sellerId) throw new ForbiddenException('Not the seller');
    if (offer.status !== 'PENDING' && offer.status !== 'COUNTERED') {
      throw new ForbiddenException('Offer cannot be accepted');
    }

    // Token hold: lock buyer tokens
    if (offer.tokenHoldAmount && offer.tokenHoldAmount > 0) {
      try {
        await this.tokens.spend(offer.buyerId, 'SOUK_OFFER_HOLD', 'individual', offerId);
      } catch {
        throw new ForbiddenException('TOKEN_HOLD_FAILED');
      }
    }

    const updated = await this.prisma.soukOffer.update({
      where: { id: offerId },
      data: { status: 'ACCEPTED', acceptedAt: new Date() },
    });

    await this.prisma.soukListing.update({
      where: { id: offer.listingId },
      data: { status: 'RESERVED' },
    });

    // Emit event
    try {
      await this.events.emit({
        sourceSubdomain: 'kanto',
        eventType: 'souk.offer.accepted',
        userId: offer.buyerId,
        payload: { offerId, listingId: offer.listingId, sellerId, buyerId: offer.buyerId },
      });
    } catch (err) {
      this.logger.warn(`Event emit failed: ${(err as Error).message}`);
    }

    return updated;
  }

  async declineOffer(offerId: string, sellerId: string, _reason?: string) {
    const offer = await this.prisma.soukOffer.findUnique({ where: { id: offerId } });
    if (!offer) throw new NotFoundException(`Offer ${offerId} not found`);
    if (offer.sellerId !== sellerId) throw new ForbiddenException('Not the seller');
    if (offer.status !== 'PENDING' && offer.status !== 'COUNTERED') {
      throw new ForbiddenException('Offer cannot be declined');
    }

    return this.prisma.soukOffer.update({
      where: { id: offerId },
      data: { status: 'DECLINED', declinedAt: new Date() },
    });
  }

  async counterOffer(offerId: string, sellerId: string, amount: number) {
    const parent = await this.prisma.soukOffer.findUnique({ where: { id: offerId } });
    if (!parent) throw new NotFoundException(`Offer ${offerId} not found`);
    if (parent.sellerId !== sellerId) throw new ForbiddenException('Not the seller');
    if (parent.status !== 'PENDING') throw new ForbiddenException('Offer cannot be countered');

    // Mark parent as countered
    await this.prisma.soukOffer.update({
      where: { id: offerId },
      data: { status: 'COUNTERED' },
    });

    // Create new counter offer
    return this.prisma.soukOffer.create({
      data: {
        listingId: parent.listingId,
        buyerId: parent.buyerId,
        sellerId: parent.sellerId,
        amount,
        status: 'PENDING',
        parentOfferId: offerId,
      },
    });
  }

  async withdrawOffer(offerId: string, buyerId: string) {
    const offer = await this.prisma.soukOffer.findUnique({ where: { id: offerId } });
    if (!offer) throw new NotFoundException(`Offer ${offerId} not found`);
    if (offer.buyerId !== buyerId) throw new ForbiddenException('Not the buyer');
    if (offer.status !== 'PENDING' && offer.status !== 'COUNTERED') {
      throw new ForbiddenException('Offer cannot be withdrawn');
    }

    return this.prisma.soukOffer.update({
      where: { id: offerId },
      data: { status: 'WITHDRAWN', withdrawnAt: new Date() },
    });
  }

  async listSentOffers(buyerId: string) {
    return this.prisma.soukOffer.findMany({
      where: { buyerId },
      orderBy: { createdAt: 'desc' },
      include: { listing: { include: { photos: { take: 1 } } } },
    });
  }

  async listReceivedOffers(sellerId: string) {
    return this.prisma.soukOffer.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
      include: { listing: { include: { photos: { take: 1 } } } },
    });
  }

  // ─────────────── Handover ───────────────

  async confirmHandover(offerId: string, userId: string) {
    const offer = await this.prisma.soukOffer.findUnique({
      where: { id: offerId },
      include: { handover: true },
    });
    if (!offer) throw new NotFoundException(`Offer ${offerId} not found`);
    if (offer.status !== 'ACCEPTED' && offer.status !== 'HANDOVER_PENDING') {
      throw new ForbiddenException('Offer not in handover state');
    }
    if (offer.buyerId !== userId && offer.sellerId !== userId) {
      throw new ForbiddenException('Not a party to this offer');
    }

    const isBuyer = offer.buyerId === userId;
    const existing = offer.handover;

    if (existing) {
      const updateData: Record<string, Date> = {};
      if (isBuyer && !existing.buyerConfirmedAt) updateData.buyerConfirmedAt = new Date();
      if (!isBuyer && !existing.sellerConfirmedAt) updateData.sellerConfirmedAt = new Date();

      const updated = await this.prisma.soukHandover.update({
        where: { offerId },
        data: updateData,
      });

      // If both confirmed, finalize
      if (updated.buyerConfirmedAt && updated.sellerConfirmedAt) {
        await this.finalizeHandover(offerId, offer);
      }
      return updated;
    }

    // Create handover record
    const handover = await this.prisma.soukHandover.create({
      data: {
        offerId,
        buyerConfirmedAt: isBuyer ? new Date() : undefined,
        sellerConfirmedAt: !isBuyer ? new Date() : undefined,
      },
    });

    // Update offer status
    await this.prisma.soukOffer.update({
      where: { id: offerId },
      data: { status: 'HANDOVER_PENDING' },
    });

    return handover;
  }

  private async finalizeHandover(
    offerId: string,
    offer: { listingId: string; buyerId: string; sellerId: string },
  ) {
    const bothConfirmedAt = new Date();
    await this.prisma.soukHandover.update({
      where: { offerId },
      data: {
        bothConfirmedAt,
        ratingWindowEndsAt: new Date(bothConfirmedAt.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    await this.prisma.soukOffer.update({
      where: { id: offerId },
      data: { status: 'CONFIRMED' },
    });

    await this.prisma.soukListing.update({
      where: { id: offer.listingId },
      data: { status: 'SOLD' },
    });

    // Release token hold
    try {
      await this.tokens.credit(
        offer.buyerId,
        0,
        'individual',
        'Handover complete — token hold released',
      );
    } catch {
      /* best effort */
    }

    // Emit event
    try {
      await this.events.emit({
        sourceSubdomain: 'kanto',
        eventType: 'souk.handover.confirmed',
        userId: offer.sellerId,
        payload: {
          offerId,
          listingId: offer.listingId,
          buyerId: offer.buyerId,
          sellerId: offer.sellerId,
          confirmedAt: bothConfirmedAt,
        },
      });
    } catch (err) {
      this.logger.warn(`Event emit failed: ${(err as Error).message}`);
    }
  }

  // ─────────────── Ratings ───────────────

  async createRating(raterId: string, dto: { offerId: string; score: number; comment?: string }) {
    const offer = await this.prisma.soukOffer.findUnique({
      where: { id: dto.offerId },
      include: { handover: true, ratings: true },
    });
    if (!offer) throw new NotFoundException(`Offer ${dto.offerId} not found`);
    if (offer.status !== 'CONFIRMED') throw new ForbiddenException('Handover not confirmed');
    if (!offer.handover || !offer.handover.bothConfirmedAt) {
      throw new ForbiddenException('Handover not complete');
    }
    if (offer.handover.ratingWindowEndsAt && new Date() > offer.handover.ratingWindowEndsAt) {
      throw new ForbiddenException('Rating window closed');
    }

    const targetId = offer.buyerId === raterId ? offer.sellerId : offer.buyerId;
    if (!targetId) throw new ForbiddenException('Cannot rate yourself');

    // Check if already rated
    const existing = offer.ratings.find((r) => r.raterId === raterId);
    if (existing) throw new ForbiddenException('Already rated this offer');

    // Map score to severity: 5->0, 4->0, 3->1, 2->3, 1->5
    const severityMap: Record<number, number> = { 5: 0, 4: 0, 3: 1, 2: 3, 1: 5 };
    const mappedSeverity = severityMap[dto.score] ?? 0;

    const rating = await this.prisma.soukRating.create({
      data: {
        offerId: dto.offerId,
        raterId,
        targetId,
        score: dto.score,
        comment: dto.comment,
        mappedSeverity,
      },
    });

    // Emit event
    try {
      await this.events.emit({
        sourceSubdomain: 'kanto',
        eventType: 'souk.rating.received',
        userId: targetId,
        payload: { offerId: dto.offerId, raterId, targetId, score: dto.score },
      });
    } catch (err) {
      this.logger.warn(`Event emit failed: ${(err as Error).message}`);
    }

    return rating;
  }

  // ─────────────── Favorites ───────────────

  async addFavorite(userId: string, listingId: string) {
    const listing = await this.prisma.soukListing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException(`Listing ${listingId} not found`);

    const fav = await this.prisma.soukFavorite.upsert({
      where: { userId_listingId: { userId, listingId } },
      create: { userId, listingId },
      update: {},
    });

    await this.prisma.soukListing.update({
      where: { id: listingId },
      data: { favoriteCount: { increment: 1 } },
    });

    return fav;
  }

  async removeFavorite(userId: string, listingId: string) {
    try {
      await this.prisma.soukFavorite.delete({
        where: { userId_listingId: { userId, listingId } },
      });
      await this.prisma.soukListing.update({
        where: { id: listingId },
        data: { favoriteCount: { decrement: 1 } },
      });
    } catch {
      /* ignore not-found */
    }
    return { removed: true };
  }

  async listFavorites(userId: string) {
    return this.prisma.soukFavorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { listing: { include: { photos: { take: 1 } } } },
    });
  }

  // ─────────────── Safe Meet Spots ───────────────

  async listSafeMeetSpots(district?: string) {
    const where: Record<string, unknown> = { isActive: true };
    if (district) where.district = district;
    return this.prisma.soukSafeMeetSpot.findMany({ where, orderBy: { name: 'asc' } });
  }

  async nearestSafeMeetSpots(lat: number, lng: number, take = 3) {
    // Haversine via raw query
    const spots = await this.prisma.$queryRawUnsafe<
      Array<{
        id: string;
        name: string;
        nameAr: string;
        district: string;
        latitude: number;
        longitude: number;
        description: string | null;
        distance: number;
      }>
    >(
      `SELECT id, name, "nameAr", district, latitude, longitude, description,
        (6371 * acos(
          cos(radians($1)) * cos(radians(latitude)) *
          cos(radians(longitude) - radians($2)) +
          sin(radians($1)) * sin(radians(latitude))
        )) AS distance
       FROM "tenant_soukelkanto"."safe_meet_spots"
       WHERE "isActive" = true
       ORDER BY distance
       LIMIT $3`,
      lat,
      lng,
      take,
    );
    return spots;
  }

  // ─────────────── Categories ───────────────

  getCategories() {
    const labels: Record<string, { en: string; ar: string }> = {
      FURNITURE: { en: 'Furniture', ar: 'أثاث' },
      ELECTRONICS: { en: 'Electronics', ar: 'إلكترونيات' },
      APPLIANCES: { en: 'Appliances', ar: 'أجهزة منزلية' },
      FASHION: { en: 'Fashion', ar: 'أزياء' },
      KIDS_TOYS: { en: "Kids' Toys", ar: 'ألعاب الأطفال' },
      KIDS_CLOTHING: { en: "Kids' Clothing", ar: 'ملابس الأطفال' },
      KIDS_GEAR: { en: "Kids' Gear", ar: 'معدات الأطفال' },
      BOOKS_MEDIA: { en: 'Books & Media', ar: 'كتب ووسائط' },
      SPORTS_OUTDOOR: { en: 'Sports & Outdoor', ar: 'رياضة وخارجية' },
      HOME_DECOR: { en: 'Home Decor', ar: 'ديكور منزلي' },
      KITCHEN_DINING: { en: 'Kitchen & Dining', ar: 'مطبخ وسفرة' },
      BABY_MATERNITY: { en: 'Baby & Maternity', ar: 'رضع وأمومة' },
      MOBILE_TABLETS: { en: 'Mobile & Tablets', ar: 'موبايل وتابلت' },
      VINTAGE_COLLECTIBLES: { en: 'Vintage & Collectibles', ar: 'تحف وانتيكات' },
      MOVING_BUNDLE: { en: 'Moving Bundle', ar: ' bunDLنقل' },
      OTHER: { en: 'Other', ar: 'أخرى' },
    };

    return Object.values(SoukCategory).map((value) => ({
      value,
      labelEn: labels[value]?.en ?? value,
      labelAr: labels[value]?.ar ?? value,
    }));
  }
}
