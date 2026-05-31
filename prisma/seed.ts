import { PrismaClient, TenantTier } from '@prisma/client';

/**
 * Seeds the core schema with the four ecosystem tenants and a sample user.
 * Idempotent: safe to run repeatedly.
 */
const prisma = new PrismaClient();

const TENANTS = [
  { subdomain: 'souq', schemaName: 'tenant_souq', tierLevel: TenantTier.STANDARD },
  { subdomain: 'kitchen', schemaName: 'tenant_kitchen', tierLevel: TenantTier.STANDARD },
  { subdomain: 'tutor', schemaName: 'tenant_tutor', tierLevel: TenantTier.FREE },
  { subdomain: 'timebank', schemaName: 'tenant_timebank', tierLevel: TenantTier.FREE },
];

async function main(): Promise<void> {
  for (const t of TENANTS) {
    await prisma.tenant.upsert({
      where: { subdomain: t.subdomain },
      update: { schemaName: t.schemaName, tierLevel: t.tierLevel, isActive: true },
      create: t,
    });
  }

  await prisma.globalUser.upsert({
    where: { phoneNumber: '+201000000000' },
    update: {},
    create: {
      phoneNumber: '+201000000000',
      isVerified: true,
      // Raw payment handle stored as opaque metadata (Transparent Broker).
      metadata: { instapayHandle: 'demo@instapay', vodafoneCash: '01000000000' },
    },
  });

  // eslint-disable-next-line no-console
  console.log(`Seeded ${TENANTS.length} tenants + 1 sample user.`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
