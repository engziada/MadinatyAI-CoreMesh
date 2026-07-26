import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@madinatyai/prisma';
import { SoukListingStatus, SoukDisputeStatus } from '@prisma/client';

@Injectable()
export class EcosystemAdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Aggregates stats across Souq ElKanto (P2P) and Madinty Kitchens.
   */
  async getStats() {
    // ─────────────── SOUQ ELKANTO STATS ───────────────
    // 1. Listings by Status
    const listingGroups = await this.prisma.soukListing.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const listings = {
      ACTIVE: 0,
      RESERVED: 0,
      SOLD: 0,
      PENDING_REVIEW: 0,
      REMOVED: 0,
      EXPIRED: 0,
      total: 0,
    };

    for (const group of listingGroups) {
      const status = group.status as string;
      const count = group._count.id;
      if (status in listings) {
        listings[status as keyof typeof listings] = count;
      }
      listings.total += count;
    }

    // 2. Offers by Status
    const offerGroups = await this.prisma.soukOffer.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const offers = {
      PENDING: 0,
      ACCEPTED: 0,
      DECLINED: 0,
      COUNTERED: 0,
      WITHDRAWN: 0,
      EXPIRED: 0,
      HANDOVER_PENDING: 0,
      CONFIRMED: 0,
      CLOSED: 0,
      CANCELLED: 0,
      total: 0,
    };

    for (const group of offerGroups) {
      const status = group.status as string;
      const count = group._count.id;
      if (status in offers) {
        offers[status as keyof typeof offers] = count;
      }
      offers.total += count;
    }

    // 3. Disputes by Status
    const disputeGroups = await this.prisma.soukDispute.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const disputes = {
      OPEN: 0,
      RESOLVED: 0,
      REJECTED: 0,
      total: 0,
    };

    for (const group of disputeGroups) {
      const status = group.status as string;
      const count = group._count.id;
      if (status in disputes) {
        disputes[status as keyof typeof disputes] = count;
      }
      disputes.total += count;
    }

    // 4. Total Transaction Volume (Sum of closed/accepted/confirmed offers)
    const volumeAgg = await this.prisma.soukOffer.aggregate({
      where: {
        status: { in: ['ACCEPTED', 'CONFIRMED', 'CLOSED'] },
      },
      _sum: {
        amount: true,
      },
    });
    const totalVolume = volumeAgg._sum.amount ?? 0;

    // 5. Category Distribution
    const categoryGroups = await this.prisma.soukListing.groupBy({
      by: ['category'],
      _count: { id: true },
    });
    const categories = categoryGroups.map((g) => ({
      category: g.category,
      count: g._count.id,
    }));

    // 6. Total Unique Souq Sellers & Buyers
    const uniqueSellers = await this.prisma.soukListing.findMany({
      select: { sellerId: true },
      distinct: ['sellerId'],
    });
    const uniqueBuyers = await this.prisma.soukOffer.findMany({
      select: { buyerId: true },
      distinct: ['buyerId'],
    });

    const activeSouqUsersCount = new Set([
      ...uniqueSellers.map((s) => s.sellerId),
      ...uniqueBuyers.map((b) => b.buyerId),
    ]).size;

    // ─────────────── MADINTY KITCHENS STATS ───────────────
    // 1. Kitchens count (Active vs Inactive)
    const kitchenGroups = await this.prisma.kitchenBusiness.groupBy({
      by: ['isActive'],
      _count: { id: true },
    });

    const kitchens = {
      active: 0,
      inactive: 0,
      total: 0,
    };

    for (const group of kitchenGroups) {
      if (group.isActive) {
        kitchens.active = group._count.id;
      } else {
        kitchens.inactive = group._count.id;
      }
      kitchens.total += group._count.id;
    }

    // 2. Menu Items count
    const totalMenuItems = await this.prisma.kitchenMenuItem.count();

    // 3. Cuisines Distribution
    const cuisineGroups = await this.prisma.kitchenBusiness.groupBy({
      by: ['cuisineType'],
      _count: { id: true },
    });

    const cuisines = cuisineGroups.map((g) => ({
      cuisine: g.cuisineType || 'Unspecified',
      count: g._count.id,
    }));

    // ─────────────── MADINTY LIFE STATS ───────────────
    const locationTypeGroups = await this.prisma.lifeLocation.groupBy({
      by: ['type'],
      _count: { id: true },
    });

    const lifeLocations = {
      total: 0,
      types: {} as Record<string, number>,
    };

    for (const group of locationTypeGroups) {
      lifeLocations.types[group.type] = group._count.id;
      lifeLocations.total += group._count.id;
    }

    // ─────────────── MADINTY EXPRESS STATS ───────────────
    const [totalCouriers, approvedCouriers, pendingCouriers, onlineCouriers, totalDeliveries, deliveryStatusGroups] = await Promise.all([
      this.prisma.expressCourier.count(),
      this.prisma.expressCourier.count({ where: { status: 'APPROVED' } }),
      this.prisma.expressCourier.count({ where: { status: 'PENDING' } }),
      this.prisma.expressCourier.count({ where: { isOnline: true } }),
      this.prisma.expressDeliveryRequest.count(),
      this.prisma.expressDeliveryRequest.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);

    const deliveriesByStatus = {
      PENDING: 0,
      ACCEPTED: 0,
      PICKED_UP: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };

    for (const group of deliveryStatusGroups) {
      const status = group.status as keyof typeof deliveriesByStatus;
      if (status in deliveriesByStatus) {
        deliveriesByStatus[status] = group._count.id;
      }
    }

    return {
      souq: {
        listings,
        offers,
        disputes,
        totalVolume,
        categories,
        activeUsersCount: activeSouqUsersCount,
      },
      kitchens: {
        stats: kitchens,
        totalMenuItems,
        cuisines,
      },
      life: {
        locations: lifeLocations,
      },
      express: {
        couriers: {
          total: totalCouriers,
          approved: approvedCouriers,
          pending: pendingCouriers,
          online: onlineCouriers,
        },
        deliveries: {
          total: totalDeliveries,
          byStatus: deliveriesByStatus,
        },
      },
    };
  }

  /**
   * Retrieves listings with pagination, filters, and seller profiles mapped in-memory.
   */
  async getListings(params: {
    page: number;
    limit: number;
    status?: SoukListingStatus;
    category?: string;
    q?: string;
  }) {
    const page = Math.max(1, params.page);
    const limit = Math.min(100, Math.max(1, params.limit));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status) {
      where.status = params.status;
    }
    if (params.category) {
      where.category = params.category;
    }
    if (params.q) {
      where.title = { contains: params.q, mode: 'insensitive' };
    }

    const [total, listings] = await Promise.all([
      this.prisma.soukListing.count({ where }),
      this.prisma.soukListing.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { photos: { orderBy: { position: 'asc' } } },
      }),
    ]);

    // Resolve seller details
    const sellerIds = Array.from(new Set(listings.map((l) => l.sellerId)));
    const sellers = await this.prisma.globalUser.findMany({
      where: { id: { in: sellerIds } },
      select: { id: true, phoneNumber: true, trustScore: true, metadata: true },
    });

    const sellerMap = new Map(sellers.map((s) => [s.id, s]));

    const listingsWithSellers = listings.map((l) => ({
      ...l,
      seller: sellerMap.get(l.sellerId) || null,
    }));

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: listingsWithSellers,
    };
  }

  /**
   * Retrieves registered kitchens with pagination, filters, and owner profiles mapped in-memory.
   */
  async getKitchens(params: { page: number; limit: number; q?: string; isActive?: boolean; status?: string }) {
    const page = Math.max(1, params.page);
    const limit = Math.min(100, Math.max(1, params.limit));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }
    if (params.status !== undefined && params.status !== '') {
      where.status = params.status;
    }
    if (params.q) {
      where.OR = [
        { name: { contains: params.q, mode: 'insensitive' } },
        { slug: { contains: params.q, mode: 'insensitive' } },
        { cuisineType: { contains: params.q, mode: 'insensitive' } },
      ];
    }

    const [total, businesses] = await Promise.all([
      this.prisma.kitchenBusiness.count({ where }),
      this.prisma.kitchenBusiness.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { menuItems: true } },
        },
      }),
    ]);

    // Resolve owner details
    const ownerIds = Array.from(new Set(businesses.map((b) => b.ownerGlobalUserId)));
    const owners = await this.prisma.globalUser.findMany({
      where: { id: { in: ownerIds } },
      select: { id: true, phoneNumber: true, trustScore: true },
    });

    const ownerMap = new Map(owners.map((o) => [o.id, o]));

    const businessesWithOwners = businesses.map((b) => ({
      ...b,
      owner: ownerMap.get(b.ownerGlobalUserId) || null,
      menuItemsCount: b._count.menuItems,
    }));

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: businessesWithOwners,
    };
  }

  /**
   * Toggle a kitchen business active status.
   */
  async toggleKitchenActive(id: string) {
    const business = await this.prisma.kitchenBusiness.findUnique({
      where: { id },
    });

    if (!business) {
      throw new NotFoundException(`Kitchen business with ID ${id} not found`);
    }

    const updated = await this.prisma.kitchenBusiness.update({
      where: { id },
      data: { isActive: !business.isActive },
    });

    return updated;
  }

  /**
   * Approve a kitchen business (set status = APPROVED and isActive = true).
   */
  async approveKitchen(id: string) {
    const business = await this.prisma.kitchenBusiness.findUnique({
      where: { id },
    });

    if (!business) {
      throw new NotFoundException(`Kitchen business with ID ${id} not found`);
    }

    const updated = await this.prisma.kitchenBusiness.update({
      where: { id },
      data: { status: 'APPROVED', isActive: true },
    });

    return updated;
  }

  /**
   * Reject a kitchen business (set status = REJECTED and isActive = false).
   */
  async rejectKitchen(id: string) {
    const business = await this.prisma.kitchenBusiness.findUnique({
      where: { id },
    });

    if (!business) {
      throw new NotFoundException(`Kitchen business with ID ${id} not found`);
    }

    const updated = await this.prisma.kitchenBusiness.update({
      where: { id },
      data: { status: 'REJECTED', isActive: false },
    });

    return updated;
  }

  /**
   * Retrieves all users in the system and annotates them with listing, offer, dispute, and kitchen counts.
   */
  async getUsers(params: { page: number; limit: number; q?: string }) {
    const page = Math.max(1, params.page);
    const limit = Math.min(100, Math.max(1, params.limit));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.q) {
      where.phoneNumber = { contains: params.q };
    }

    const [total, users] = await Promise.all([
      this.prisma.globalUser.count({ where }),
      this.prisma.globalUser.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, phoneNumber: true, trustScore: true, role: true, createdAt: true, metadata: true },
      }),
    ]);

    const userIds = users.map((u) => u.id);

    // Get listings counts
    const listingCounts = await this.prisma.soukListing.groupBy({
      by: ['sellerId'],
      where: { sellerId: { in: userIds } },
      _count: { id: true },
    });

    // Get offer counts
    const offerCounts = await this.prisma.soukOffer.groupBy({
      by: ['buyerId'],
      where: { buyerId: { in: userIds } },
      _count: { id: true },
    });

    // Get dispute counts (filed by or filed against)
    const disputeFiledCounts = await this.prisma.soukDispute.groupBy({
      by: ['filedById'],
      where: { filedById: { in: userIds } },
      _count: { id: true },
    });

    // Get kitchen businesses owned by users
    const kitchens = await this.prisma.kitchenBusiness.findMany({
      where: { ownerGlobalUserId: { in: userIds } },
      select: { ownerGlobalUserId: true, slug: true },
    });

    const listingMap = new Map(listingCounts.map((c) => [c.sellerId, c._count.id]));
    const offerMap = new Map(offerCounts.map((c) => [c.buyerId, c._count.id]));
    const disputeMap = new Map(disputeFiledCounts.map((c) => [c.filedById, c._count.id]));
    const kitchenMap = new Map(kitchens.map((k) => [k.ownerGlobalUserId, k.slug]));

    const annotatedUsers = users.map((u) => ({
      ...u,
      listingsCount: listingMap.get(u.id) || 0,
      offersCount: offerMap.get(u.id) || 0,
      disputesCount: disputeMap.get(u.id) || 0,
      kitchenSlug: kitchenMap.get(u.id) || null,
    }));

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: annotatedUsers,
    };
  }

  /**
   * Retrieves disputes with details.
   */
  async getDisputes(params: { page: number; limit: number; status?: SoukDisputeStatus }) {
    const page = Math.max(1, params.page);
    const limit = Math.min(100, Math.max(1, params.limit));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status) {
      where.status = params.status;
    }

    const [total, disputes] = await Promise.all([
      this.prisma.soukDispute.count({ where }),
      this.prisma.soukDispute.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          offer: {
            include: {
              listing: true,
            },
          },
        },
      }),
    ]);

    // Resolve filer and offender profiles
    const userIds = Array.from(
      new Set([
        ...disputes.map((d) => d.filedById),
        ...disputes.map((d) => d.againstId),
        ...disputes.map((d) => d.resolvedById).filter((id): id is string => !!id),
      ]),
    );

    const users = await this.prisma.globalUser.findMany({
      where: { id: { in: userIds } },
      select: { id: true, phoneNumber: true, trustScore: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const disputesWithProfiles = disputes.map((d) => ({
      ...d,
      filedBy: userMap.get(d.filedById) || null,
      against: userMap.get(d.againstId) || null,
      resolvedBy: d.resolvedById ? userMap.get(d.resolvedById) || null : null,
    }));

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: disputesWithProfiles,
    };
  }

  /**
   * Update kitchen business branding details (tokens, financials, delivery).
   */
  async updateKitchenBranding(id: string, branding: any) {
    const business = await this.prisma.kitchenBusiness.findUnique({
      where: { id },
    });

    if (!business) {
      throw new NotFoundException(`Kitchen business with ID ${id} not found`);
    }

    const updated = await this.prisma.kitchenBusiness.update({
      where: { id },
      data: { branding },
    });

    return updated;
  }

  /**
   * Get all delivery couriers with pagination and filters.
   */
  async getExpressCouriers(params: { page: number; limit: number; q?: string; status?: string }) {
    const skip = (params.page - 1) * params.limit;
    const where: any = {};

    if (params.status) {
      where.status = params.status;
    }

    if (params.q) {
      where.OR = [
        { name: { contains: params.q, mode: 'insensitive' } },
        { phone: { contains: params.q } },
        { nationalId: { contains: params.q } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.expressCourier.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.expressCourier.count({ where }),
    ]);

    return { items, total, page: params.page, limit: params.limit };
  }

  /**
   * Approve a delivery courier request.
   */
  async approveCourier(id: string) {
    const courier = await this.prisma.expressCourier.findUnique({ where: { id } });
    if (!courier) {
      throw new NotFoundException(`Courier with ID ${id} not found`);
    }
    return this.prisma.expressCourier.update({
      where: { id },
      data: { status: 'APPROVED' },
    });
  }

  /**
   * Reject a delivery courier request.
   */
  async rejectCourier(id: string) {
    const courier = await this.prisma.expressCourier.findUnique({ where: { id } });
    if (!courier) {
      throw new NotFoundException(`Courier with ID ${id} not found`);
    }
    return this.prisma.expressCourier.update({
      where: { id },
      data: { status: 'REJECTED' },
    });
  }

  /**
   * Get all delivery requests.
   */
  async getExpressDeliveries(params: { page: number; limit: number; status?: string }) {
    const skip = (params.page - 1) * params.limit;
    const where: any = {};

    if (params.status) {
      where.status = params.status;
    }

    const [items, total] = await Promise.all([
      this.prisma.expressDeliveryRequest.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.expressDeliveryRequest.count({ where }),
    ]);

    return { items, total, page: params.page, limit: params.limit };
  }
}
