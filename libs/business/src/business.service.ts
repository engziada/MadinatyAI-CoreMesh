import { Injectable } from '@nestjs/common';
import { PrismaService } from '@madinatyai/prisma';
import { BusinessNotFoundException, DuplicateSlugException } from './exceptions';
import type { CreateBusinessDto, UpdateBrandingDto, UpdateBusinessProfileDto } from './dto';

/** Supported tenant schemas that have a Business sub-model. */
const BUSINESS_SCHEMAS = {
  kitchen: { table: 'kitchenBusiness' },
  tutor: { table: 'tutorBusiness' },
} as const;

type BusinessTenant = keyof typeof BUSINESS_SCHEMAS;

// Prisma TransactionClient doesn't expose tenant-schema models on its type,
// so we cast through `any` for dynamic model access.
type Delegate = any; // eslint-disable-line @typescript-eslint/no-explicit-any

function getDelegate(tx: any, table: string): Delegate {
  // eslint-disable-line @typescript-eslint/no-explicit-any
  return tx[table];
}

/**
 * Service for managing sub-tenant businesses (Kitchen restaurants, Tutor centres).
 * All operations are scoped to the resolved tenant schema via PrismaService.withTenantSchema().
 */
@Injectable()
export class BusinessService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Register a new business within the current tenant.
   *
   * R-11 F-06: `ownerGlobalUserId` is now an explicit argument bound from the
   * JWT by the controller — it is no longer accepted in the request body.
   */
  async createBusiness(
    tenant: BusinessTenant,
    ownerGlobalUserId: string,
    dto: CreateBusinessDto,
  ): Promise<Record<string, unknown>> {
    const config = BUSINESS_SCHEMAS[tenant];
    if (!config) throw new Error(`Tenant ${tenant} does not support business sub-tenancy`);

    const schemaName = `tenant_${tenant}`;

    // Check slug uniqueness
    const existing = await this.prisma.withTenantSchema(schemaName, (tx) =>
      getDelegate(tx, config.table).findUnique({ where: { slug: dto.slug } }),
    );
    if (existing) throw new DuplicateSlugException(dto.slug);

    const data: Record<string, unknown> = {
      ownerGlobalUserId,
      slug: dto.slug,
      name: dto.name,
      branding: dto.branding ?? {},
      description: dto.description,
      address: dto.address,
      phone: dto.phone,
    };

    // Kitchen-specific fields
    if (tenant === 'kitchen') {
      data.cuisineType = dto.cuisineType;
    }

    // Tutor-specific fields
    if (tenant === 'tutor') {
      data.qualifications = dto.qualifications;
      if (dto.subjects) {
        data.subjects = JSON.parse(dto.subjects);
      }
    }

    return this.prisma.withTenantSchema(schemaName, (tx) =>
      getDelegate(tx, config.table).create({ data }),
    ) as Promise<Record<string, unknown>>;
  }

  /** Get a business by its slug. */
  async getBusiness(tenant: BusinessTenant, slug: string): Promise<Record<string, unknown>> {
    const config = BUSINESS_SCHEMAS[tenant];
    if (!config) throw new Error(`Tenant ${tenant} does not support business sub-tenancy`);

    const schemaName = `tenant_${tenant}`;
    const business = await this.prisma.withTenantSchema(schemaName, (tx) =>
      getDelegate(tx, config.table).findUnique({ where: { slug } }),
    );
    if (!business) throw new BusinessNotFoundException(slug);
    return business as Record<string, unknown>;
  }

  /**
   * R-11 F-06 — Load a business by id (raw, no throw).
   * Used by the controller's ownership check on mutate endpoints. Returns the
   * row including `ownerGlobalUserId`, or null if not found.
   */
  async loadById(
    tenant: BusinessTenant,
    businessId: string,
  ): Promise<{ id: string; ownerGlobalUserId: string } | null> {
    const config = BUSINESS_SCHEMAS[tenant];
    if (!config) throw new Error(`Tenant ${tenant} does not support business sub-tenancy`);

    const schemaName = `tenant_${tenant}`;
    const row = (await this.prisma.withTenantSchema(schemaName, (tx) =>
      getDelegate(tx, config.table).findUnique({
        where: { id: businessId },
        select: { id: true, ownerGlobalUserId: true },
      }),
    )) as { id: string; ownerGlobalUserId: string } | null;
    return row;
  }

  /** List all active businesses in the tenant. */
  async listBusinesses(
    tenant: BusinessTenant,
    activeOnly = true,
  ): Promise<Record<string, unknown>[]> {
    const config = BUSINESS_SCHEMAS[tenant];
    if (!config) throw new Error(`Tenant ${tenant} does not support business sub-tenancy`);

    const schemaName = `tenant_${tenant}`;
    const where = activeOnly ? { isActive: true } : {};
    return this.prisma.withTenantSchema(schemaName, (tx) =>
      getDelegate(tx, config.table).findMany({ where, orderBy: { createdAt: 'desc' } }),
    ) as Promise<Record<string, unknown>[]>;
  }

  /** Update a business's visual identity (logo, colors, fonts, etc.). */
  async updateBranding(
    tenant: BusinessTenant,
    businessId: string,
    dto: UpdateBrandingDto,
  ): Promise<Record<string, unknown>> {
    const config = BUSINESS_SCHEMAS[tenant];
    if (!config) throw new Error(`Tenant ${tenant} does not support business sub-tenancy`);

    const schemaName = `tenant_${tenant}`;
    const business = await this.prisma.withTenantSchema(schemaName, (tx) =>
      getDelegate(tx, config.table).update({
        where: { id: businessId },
        data: { branding: dto.branding },
      }),
    );
    if (!business) throw new BusinessNotFoundException(businessId);
    return business as Record<string, unknown>;
  }

  /** Update a business's profile information. */
  async updateProfile(
    tenant: BusinessTenant,
    businessId: string,
    dto: UpdateBusinessProfileDto,
  ): Promise<Record<string, unknown>> {
    const config = BUSINESS_SCHEMAS[tenant];
    if (!config) throw new Error(`Tenant ${tenant} does not support business sub-tenancy`);

    const schemaName = `tenant_${tenant}`;
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.phone !== undefined) data.phone = dto.phone;

    if (tenant === 'kitchen' && dto.cuisineType !== undefined) {
      data.cuisineType = dto.cuisineType;
    }
    if (tenant === 'tutor') {
      if (dto.qualifications !== undefined) data.qualifications = dto.qualifications;
      if (dto.subjects !== undefined) data.subjects = JSON.parse(dto.subjects);
    }

    const business = await this.prisma.withTenantSchema(schemaName, (tx) =>
      getDelegate(tx, config.table).update({
        where: { id: businessId },
        data,
      }),
    );
    if (!business) throw new BusinessNotFoundException(businessId);
    return business as Record<string, unknown>;
  }

  /** Soft-delete a business by setting isActive = false. */
  async deactivateBusiness(
    tenant: BusinessTenant,
    businessId: string,
  ): Promise<Record<string, unknown>> {
    const config = BUSINESS_SCHEMAS[tenant];
    if (!config) throw new Error(`Tenant ${tenant} does not support business sub-tenancy`);

    const schemaName = `tenant_${tenant}`;
    const business = await this.prisma.withTenantSchema(schemaName, (tx) =>
      getDelegate(tx, config.table).update({
        where: { id: businessId },
        data: { isActive: false },
      }),
    );
    if (!business) throw new BusinessNotFoundException(businessId);
    return business as Record<string, unknown>;
  }
}
