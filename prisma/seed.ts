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
    where: { phoneNumber: '01000000000' },
    update: {},
    create: {
      phoneNumber: '01000000000',
      isVerified: true,
      // Raw payment handle stored as opaque metadata (Transparent Broker).
      metadata: { instapayHandle: 'demo@instapay', vodafoneCash: '01000000000' },
    },
  });

  // ── Sample Kitchen businesses ──
  const sampleUser = await prisma.globalUser.findUnique({
    where: { phoneNumber: '01000000000' },
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

    // ── Sample Souk ElKanto listings & offers ──
    try {
      // Check if our specific seed titles already exist to avoid duplicates
      const existingRes = await prisma.$queryRawUnsafe<{ count: bigint }[]>(`
        SELECT COUNT(*) as count FROM tenant_soukelkanto.listings WHERE title = 'كنبة جلد بني مستعملة'
      `);
      const existing = Number(existingRes[0]?.count ?? 0);

      if (existing === 0) {
        await prisma.$executeRawUnsafe(`
          INSERT INTO tenant_soukelkanto.listings
            (id, "sellerId", title, description, category, condition, "askingPrice", currency, district, status, "viewCount", "favoriteCount", "createdAt", "updatedAt")
          VALUES
            (gen_random_uuid(), '${sampleUser.id}', 'كنبة جلد بني مستعملة', 'كنبة جلد طبيعي 3 مقاعد، حالة ممتازة، استخدام سنة واحدة فقط.', 'FURNITURE', 'LIKE_NEW', 4500, 'EGP', 'B5', 'ACTIVE', 12, 3, NOW(), NOW()),
            (gen_random_uuid(), '${sampleUser.id}', 'آيفون 13 برو 256 جيجا', 'آيفون 13 برو، بطارية 92%، مع الشاحن الأصلي والكرتونة.', 'MOBILE_TABLETS', 'GOOD', 18500, 'EGP', 'C1', 'ACTIVE', 45, 8, NOW(), NOW()),
            (gen_random_uuid(), '${sampleUser.id}', 'دراجة هوائية للأطفال', 'دراجة مقاس 16، مناسبة لعمر 4-7 سنوات، مع كرسي إضافي خلفي.', 'SPORTS_OUTDOOR', 'FAIR', 1200, 'EGP', 'GATE', 'ACTIVE', 8, 1, NOW(), NOW()),
            (gen_random_uuid(), '${sampleUser.id}', 'طقم أواني طهي ستانلس', 'طقم 12 قطعة ستانلس ستيل، استخدام خفيف، نظيف جداً.', 'KITCHEN_DINING', 'LIKE_NEW', 2800, 'EGP', 'MALL', 'ACTIVE', 5, 0, NOW(), NOW()),
            (gen_random_uuid(), '${sampleUser.id}', 'فستان سهرة أسود', 'فستان مقاس M، لبسة مرة واحدة فقط، من محل محلي.', 'FASHION', 'NEW_WITH_TAGS', 1500, 'EGP', 'CLUB', 'ACTIVE', 22, 4, NOW(), NOW()),
            (gen_random_uuid(), '${sampleUser.id}', 'مكتبة خشبية زان', 'مكتبة 4 أدراج، خشب زان صلب، عمر 3 سنوات، بحالة جيدة.', 'FURNITURE', 'GOOD', 3200, 'EGP', 'WEST', 'ACTIVE', 18, 2, NOW(), NOW()),
            (gen_random_uuid(), '${sampleUser.id}', 'سماعات بلوتوث JBL', 'سماعات JBL Flip 5، بطارية 8 ساعات، مقاومة للماء.', 'ELECTRONICS', 'LIKE_NEW', 2100, 'EGP', 'PARK', 'ACTIVE', 33, 6, NOW(), NOW()),
            (gen_random_uuid(), '${sampleUser.id}', 'سرير أطفال متحرك', 'سرير أطفال مع مرتبة، قابل للطي، مناسب لحديثي الولادة.', 'BABY_MATERNITY', 'GOOD', 3500, 'EGP', 'LAKE', 'ACTIVE', 7, 1, NOW(), NOW())
        `);

        // Add placeholder photos for first 3 listings
        const firstListings = await prisma.$queryRawUnsafe<{ id: string }[]>(`
          SELECT id FROM tenant_soukelkanto.listings ORDER BY "createdAt" DESC LIMIT 3
        `);

        for (const listing of firstListings) {
          await prisma.$executeRawUnsafe(`
            INSERT INTO tenant_soukelkanto.listing_photos
              (id, "listingId", "r2Key", url, width, height, bytes, position, "uploadedAt")
            VALUES
              (gen_random_uuid(), '${listing.id}', 'demo/${listing.id}/1.jpg', 'https://placehold.co/400x300/e8e8e8/666?text=Photo', 400, 300, 45000, 0, NOW())
          `);
        }

        // Add 2 offers on the first listing
        if (firstListings.length > 0) {
          const lid = firstListings[0].id;
          await prisma.$executeRawUnsafe(`
            INSERT INTO tenant_soukelkanto.offers
              (id, "listingId", "buyerId", "sellerId", amount, note, status, "createdAt", "updatedAt")
            VALUES
              (gen_random_uuid(), '${lid}', '${sampleUser.id}', '${sampleUser.id}', 4000, 'ممكن 4000؟', 'PENDING', NOW(), NOW()),
              (gen_random_uuid(), '${lid}', '${sampleUser.id}', '${sampleUser.id}', 4200, 'أقدر أدفع 4200 كاش', 'ACCEPTED', NOW(), NOW())
          `);
        }

        console.log('Seeded 8 Souk listings + photos + 2 offers.');
      } else {
        console.log('Souk listings already seeded — skipping.');
      }
    } catch (e) {
      console.log('Souk listings seed error:', (e as Error).message);
    }
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
