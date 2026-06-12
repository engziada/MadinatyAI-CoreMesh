import {
  BadRequestException,
  ForbiddenException,
  GoneException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ErrorCode, GatewayException } from '@madinatyai/gateway';
import { ConfigService } from '@nestjs/config';
import { IncidentType } from '@prisma/client';
import { PrismaService } from '@madinatyai/prisma';
import { EventsService } from '@madinatyai/events';
import { TokensService } from '@madinatyai/tokens';
import { ReportsService } from '../reports/reports.service';
import { WahaNotificationService } from '../notifications/waha-notification.service';
import { R2StorageService } from './storage/r2-storage.service';
import { SoukCategory, SoukCondition } from './dto/create-listing.dto';
import type { PhotoUploadUrlResponse } from './dto/photo-upload.dto';

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
 * Cap on the offer-counter chain depth, in *additional offers* past the
 * original. 2 = original + 2 counters = 3 rounds total ("offer → counter →
 * re-counter, after that take-it-or-leave-it"). Prevents infinite-haggling
 * spam and gives the seller a definite floor on negotiation rounds.
 */
const MAX_COUNTER_DEPTH = 2;

/**
 * Sanity bands for offer + counter amounts, expressed as multiples of the
 * listing's asking price. Stops grief-offers (₤1 troll bids, 1,000× counters)
 * without being prescriptive about what's a "fair" haggle. Buyers + sellers
 * can still negotiate aggressively within [50% .. 150%] of asking.
 */
const OFFER_MIN_RATIO = 0.5;
const OFFER_MAX_RATIO = 1.5;

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
    private readonly config: ConfigService,
    private readonly reports: ReportsService,
    private readonly storage: R2StorageService,
    private readonly notifications: WahaNotificationService,
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
      photos?: Array<{ r2Key: string; position: number; url?: string }>;
    },
  ) {
    // Trust gate: users at or below the ban threshold cannot list.
    // CLAUDE.md keeps TrustScore INTERNAL — surface only as a 403 here.
    const threshold = this.config.get<number>('trustScore.banThreshold') ?? 20;
    const seller = await this.prisma.globalUser.findUnique({
      where: { id: sellerId },
      select: { trustScore: true },
    });
    if (!seller) {
      throw new NotFoundException(`Seller ${sellerId} not found`);
    }
    if (seller.trustScore <= threshold) {
      throw new ForbiddenException('INSUFFICIENT_TRUST');
    }
    // Loose gate (#1): require complete profile before publishing a listing.
    await this.assertProfileComplete(sellerId, 'list an item');

    // R-11 F-12 — validate r2Key ownership BEFORE writing photos. Each key
    // must start with the seller's own upload prefix (`uploads/<sellerId>/`)
    // so attackers can't reference another user's photo. The `url` field is
    // ignored on input and always derived from `publicBase + r2Key`.
    if (dto.photos?.length) {
      const expectedPrefix = `uploads/${sellerId}/`;
      for (const p of dto.photos) {
        if (!p.r2Key.startsWith(expectedPrefix)) {
          throw new ForbiddenException(
            'PHOTO_OWNERSHIP_MISMATCH: r2Key must belong to the seller',
          );
        }
      }
    }

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
                // R-11 F-12: derive URL server-side, never trust client.
                url: this.storage.publicUrlForKey(p.r2Key) ?? `/api/v1/uploads/${p.r2Key}`,
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

  /**
   * Activity page (#8) — return the user's listings across all statuses,
   * newest first. Includes one photo for thumbnail rendering and the offer
   * counts that the activity view aggregates per row.
   */
  async listMyListings(sellerId: string) {
    return this.prisma.soukListing.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        photos: { orderBy: { position: 'asc' }, take: 1 },
        _count: { select: { offers: true } },
      },
    });
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
    // R-08: REMOVED listings respond 410 Gone instead of 200. This lets the
    // FE render a "this listing is no longer available" terminal state,
    // distinct from a fresh 404.
    if (listing.status === 'REMOVED') {
      throw new GoneException(`Listing ${id} has been removed`);
    }
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

    // R-08: soft-delete the listing AND cascade-expire all open offers in one
    // transaction, so buyers see deterministic state. Open offers (PENDING /
    // COUNTERED) flip to EXPIRED with reason `listing_removed_by_seller`.
    const { listingUpdated, expiredOffers } = await this.prisma.$transaction(
      async (tx) => {
        const openOffers = await tx.soukOffer.findMany({
          where: {
            listingId: id,
            status: { in: ['PENDING', 'COUNTERED'] },
          },
          select: { id: true, buyerId: true, amount: true },
        });
        if (openOffers.length > 0) {
          await tx.soukOffer.updateMany({
            where: { id: { in: openOffers.map((o) => o.id) } },
            data: {
              status: 'EXPIRED',
              expiredAt: new Date(),
              declineReason: 'listing_removed_by_seller',
            },
          });
        }
        const updated = await tx.soukListing.update({
          where: { id },
          data: { status: 'REMOVED', removedAt: new Date() },
        });
        return { listingUpdated: updated, expiredOffers: openOffers };
      },
    );

    // Notify each buyer (best-effort, outside the transaction).
    for (const off of expiredOffers) {
      try {
        await this.events.emit({
          sourceSubdomain: 'kanto',
          eventType: 'souk.offer.expired_listing_removed',
          userId: off.buyerId,
          payload: {
            offerId: off.id,
            listingId: id,
            reason: 'listing_removed_by_seller',
          },
        });
      } catch (err) {
        this.logger.warn(
          `Expire event emit failed for ${off.id}: ${(err as Error).message}`,
        );
      }
      this.notifyAsync('OFFER_WITHDRAWN', off.buyerId, {
        listingTitle: listing.title,
        offerAmount: off.amount,
      });
    }

    return listingUpdated;
  }

  /**
   * Issue a presigned PUT URL the FE uses to upload a single photo to R2.
   * The BE never touches the bytes — only signs the request.
   * Returns 503 if R2 is not configured (typical local dev).
   */
  async requestPhotoUploadUrl(
    userId: string,
    dto: { filename: string; contentType: string; bytes: number },
  ): Promise<PhotoUploadUrlResponse> {
    return this.storage.presignUpload({
      userId,
      filename: dto.filename,
      contentType: dto.contentType,
      bytes: dto.bytes,
    });
  }

  /**
   * File a report on a listing. Convenience wrapper over the cross-platform
   * Reports pipeline — auto-fills `originSubdomain`, derives offender from
   * the listing's seller, and ensures the FE only has to think in terms of
   * "report this listing".
   */
  async reportListing(
    reporterId: string,
    listingId: string,
    dto: {
      incidentType: IncidentType;
      severity: number;
      reason?: string;
      evidencePhotoR2Key?: string;
    },
  ) {
    const listing = await this.prisma.soukListing.findUnique({
      where: { id: listingId },
      select: { id: true, sellerId: true },
    });
    if (!listing) {
      throw new NotFoundException(`Listing ${listingId} not found`);
    }
    if (listing.sellerId === reporterId) {
      throw new ForbiddenException('Cannot report your own listing');
    }

    return this.reports.file({
      reporterId,
      offenderId: listing.sellerId,
      incidentType: dto.incidentType,
      severity: dto.severity,
      originSubdomain: 'kanto',
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
    this.assertAmountInBand(dto.amount, listing.askingPrice);

    // R-08: one PENDING offer per (buyer, listing). Counter-offer children
    // are EXCLUDED via parentOfferId IS NULL — those are seller-initiated
    // children of an existing thread and don't count against the dup guard.
    const existingPending = await this.prisma.soukOffer.findFirst({
      where: {
        listingId: dto.listingId,
        buyerId,
        status: 'PENDING',
        parentOfferId: null,
      },
      select: { id: true, amount: true },
    });
    if (existingPending) {
      // Use the closed ErrorCode enum + a structured detail blob carrying the
      // OFFER_ALREADY_PENDING sub-code + existing-offer reference so the FE
      // can deep-link the user back to their existing offer.
      throw new GatewayException(
        ErrorCode.CONFLICT,
        'You already have a pending offer on this listing.',
        [
          {
            rule: 'OFFER_ALREADY_PENDING',
            existingOfferId: existingPending.id,
            existingAmount: existingPending.amount,
          },
        ],
      );
    }

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

    // Notify seller via WhatsApp (fire-and-forget)
    this.notifyAsync('OFFER_CREATED', listing.sellerId, {
      listingTitle: listing.title,
      offerAmount: dto.amount,
    });

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
    const offer = await this.prisma.soukOffer.findUnique({
      where: { id: offerId },
      include: { listing: true },
    });
    if (!offer) throw new NotFoundException(`Offer ${offerId} not found`);
    if (offer.sellerId !== sellerId) throw new ForbiddenException('Not the seller');
    if (offer.status !== 'PENDING' && offer.status !== 'COUNTERED') {
      throw new ForbiddenException('Offer cannot be accepted');
    }
    // R-01: refuse if listing is already in a terminal/reserved state.
    if (offer.listing.status !== 'ACTIVE') {
      throw new ForbiddenException(
        `LISTING_NOT_ACTIVE: listing is ${offer.listing.status}`,
      );
    }
    // Loose gate (#1): seller must have a complete profile to accept.
    await this.assertProfileComplete(sellerId, 'accept an offer');

    // Token hold: lock buyer tokens
    if (offer.tokenHoldAmount && offer.tokenHoldAmount > 0) {
      try {
        await this.tokens.spend(offer.buyerId, 'SOUK_OFFER_HOLD', 'individual', offerId);
      } catch {
        throw new ForbiddenException('TOKEN_HOLD_FAILED');
      }
    }

    // R-01: cascade-decline siblings + flip listing → RESERVED atomically.
    // Returns the freshly-accepted offer + the list of cascaded sibling ids
    // so we can fire per-buyer notifications outside the transaction.
    const { updated, cascadedSiblings } = await this.prisma.$transaction(
      async (tx) => {
        // Cascade-decline every other PENDING/COUNTERED offer on this listing.
        const siblings = await tx.soukOffer.findMany({
          where: {
            listingId: offer.listingId,
            id: { not: offerId },
            status: { in: ['PENDING', 'COUNTERED'] },
          },
          select: { id: true, buyerId: true, amount: true },
        });
        if (siblings.length > 0) {
          await tx.soukOffer.updateMany({
            where: { id: { in: siblings.map((s) => s.id) } },
            data: {
              status: 'DECLINED',
              declinedAt: new Date(),
              declineReason: 'auto_declined_listing_sold',
            },
          });
        }
        const updatedOffer = await tx.soukOffer.update({
          where: { id: offerId },
          data: { status: 'ACCEPTED', acceptedAt: new Date() },
        });
        await tx.soukListing.update({
          where: { id: offer.listingId },
          data: { status: 'RESERVED' },
        });
        return { updated: updatedOffer, cascadedSiblings: siblings };
      },
    );

    // Emit event for the accepted offer
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

    // R-01: fire OFFER_DECLINED_DUE_TO_ACCEPT for each cascaded sibling.
    for (const sib of cascadedSiblings) {
      try {
        await this.events.emit({
          sourceSubdomain: 'kanto',
          eventType: 'souk.offer.cascade_declined',
          userId: sib.buyerId,
          payload: {
            offerId: sib.id,
            listingId: offer.listingId,
            reason: 'auto_declined_listing_sold',
            winningOfferId: offerId,
          },
        });
      } catch (err) {
        this.logger.warn(
          `Cascade-decline event emit failed for ${sib.id}: ${(err as Error).message}`,
        );
      }
      // WhatsApp notification — best-effort.
      this.notifyAsync('OFFER_DECLINED', sib.buyerId, {
        listingTitle: offer.listing.title,
        offerAmount: sib.amount,
      });
    }

    // Notify the winning buyer via WhatsApp (fire-and-forget)
    this.notifyAsync('OFFER_ACCEPTED', offer.buyerId, {
      listingTitle: offer.listing.title,
      offerAmount: offer.amount,
    });

    return updated;
  }

  async declineOffer(offerId: string, sellerId: string, reason?: string) {
    const offer = await this.prisma.soukOffer.findUnique({
      where: { id: offerId },
      include: { listing: true },
    });
    if (!offer) throw new NotFoundException(`Offer ${offerId} not found`);
    if (offer.sellerId !== sellerId) throw new ForbiddenException('Not the seller');
    if (offer.status !== 'PENDING' && offer.status !== 'COUNTERED') {
      throw new ForbiddenException('Offer cannot be declined');
    }
    // R-01: refuse if the listing has moved past ACTIVE (e.g. RESERVED, SOLD,
    // REMOVED). Decline only makes sense while the listing is still active.
    if (offer.listing.status !== 'ACTIVE') {
      throw new ForbiddenException(
        `LISTING_NOT_ACTIVE: listing is ${offer.listing.status}`,
      );
    }

    const updated = await this.prisma.soukOffer.update({
      where: { id: offerId },
      data: {
        status: 'DECLINED',
        declinedAt: new Date(),
        declineReason: reason?.trim() ? reason.trim().slice(0, 80) : undefined,
      },
    });

    // Notify buyer via WhatsApp (fire-and-forget)
    this.notifyAsync('OFFER_DECLINED', offer.buyerId, {
      listingTitle: offer.listing.title,
      offerAmount: offer.amount,
    });

    return updated;
  }

  async counterOffer(offerId: string, sellerId: string, amount: number) {
    const parent = await this.prisma.soukOffer.findUnique({
      where: { id: offerId },
      include: { listing: true },
    });
    if (!parent) throw new NotFoundException(`Offer ${offerId} not found`);
    if (parent.sellerId !== sellerId) throw new ForbiddenException('Not the seller');
    if (parent.status !== 'PENDING') throw new ForbiddenException('Offer cannot be countered');
    // R-01: refuse if the listing has moved past ACTIVE.
    if (parent.listing.status !== 'ACTIVE') {
      throw new ForbiddenException(
        `LISTING_NOT_ACTIVE: listing is ${parent.listing.status}`,
      );
    }
    this.assertAmountInBand(amount, parent.listing.askingPrice);
    // Cap chain depth: refuse if the new child would push us past MAX_COUNTER_DEPTH.
    await this.assertCounterDepthAllowed(parent.parentOfferId);

    // Mark parent as countered
    await this.prisma.soukOffer.update({
      where: { id: offerId },
      data: { status: 'COUNTERED' },
    });

    // Create new counter offer
    const counter = await this.prisma.soukOffer.create({
      data: {
        listingId: parent.listingId,
        buyerId: parent.buyerId,
        sellerId: parent.sellerId,
        amount,
        status: 'PENDING',
        parentOfferId: offerId,
      },
    });

    // Notify buyer via WhatsApp (fire-and-forget)
    this.notifyAsync('OFFER_COUNTERED', parent.buyerId, {
      listingTitle: parent.listing.title,
      offerAmount: parent.amount,
      counterAmount: amount,
    });

    return counter;
  }

  async withdrawOffer(offerId: string, buyerId: string) {
    const offer = await this.prisma.soukOffer.findUnique({
      where: { id: offerId },
      include: { listing: true },
    });
    if (!offer) throw new NotFoundException(`Offer ${offerId} not found`);
    if (offer.buyerId !== buyerId) throw new ForbiddenException('Not the buyer');
    // Only PENDING offers can be withdrawn. Once the seller has countered, the
    // parent is COUNTERED and the active negotiation has moved to the child;
    // withdrawing the historical parent at that point makes no sense (and
    // surprises the seller). The user can decline the active counter instead.
    if (offer.status !== 'PENDING') {
      throw new ForbiddenException(
        `Offer cannot be withdrawn (status is ${offer.status}). Once countered, decline the active counter to exit the thread.`,
      );
    }

    const updated = await this.prisma.soukOffer.update({
      where: { id: offerId },
      data: { status: 'WITHDRAWN', withdrawnAt: new Date() },
    });

    // Notify seller via WhatsApp (fire-and-forget)
    this.notifyAsync('OFFER_WITHDRAWN', offer.sellerId, {
      listingTitle: offer.listing.title,
      offerAmount: offer.amount,
    });

    return updated;
  }

  // ───────────── R-02 · Buyer-side counter-offer actions ─────────────
  //
  // When the seller counters, BE creates a child SoukOffer with parentOfferId
  // set (see counterOffer above). The child has the SAME buyer/seller
  // assignment as the parent. The buyer now needs UI actions on that child:
  //   - accept it (closes the deal at the seller's counter amount)
  //   - decline it (no deal; listing stays ACTIVE)
  //   - counter again (creates a grandchild offer with parentOfferId pointing
  //     to the child)
  //
  // Authorization:
  //   - All three require the caller to be the offer's buyerId.
  //   - All three require offer.parentOfferId !== null. We refuse on
  //     non-counter offers because the seller-side endpoints already cover
  //     those flows.

  /** Buyer accepts a seller's counter. Same cascade as seller acceptOffer. */
  async buyerAcceptCounter(offerId: string, buyerId: string) {
    const offer = await this.prisma.soukOffer.findUnique({
      where: { id: offerId },
      include: { listing: true },
    });
    if (!offer) throw new NotFoundException(`Offer ${offerId} not found`);
    if (offer.buyerId !== buyerId) throw new ForbiddenException('Not the buyer');
    if (offer.parentOfferId === null) {
      throw new ForbiddenException(
        'BUYER_ACCEPT_NOT_COUNTER: this endpoint only accepts counter-offers',
      );
    }
    if (offer.status !== 'PENDING') {
      throw new ForbiddenException('Offer cannot be accepted');
    }
    if (offer.listing.status !== 'ACTIVE') {
      throw new ForbiddenException(
        `LISTING_NOT_ACTIVE: listing is ${offer.listing.status}`,
      );
    }
    // Loose gate (#1): buyer must have a complete profile to accept a counter.
    await this.assertProfileComplete(buyerId, 'accept this counter-offer');

    // Token hold: if the BUYER attached a hold to the original offer, run the
    // spend now. Counter offers themselves don't usually carry a hold.
    if (offer.tokenHoldAmount && offer.tokenHoldAmount > 0) {
      try {
        await this.tokens.spend(offer.buyerId, 'SOUK_OFFER_HOLD', 'individual', offerId);
      } catch {
        throw new ForbiddenException('TOKEN_HOLD_FAILED');
      }
    }

    // Reuse R-01's cascade pattern. The accepted offer itself is excluded from
    // the cascade by id; its parent (status='COUNTERED') is excluded because
    // it's not in the PENDING/COUNTERED set for `update`.
    // Wait — COUNTERED IS in the set. So the parent would get re-flipped to
    // DECLINED. That's actually fine semantically: the buyer chose the
    // counter, so the original is dead too. But for cleanliness, exclude the
    // parent so it stays as the historical COUNTERED record.
    const { updated, cascadedSiblings } = await this.prisma.$transaction(
      async (tx) => {
        const siblings = await tx.soukOffer.findMany({
          where: {
            listingId: offer.listingId,
            id: { notIn: [offerId, offer.parentOfferId!] },
            status: { in: ['PENDING', 'COUNTERED'] },
          },
          select: { id: true, buyerId: true, amount: true },
        });
        if (siblings.length > 0) {
          await tx.soukOffer.updateMany({
            where: { id: { in: siblings.map((s) => s.id) } },
            data: {
              status: 'DECLINED',
              declinedAt: new Date(),
              declineReason: 'auto_declined_listing_sold',
            },
          });
        }
        const updatedOffer = await tx.soukOffer.update({
          where: { id: offerId },
          data: { status: 'ACCEPTED', acceptedAt: new Date() },
        });
        await tx.soukListing.update({
          where: { id: offer.listingId },
          data: { status: 'RESERVED' },
        });
        return { updated: updatedOffer, cascadedSiblings: siblings };
      },
    );

    // Events + notifications, same shape as seller-accept.
    try {
      await this.events.emit({
        sourceSubdomain: 'kanto',
        eventType: 'souk.offer.accepted',
        userId: offer.sellerId,
        payload: {
          offerId,
          listingId: offer.listingId,
          sellerId: offer.sellerId,
          buyerId: offer.buyerId,
          acceptedBy: 'buyer',
        },
      });
    } catch (err) {
      this.logger.warn(`Event emit failed: ${(err as Error).message}`);
    }
    for (const sib of cascadedSiblings) {
      try {
        await this.events.emit({
          sourceSubdomain: 'kanto',
          eventType: 'souk.offer.cascade_declined',
          userId: sib.buyerId,
          payload: {
            offerId: sib.id,
            listingId: offer.listingId,
            reason: 'auto_declined_listing_sold',
            winningOfferId: offerId,
          },
        });
      } catch (err) {
        this.logger.warn(
          `Cascade-decline event emit failed for ${sib.id}: ${(err as Error).message}`,
        );
      }
      this.notifyAsync('OFFER_DECLINED', sib.buyerId, {
        listingTitle: offer.listing.title,
        offerAmount: sib.amount,
      });
    }
    // Notify the seller — they're the recipient of the accepted counter.
    this.notifyAsync('OFFER_ACCEPTED', offer.sellerId, {
      listingTitle: offer.listing.title,
      offerAmount: offer.amount,
    });

    return updated;
  }

  /** Buyer declines a seller's counter. Listing stays ACTIVE. */
  async buyerDeclineCounter(offerId: string, buyerId: string, reason?: string) {
    const offer = await this.prisma.soukOffer.findUnique({
      where: { id: offerId },
      include: { listing: true },
    });
    if (!offer) throw new NotFoundException(`Offer ${offerId} not found`);
    if (offer.buyerId !== buyerId) throw new ForbiddenException('Not the buyer');
    if (offer.parentOfferId === null) {
      throw new ForbiddenException(
        'BUYER_DECLINE_NOT_COUNTER: this endpoint only declines counter-offers',
      );
    }
    if (offer.status !== 'PENDING') {
      throw new ForbiddenException('Offer cannot be declined');
    }
    if (offer.listing.status !== 'ACTIVE') {
      throw new ForbiddenException(
        `LISTING_NOT_ACTIVE: listing is ${offer.listing.status}`,
      );
    }

    const updated = await this.prisma.soukOffer.update({
      where: { id: offerId },
      data: {
        status: 'DECLINED',
        declinedAt: new Date(),
        declineReason: reason?.trim()
          ? reason.trim().slice(0, 80)
          : 'declined_by_buyer',
      },
    });

    this.notifyAsync('OFFER_DECLINED', offer.sellerId, {
      listingTitle: offer.listing.title,
      offerAmount: offer.amount,
    });
    return updated;
  }

  /**
   * Buyer counter-offers back. Creates a grandchild offer with
   * parentOfferId pointing at the current (seller-initiated) counter, and
   * marks that counter as COUNTERED. Same buyer/seller assignment.
   */
  async buyerCounterOffer(offerId: string, buyerId: string, amount: number) {
    const parent = await this.prisma.soukOffer.findUnique({
      where: { id: offerId },
      include: { listing: true },
    });
    if (!parent) throw new NotFoundException(`Offer ${offerId} not found`);
    if (parent.buyerId !== buyerId) throw new ForbiddenException('Not the buyer');
    if (parent.parentOfferId === null) {
      throw new ForbiddenException(
        'BUYER_COUNTER_NOT_COUNTER: re-counter only valid on seller-initiated counters',
      );
    }
    if (parent.status !== 'PENDING') {
      throw new ForbiddenException('Offer cannot be countered');
    }
    if (parent.listing.status !== 'ACTIVE') {
      throw new ForbiddenException(
        `LISTING_NOT_ACTIVE: listing is ${parent.listing.status}`,
      );
    }
    this.assertAmountInBand(amount, parent.listing.askingPrice);
    // Same depth cap as seller-side counterOffer.
    await this.assertCounterDepthAllowed(parent.parentOfferId);

    // Mark parent as countered.
    await this.prisma.soukOffer.update({
      where: { id: offerId },
      data: { status: 'COUNTERED' },
    });

    // Create the grandchild counter from buyer side. buyer/seller assignment
    // stays the same — the only change is which party initiated.
    const counter = await this.prisma.soukOffer.create({
      data: {
        listingId: parent.listingId,
        buyerId: parent.buyerId,
        sellerId: parent.sellerId,
        amount,
        status: 'PENDING',
        parentOfferId: offerId,
      },
    });

    this.notifyAsync('OFFER_COUNTERED', parent.sellerId, {
      listingTitle: parent.listing.title,
      offerAmount: parent.amount,
      counterAmount: amount,
    });

    return counter;
  }

  /**
   * Walks the `parentOfferId` chain of the offer being countered and throws
   * if adding one more child would push past MAX_COUNTER_DEPTH.
   *
   * Depth of the offer being countered = count of its ancestors. The new
   * child created by the counter would sit at depth+1. Iteration is bounded
   * by `MAX_COUNTER_DEPTH + 2` as a safety net against malformed cycles.
   */
  /**
   * Loose profile gate (beta v1) — block LIST and ACCEPT actions if the actor's
   * profile is incomplete. Definition matches the FE's `hasCompleteProfile`:
   * fullName + gender + birthdate + ≥18 years old. Other fields
   * (madinatyGroup, buildingNo, aptNo) stay optional for v1.
   *
   * NB: KYC is NOT required at this tier — it's still optional. Stricter tiers
   * (require KYC=APPROVED) can be layered in later by checking the related
   * `kyc.status` field.
   */
  private async assertProfileComplete(userId: string, action: string): Promise<void> {
    const user = await this.prisma.globalUser.findUnique({
      where: { id: userId },
      select: { metadata: true },
    });
    if (!user) throw new NotFoundException(`User ${userId} not found`);
    const meta = (user.metadata ?? {}) as Record<string, unknown>;
    const fullName = typeof meta.fullName === 'string' ? meta.fullName.trim() : '';
    const gender = typeof meta.gender === 'string' ? meta.gender.trim() : '';
    const birthdate = typeof meta.birthdate === 'string' ? meta.birthdate.trim() : '';
    if (!fullName || !gender || !birthdate) {
      throw new ForbiddenException(
        `PROFILE_INCOMPLETE: complete your profile (full name, gender, birthdate) before you ${action}.`,
      );
    }
    // ≥18 check — must be born more than 18 years ago.
    const dob = new Date(birthdate);
    if (Number.isNaN(dob.getTime())) {
      throw new ForbiddenException(
        `PROFILE_INCOMPLETE: birthdate is invalid. Update your profile before you ${action}.`,
      );
    }
    const eighteenYearsAgo = new Date();
    eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
    if (dob > eighteenYearsAgo) {
      throw new ForbiddenException(
        `PROFILE_AGE_RESTRICTED: you must be 18 or older to ${action}.`,
      );
    }
  }

  /**
   * Enforce the [50% .. 150%] of asking-price band on offer + counter amounts.
   * Throws BadRequestException with a structured message so the FE can map
   * it to a user-readable form. Amounts must be positive integers.
   */
  private assertAmountInBand(amount: number, askingPrice: number): void {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Offer amount must be greater than 0.');
    }
    const min = Math.ceil(askingPrice * OFFER_MIN_RATIO);
    const max = Math.floor(askingPrice * OFFER_MAX_RATIO);
    if (amount < min || amount > max) {
      throw new BadRequestException(
        `OFFER_OUT_OF_BAND: amount must be between ${min} and ${max} (50%-150% of the asking price ${askingPrice}).`,
      );
    }
  }

  private async assertCounterDepthAllowed(parentOfferId: string | null): Promise<void> {
    let depth = 0;
    let cursor: string | null = parentOfferId;
    for (let i = 0; i < MAX_COUNTER_DEPTH + 2 && cursor; i++) {
      depth += 1;
      const row = await this.prisma.soukOffer.findUnique({
        where: { id: cursor },
        select: { parentOfferId: true },
      });
      cursor = row?.parentOfferId ?? null;
    }
    if (depth + 1 > MAX_COUNTER_DEPTH) {
      throw new ForbiddenException(
        `MAX_COUNTER_DEPTH_REACHED: offer chain limit is ${MAX_COUNTER_DEPTH} counters per offer thread (3 rounds total). Accept or decline.`,
      );
    }
  }

  async listSentOffers(buyerId: string) {
    // R-03a: include handover + ratings so /my/handovers can filter, render
    // confirmation state, and detect whether the current user has rated yet —
    // all without extra round trips per row. Capped at 100 to keep the
    // response bounded; ACCEPTED-state pagination should be added before
    // power users with very long histories exceed this.
    return this.prisma.soukOffer.findMany({
      where: { buyerId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        listing: { include: { photos: { take: 1 } } },
        handover: true,
        ratings: { select: { id: true, raterId: true, score: true } },
      },
    });
  }

  async listReceivedOffers(sellerId: string) {
    return this.prisma.soukOffer.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        listing: { include: { photos: { take: 1 } } },
        handover: true,
        ratings: { select: { id: true, raterId: true, score: true } },
      },
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

  // ─────────────── Notification helpers ───────────────

  /**
   * Fire-and-forget WhatsApp notification. Looks up the user's phone number,
   * then delegates to WahaNotificationService. Swallows all errors so business
   * logic is never blocked by a flaky WhatsApp connection.
   */
  private notifyAsync(
    type: Parameters<WahaNotificationService['sendOfferNotification']>[0]['type'],
    userId: string,
    meta: { listingTitle: string; offerAmount: number; counterAmount?: number },
  ): void {
    // Fire-and-forget: don't await, don't throw.
    (async () => {
      try {
        const user = await this.prisma.globalUser.findUnique({
          where: { id: userId },
          select: { phoneNumber: true },
        });
        if (!user?.phoneNumber) return;
        await this.notifications.sendOfferNotification({
          type,
          recipientPhone: user.phoneNumber,
          listingTitle: meta.listingTitle,
          offerAmount: meta.offerAmount,
          counterAmount: meta.counterAmount,
        });
      } catch {
        /* best effort — never block the request */
      }
    })();
  }
}
