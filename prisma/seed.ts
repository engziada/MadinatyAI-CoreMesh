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
  { subdomain: 'kanto', schemaName: 'tenant_soukelkanto', tierLevel: TenantTier.STANDARD },
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

  // ── Sample Kitchen businesses ──
  const sampleUser = await prisma.globalUser.findUnique({
    where: { phoneNumber: '+201000000000' },
  });

  if (sampleUser) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO tenant_kitchen."KitchenBusiness"
        (id, "ownerGlobalUserId", slug, name, "isActive", branding, description, "cuisineType", address, phone, "openingHours", "createdAt", "updatedAt")
      VALUES
        (gen_random_uuid(), '${sampleUser.id}', 'ali-kitchen', 'Ali Kitchen', true,
         '{"primaryColor":"#FF6B35","secondaryColor":"#004E89","fontFamily":"Cairo","logoUrl":"/storage/kitchen/ali/logo.png"}'::jsonb,
         'Authentic Egyptian home-cooked meals', 'Egyptian', 'Cairo, Madinaty', '01000000001',
         '{"mon":"9-22","tue":"9-22","wed":"9-22","thu":"9-22","fri":"10-23","sat":"10-23","sun":"closed"}'::jsonb,
         NOW(), NOW())
      ON CONFLICT (slug) DO NOTHING;
    `);

    await prisma.$executeRawUnsafe(`
      INSERT INTO tenant_kitchen."KitchenBusiness"
        (id, "ownerGlobalUserId", slug, name, "isActive", branding, description, "cuisineType", address, phone, "openingHours", "createdAt", "updatedAt")
      VALUES
        (gen_random_uuid(), '${sampleUser.id}', 'sara-sushi', 'Sara Sushi', true,
         '{"primaryColor":"#1B4332","secondaryColor":"#D4A373","fontFamily":"Noto Sans","logoUrl":"/storage/kitchen/sara/logo.png"}'::jsonb,
         'Fresh Asian fusion cuisine', 'Asian', 'Cairo, Madinaty', '01000000002',
         '{"mon":"11-23","tue":"11-23","wed":"11-23","thu":"11-23","fri":"12-00","sat":"12-00","sun":"closed"}'::jsonb,
         NOW(), NOW())
      ON CONFLICT (slug) DO NOTHING;
    `);

    // ── Sample Tutor businesses ──
    await prisma.$executeRawUnsafe(`
      INSERT INTO tenant_tutor."TutorBusiness"
        (id, "ownerGlobalUserId", slug, name, "isActive", branding, description, subjects, qualifications, "hourlyRate", address, phone, availability, "createdAt", "updatedAt")
      VALUES
        (gen_random_uuid(), '${sampleUser.id}', 'ahmed-math', 'Ahmed Math Academy', true,
         '{"primaryColor":"#2196F3","secondaryColor":"#FFC107","fontFamily":"Cairo","logoUrl":"/storage/tutor/ahmed/logo.png"}'::jsonb,
         'Expert math tutoring for all levels', ARRAY['Math','Calculus','Statistics'], 'PhD Mathematics - Cairo University', 150.0,
         'Cairo, Madinaty', '01000000003',
         '{"mon":["9-12","14-18"],"tue":["9-12"],"wed":["9-12","14-18"],"thu":["14-18"],"fri":[],"sat":["10-14"],"sun":[]}'::jsonb,
         NOW(), NOW())
      ON CONFLICT (slug) DO NOTHING;
    `);

    await prisma.$executeRawUnsafe(`
      INSERT INTO tenant_tutor."TutorBusiness"
        (id, "ownerGlobalUserId", slug, name, "isActive", branding, description, subjects, qualifications, "hourlyRate", address, phone, availability, "createdAt", "updatedAt")
      VALUES
        (gen_random_uuid(), '${sampleUser.id}', 'nora-arabic', 'Nora Arabic Center', true,
         '{"primaryColor":"#4CAF50","secondaryColor":"#FF5722","fontFamily":"Amiri","logoUrl":"/storage/tutor/nora/logo.png"}'::jsonb,
         'Arabic language and Quran tutoring', ARRAY['Arabic','Quran','Grammar'], 'MA Arabic Literature - Al-Azhar', 120.0,
         'Cairo, Madinaty', '01000000004',
         '{"mon":["10-14"],"tue":["10-14"],"wed":["10-14"],"thu":["10-14"],"fri":[],"sat":["10-12"],"sun":[]}'::jsonb,
         NOW(), NOW())
      ON CONFLICT (slug) DO NOTHING;
    `);
  }

  // ── Safe Meet Spots (Souk ElKanto) ──
  const safeSpots = [
    { name: 'Madinaty Gate 1 - Visitor Lobby', nameAr: 'بوابة مدينتي 1 - بهو الزوار', district: 'GATE', latitude: 30.10861, longitude: 31.61639 },
    { name: 'Madinaty Club Reception', nameAr: 'استقبال نادي مدينتي', district: 'CLUB', latitude: 30.10250, longitude: 31.62100 },
    { name: 'Open Air Mall - Central Plaza', nameAr: 'أوبن إير مول - الميدان', district: 'MALL', latitude: 30.10550, longitude: 31.62800 },
    { name: 'Craft Zone - Cafe Corner', nameAr: 'كرافت زون - ركن الكافيه', district: 'CRAFT', latitude: 30.10980, longitude: 31.63200 },
    { name: 'District B5 Community Center', nameAr: 'مركز B5 المجتمعي', district: 'B5', latitude: 30.10700, longitude: 31.62500 },
    { name: 'District C1 Mosque Courtyard', nameAr: 'ساحة مسجد C1', district: 'C1', latitude: 30.11000, longitude: 31.61800 },
    { name: 'Sports Complex Entrance', nameAr: 'مدخل المجمع الرياضي', district: 'SPORTS', latitude: 30.10300, longitude: 31.63500 },
    { name: 'Lake View Promenade', nameAr: 'كورنيش ليك فيو', district: 'LAKE', latitude: 30.10600, longitude: 31.63000 },
    { name: 'Main Park North Gate', nameAr: 'بوابة الحديقة الرئيسية الشمالية', district: 'PARK', latitude: 30.11100, longitude: 31.62200 },
    { name: 'Westside Shopping Strip', nameAr: 'شارع التسوق ويستسايد', district: 'WEST', latitude: 30.10400, longitude: 31.61500 },
  ];

  try {
    for (const spot of safeSpots) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO tenant_soukelkanto."safe_meet_spots"
          (id, name, "nameAr", district, latitude, longitude, "isActive", "createdAt")
        VALUES
          (gen_random_uuid(), '${spot.name}', '${spot.nameAr}', '${spot.district}', ${spot.latitude}, ${spot.longitude}, true, NOW())
        ON CONFLICT DO NOTHING;
      `);
    }
    // eslint-disable-next-line no-console
    console.log(`Seeded ${TENANTS.length} tenants + 1 sample user + 2 kitchen businesses + 2 tutor businesses + ${safeSpots.length} safe meet spots.`);
  } catch {
    // eslint-disable-next-line no-console
    console.log(`Seeded ${TENANTS.length} tenants + 1 sample user + 2 kitchen businesses + 2 tutor businesses (safe_meet_spots table missing — skipping).`);
  }
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
