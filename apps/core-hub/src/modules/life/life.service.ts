import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@madinatyai/prisma';
import { LifeLocationType, LifeItemType, LifeBookingType, LifeBookingStatus } from '@prisma/client';

@Injectable()
export class MadintyLifeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new spatial place/location in the hierarchy.
   */
  async createLocation(dto: {
    name: string;
    nameAr: string;
    description?: string;
    descriptionAr?: string;
    latitude?: number;
    longitude?: number;
    parentId?: string;
    type: LifeLocationType;
    metadata?: any;
  }) {
    if (dto.parentId) {
      const parentExists = await this.prisma.lifeLocation.findUnique({
        where: { id: dto.parentId },
      });
      if (!parentExists) {
        throw new NotFoundException(`Parent location with ID ${dto.parentId} not found`);
      }
    }

    return this.prisma.lifeLocation.create({
      data: {
        name: dto.name,
        nameAr: dto.nameAr,
        description: dto.description,
        descriptionAr: dto.descriptionAr,
        latitude: dto.latitude,
        longitude: dto.longitude,
        parentId: dto.parentId || null,
        type: dto.type,
        metadata: dto.metadata || {},
      },
    });
  }

  /**
   * Retrieves a single location by ID, including its direct children and full ancestor breadcrumbs.
   */
  async getLocation(id: string) {
    const location = await this.prisma.lifeLocation.findUnique({
      where: { id },
      include: {
        children: {
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }

    // Resolve breadcrumbs path recursively (ancestors)
    const breadcrumbs = [];
    let current = location;
    while (current && current.parentId) {
      const parent = await this.prisma.lifeLocation.findUnique({
        where: { id: current.parentId },
        select: { id: true, name: true, nameAr: true, type: true, parentId: true },
      });
      if (parent) {
        breadcrumbs.unshift({
          id: parent.id,
          name: parent.name,
          nameAr: parent.nameAr,
          type: parent.type,
        });
        current = parent as any;
      } else {
        break;
      }
    }

    return {
      ...location,
      breadcrumbs,
    };
  }

  /**
   * Lists locations based on parent, type, or text query.
   */
  async listLocations(params: { q?: string; parentId?: string; type?: LifeLocationType }) {
    const where: any = {};
    
    if (params.parentId !== undefined) {
      where.parentId = params.parentId === 'null' || params.parentId === '' ? null : params.parentId;
    }
    if (params.type) {
      where.type = params.type;
    }
    if (params.q) {
      where.OR = [
        { name: { contains: params.q, mode: 'insensitive' } },
        { nameAr: { contains: params.q, mode: 'insensitive' } },
      ];
    }

    return this.prisma.lifeLocation.findMany({
      where,
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
  }

  /**
   * Recursively fetches the entire subtree hierarchy from a root parent node.
   */
  async getSubtreeHierarchy(parentId: string | null = null): Promise<any[]> {
    const locations = await this.prisma.lifeLocation.findMany({
      where: { parentId },
      orderBy: { name: 'asc' },
    });

    const tree = [];
    for (const loc of locations) {
      const children = await this.getSubtreeHierarchy(loc.id);
      tree.push({
        ...loc,
        children,
      });
    }
    return tree;
  }

  /**
   * Updates an existing location.
   */
  async updateLocation(
    id: string,
    dto: {
      name?: string;
      nameAr?: string;
      description?: string;
      descriptionAr?: string;
      latitude?: number;
      longitude?: number;
      parentId?: string;
      type?: LifeLocationType;
      metadata?: any;
    },
  ) {
    const location = await this.prisma.lifeLocation.findUnique({
      where: { id },
    });
    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }

    // Prevent circular reference
    if (dto.parentId === id) {
      throw new BadRequestException('A location cannot be its own parent');
    }

    if (dto.parentId) {
      const parentExists = await this.prisma.lifeLocation.findUnique({
        where: { id: dto.parentId },
      });
      if (!parentExists) {
        throw new NotFoundException(`Parent location with ID ${dto.parentId} not found`);
      }
    }

    return this.prisma.lifeLocation.update({
      where: { id },
      data: {
        name: dto.name ?? location.name,
        nameAr: dto.nameAr ?? location.nameAr,
        description: dto.description ?? location.description,
        descriptionAr: dto.descriptionAr ?? location.descriptionAr,
        latitude: dto.latitude !== undefined ? dto.latitude : location.latitude,
        longitude: dto.longitude !== undefined ? dto.longitude : location.longitude,
        parentId: dto.parentId !== undefined ? (dto.parentId === '' ? null : dto.parentId) : location.parentId,
        type: dto.type ?? location.type,
        metadata: dto.metadata ?? location.metadata,
      },
    });
  }

  /**
   * Deletes a location and recursively cascade deletes all child locations in the subtree.
   */
  async deleteLocation(id: string) {
    const location = await this.prisma.lifeLocation.findUnique({
      where: { id },
    });
    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }

    return this.prisma.lifeLocation.delete({
      where: { id },
    });
  }

  // ── STOREFRONT ITEMS CRUD ──
  async getItems(locationId: string) {
    return this.prisma.lifeLocationItem.findMany({
      where: { locationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createItem(locationId: string, dto: {
    title: string;
    titleAr?: string;
    description?: string;
    descriptionAr?: string;
    price?: number;
    imageUrl?: string;
    category?: string;
    type: LifeItemType;
    metadata?: any;
  }) {
    return this.prisma.lifeLocationItem.create({
      data: {
        locationId,
        ...dto,
      },
    });
  }

  async updateItem(itemId: string, dto: {
    title?: string;
    titleAr?: string;
    description?: string;
    descriptionAr?: string;
    price?: number;
    imageUrl?: string;
    category?: string;
    isAvailable?: boolean;
    type?: LifeItemType;
    metadata?: any;
  }) {
    return this.prisma.lifeLocationItem.update({
      where: { id: itemId },
      data: dto,
    });
  }

  async deleteItem(itemId: string) {
    return this.prisma.lifeLocationItem.delete({
      where: { id: itemId },
    });
  }

  // ── STOREFRONT BOOKINGS/ORDERS CRUD ──
  async getBookings(locationId: string, type?: LifeBookingType, status?: LifeBookingStatus) {
    const where: any = { locationId };
    if (type) where.type = type;
    if (status) where.status = status;

    return this.prisma.lifeBooking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createBooking(locationId: string, dto: {
    customerName: string;
    customerPhone: string;
    dateTime?: string | Date;
    type: LifeBookingType;
    notes?: string;
    metadata?: any;
  }) {
    return this.prisma.lifeBooking.create({
      data: {
        locationId,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        dateTime: dto.dateTime ? new Date(dto.dateTime) : null,
        type: dto.type,
        notes: dto.notes,
        metadata: dto.metadata || {},
      },
    });
  }

  async updateBookingStatus(bookingId: string, status: LifeBookingStatus) {
    return this.prisma.lifeBooking.update({
      where: { id: bookingId },
      data: { status },
    });
  }

  // ── STOREFRONT POSTS CRUD ──
  async getPosts(locationId: string) {
    return this.prisma.lifePost.findMany({
      where: { locationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPost(locationId: string, dto: {
    title: string;
    content: string;
    imageUrl?: string;
  }) {
    return this.prisma.lifePost.create({
      data: {
        locationId,
        title: dto.title,
        content: dto.content,
        imageUrl: dto.imageUrl,
      },
    });
  }

  async deletePost(postId: string) {
    return this.prisma.lifePost.delete({
      where: { id: postId },
    });
  }

  // ── STOREFRONT PHOTOS CRUD ──
  async getPhotos(locationId: string) {
    return this.prisma.lifeLocationPhoto.findMany({
      where: { locationId },
      orderBy: { position: 'asc' },
    });
  }

  async addPhoto(locationId: string, dto: {
    url: string;
    caption?: string;
    position?: number;
  }) {
    return this.prisma.lifeLocationPhoto.create({
      data: {
        locationId,
        url: dto.url,
        caption: dto.caption,
        position: dto.position ?? 0,
      },
    });
  }

  async deletePhoto(photoId: string) {
    return this.prisma.lifeLocationPhoto.delete({
      where: { id: photoId },
    });
  }
}
