import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@madinatyai/prisma';

const DEMO_PHONE_NUMBER = '01000000000';

type CourierProfileInput = {
  name: string;
  phone?: string;
  vehicleType: string;
  nationalId: string;
  nationalIdPhoto?: string;
  personalPhoto?: string;
};

@Injectable()
export class ExpressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private isDemoExpressEnabled(phoneNumber: string): boolean {
    const devBypass = this.config.get<boolean>('auth.devBypass') ?? false;
    return devBypass && phoneNumber === DEMO_PHONE_NUMBER;
  }

  private async ensureDemoCourier(userId: string) {
    return this.prisma.expressCourier.upsert({
      where: { userId },
      update: {
        name: 'كابتن مدينتي التجريبي',
        phone: DEMO_PHONE_NUMBER,
        vehicleType: 'MOTORCYCLE',
        status: 'APPROVED',
      },
      create: {
        userId,
        name: 'كابتن مدينتي التجريبي',
        phone: DEMO_PHONE_NUMBER,
        vehicleType: 'MOTORCYCLE',
        nationalId: 'DEMO-EXPRESS-0001',
        status: 'APPROVED',
        isOnline: false,
      },
    });
  }

  /**
   * Register a new delivery courier profile.
   */
  async createCourier(userId: string, dto: CourierProfileInput) {
    // Check if the user is already registered as a courier
    const existing = await this.prisma.expressCourier.findUnique({
      where: { userId },
    });

    if (existing) {
      if (existing.status === 'APPROVED') {
        throw new BadRequestException('لا يمكن تعديل البيانات بعد قبول الطلب وتفعيل الحساب.');
      }

      // Check national ID uniqueness (excluding this courier)
      const existingId = await this.prisma.expressCourier.findFirst({
        where: {
          nationalId: dto.nationalId,
          NOT: { userId },
        },
      });
      if (existingId) {
        throw new BadRequestException('رقم البطاقة القومي مسجل بالفعل لكابتن آخر.');
      }

      // Fallback to global user phone if dto.phone is missing or empty
      const user = await this.prisma.globalUser.findUnique({
        where: { id: userId },
        select: { phoneNumber: true },
      });
      const finalPhone = dto.phone || user?.phoneNumber || '';

      // Update details and reset status to PENDING for admin review
      return this.prisma.expressCourier.update({
        where: { userId },
        data: {
          name: dto.name,
          phone: finalPhone,
          vehicleType: dto.vehicleType,
          nationalId: dto.nationalId,
          ...(dto.nationalIdPhoto !== undefined ? { nationalIdPhoto: dto.nationalIdPhoto } : {}),
          ...(dto.personalPhoto !== undefined ? { personalPhoto: dto.personalPhoto } : {}),
          status: 'PENDING',
          isOnline: false,
        },
      });
    }

    // Check national ID uniqueness for new registrations
    const existingId = await this.prisma.expressCourier.findUnique({
      where: { nationalId: dto.nationalId },
    });
    if (existingId) {
      throw new BadRequestException('رقم البطاقة القومي مسجل بالفعل لكابتن آخر.');
    }

    // Fallback to global user phone if dto.phone is missing or empty
    const user = await this.prisma.globalUser.findUnique({
      where: { id: userId },
      select: { phoneNumber: true },
    });
    const finalPhone = dto.phone || user?.phoneNumber || '';

    return this.prisma.expressCourier.create({
      data: {
        userId,
        name: dto.name,
        phone: finalPhone,
        vehicleType: dto.vehicleType,
        nationalId: dto.nationalId,
        nationalIdPhoto: dto.nationalIdPhoto ?? null,
        personalPhoto: dto.personalPhoto ?? null,
        status: 'PENDING',
        isOnline: false,
      },
    });
  }

  /**
   * Update a courier profile before admin approval. Approved profiles are locked.
   */
  async updateCourierProfile(userId: string, dto: CourierProfileInput) {
    const existing = await this.prisma.expressCourier.findUnique({
      where: { userId },
    });
    if (!existing) {
      throw new NotFoundException('حساب الكابتن غير موجود.');
    }

    return this.createCourier(userId, dto);
  }

  /**
   * Get courier profile by the global user ID.
   */
  async getCourierByUserId(userId: string) {
    const courier = await this.prisma.expressCourier.findUnique({
      where: { userId },
    });
    if (courier) return courier;

    const user = await this.prisma.globalUser.findUnique({
      where: { id: userId },
      select: { phoneNumber: true },
    });

    if (user && this.isDemoExpressEnabled(user.phoneNumber)) {
      return this.ensureDemoCourier(userId);
    }

    return null;
  }

  /**
   * Toggle online/offline status for an approved courier.
   */
  async toggleOnline(userId: string, isOnline: boolean) {
    const courier = await this.getCourierByUserId(userId);
    if (!courier) {
      throw new NotFoundException('حساب الكابتن غير موجود.');
    }
    if (courier.status !== 'APPROVED') {
      throw new ForbiddenException('لا يمكن تغيير الحالة قبل تفعيل الحساب من الإدارة.');
    }

    return this.prisma.expressCourier.update({
      where: { id: courier.id },
      data: { isOnline },
    });
  }

  /**
   * List all available delivery requests (PENDING status).
   * Only accessible to online, approved couriers.
   */
  async getAvailableDeliveries(userId: string) {
    const courier = await this.getCourierByUserId(userId);
    if (!courier) {
      throw new NotFoundException('حساب الكابتن غير موجود.');
    }
    if (courier.status !== 'APPROVED') {
      throw new ForbiddenException('الحساب غير مفعل.');
    }
    if (!courier.isOnline) {
      throw new BadRequestException('الرجاء تبديل الحالة إلى "نشط ومتصل" لاستقبال الطلبات.');
    }

    return this.prisma.expressDeliveryRequest.findMany({
      where: {
        status: 'PENDING',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get active delivery request assigned to this courier (ACCEPTED or PICKED_UP).
   */
  async getActiveDelivery(userId: string) {
    const courier = await this.getCourierByUserId(userId);
    if (!courier) {
      throw new NotFoundException('حساب الكابتن غير موجود.');
    }

    return this.prisma.expressDeliveryRequest.findFirst({
      where: {
        courierId: courier.id,
        status: {
          in: ['ACCEPTED', 'PICKED_UP'],
        },
      },
    });
  }

  /**
   * Courier accepts a delivery request.
   */
  async acceptDelivery(userId: string, deliveryId: string) {
    const courier = await this.getCourierByUserId(userId);
    if (!courier) {
      throw new NotFoundException('حساب الكابتن غير موجود.');
    }
    if (courier.status !== 'APPROVED') {
      throw new ForbiddenException('الحساب غير مفعل.');
    }
    if (!courier.isOnline) {
      throw new BadRequestException('الرجاء التواجد أونلاين أولاً.');
    }

    // Check if the courier already has an active delivery
    const active = await this.getActiveDelivery(userId);
    if (active) {
      throw new BadRequestException('لديك طلب نشط بالفعل. يجب إكماله أولاً قبل قبول طلب جديد.');
    }

    // Load delivery request
    const delivery = await this.prisma.expressDeliveryRequest.findUnique({
      where: { id: deliveryId },
    });
    if (!delivery) {
      throw new NotFoundException('طلب التوصيل غير موجود.');
    }
    if (delivery.status !== 'PENDING') {
      throw new BadRequestException('الطلب مقبول بالفعل من قبل كابتن آخر أو تم إلغاؤه.');
    }

    return this.prisma.expressDeliveryRequest.update({
      where: { id: deliveryId },
      data: {
        status: 'ACCEPTED',
        courierId: courier.id,
        courierName: courier.name,
        courierPhone: courier.phone,
        acceptedAt: new Date(),
      },
    });
  }

  /**
   * Courier marks the request as picked up.
   */
  async pickupDelivery(userId: string, deliveryId: string) {
    const courier = await this.getCourierByUserId(userId);
    if (!courier) {
      throw new NotFoundException('حساب الكابتن غير موجود.');
    }

    const delivery = await this.prisma.expressDeliveryRequest.findUnique({
      where: { id: deliveryId },
    });
    if (!delivery) {
      throw new NotFoundException('طلب التوصيل غير موجود.');
    }
    if (delivery.courierId !== courier.id) {
      throw new ForbiddenException('هذا الطلب غير مسند إليك.');
    }
    if (delivery.status !== 'ACCEPTED') {
      throw new BadRequestException('حالة الطلب غير صالحة للاستلام.');
    }

    return this.prisma.expressDeliveryRequest.update({
      where: { id: deliveryId },
      data: {
        status: 'PICKED_UP',
        pickedUpAt: new Date(),
      },
    });
  }

  /**
   * Courier marks the request as delivered.
   */
  async completeDelivery(userId: string, deliveryId: string) {
    const courier = await this.getCourierByUserId(userId);
    if (!courier) {
      throw new NotFoundException('حساب الكابتن غير موجود.');
    }

    const delivery = await this.prisma.expressDeliveryRequest.findUnique({
      where: { id: deliveryId },
    });
    if (!delivery) {
      throw new NotFoundException('طلب التوصيل غير موجود.');
    }
    if (delivery.courierId !== courier.id) {
      throw new ForbiddenException('هذا الطلب غير مسند إليك.');
    }
    if (delivery.status !== 'PICKED_UP') {
      throw new BadRequestException('يجب استلام الطلب من المطبخ أولاً قبل تعليمه كمكتمل.');
    }

    return this.prisma.expressDeliveryRequest.update({
      where: { id: deliveryId },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date(),
      },
    });
  }

  /**
   * Kitchen creates a new delivery request.
   */
  async createDeliveryRequest(kitchenUserId: string, dto: { deliveryPoint: string; recipientName: string; recipientPhone: string; notes?: string }) {
    // Resolve the kitchen business for this user
    const kitchen = await this.prisma.kitchenBusiness.findFirst({
      where: { ownerGlobalUserId: kitchenUserId },
    });
    if (!kitchen) {
      throw new NotFoundException('لم يتم العثور على مطبخ مسجل لهذا الحساب.');
    }
    if (kitchen.status !== 'APPROVED') {
      throw new ForbiddenException('حساب المطبخ غير مفعل أو معلق.');
    }

    return this.prisma.expressDeliveryRequest.create({
      data: {
        kitchenBusinessId: kitchen.id,
        kitchenName: kitchen.name,
        deliveryPoint: dto.deliveryPoint,
        recipientName: dto.recipientName,
        recipientPhone: dto.recipientPhone,
        notes: dto.notes,
        status: 'PENDING',
      },
    });
  }

  /**
   * Get all delivery requests created by a kitchen.
   */
  async getDeliveriesByKitchen(kitchenUserId: string) {
    const kitchen = await this.prisma.kitchenBusiness.findFirst({
      where: { ownerGlobalUserId: kitchenUserId },
    });
    if (!kitchen) {
      throw new NotFoundException('لم يتم العثور على مطبخ مسجل لهذا الحساب.');
    }

    return this.prisma.expressDeliveryRequest.findMany({
      where: { kitchenBusinessId: kitchen.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get single delivery request by ID.
   */
  async getDeliveryRequestById(deliveryId: string) {
    return this.prisma.expressDeliveryRequest.findUnique({
      where: { id: deliveryId },
    });
  }
}
