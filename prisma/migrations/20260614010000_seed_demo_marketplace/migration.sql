-- ───────────────────────────────────────────────────────────────────────────
-- Demo marketplace seed for closed-beta testing.
-- ───────────────────────────────────────────────────────────────────────────
-- Inserts 3 sample sellers (with complete profile so they pass the listing
-- gate) and 14 realistic listings across categories, with 1-3 product-related
-- photos each (loremflickr keyword search, deterministic via ?lock=).
--
-- Idempotency: the entire block only runs if seller +201000099001 doesn't
-- already exist, so re-running the migration is safe and doesn't duplicate.
-- ───────────────────────────────────────────────────────────────────────────
DO $seed$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM core."GlobalUser"
    WHERE "phoneNumber" = '+201000099001'
  ) THEN

    -- ── 3 sample sellers (profile-complete so they bypass the loose gate) ──
    INSERT INTO core."GlobalUser"
      (id, "phoneNumber", "isVerified", "trustScore", role, metadata, "createdAt", "updatedAt")
    VALUES
      ('11111111-1111-1111-1111-111111111111', '+201000099001', true, 100, 'USER',
       '{"fullName":"Sara Mohamed","gender":"FEMALE","birthdate":"1990-05-15","madinatyGroup":"B5","buildingNo":"12","aptNo":"3"}'::jsonb,
       NOW(), NOW()),
      ('22222222-2222-2222-2222-222222222222', '+201000099002', true, 100, 'USER',
       '{"fullName":"Ahmed Ali","gender":"MALE","birthdate":"1985-08-22","madinatyGroup":"B3","buildingNo":"45","aptNo":"7"}'::jsonb,
       NOW(), NOW()),
      ('33333333-3333-3333-3333-333333333333', '+201000099003', true, 100, 'USER',
       '{"fullName":"Layla Hassan","gender":"FEMALE","birthdate":"1992-11-30","madinatyGroup":"B7","buildingNo":"3","aptNo":"21"}'::jsonb,
       NOW(), NOW());

    -- ── 14 listings ──
    INSERT INTO tenant_soukelkanto."SoukListing"
      (id, "sellerId", title, description, category, condition, "askingPrice", district, status, "createdAt", "updatedAt")
    VALUES
      ('aaaa0001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
       'Sony PlayStation 5 — Like new with 2 controllers',
       'Original PS5 disc edition with 2 DualSense controllers. Used very lightly, comes with the original box, all cables, and the warranty receipt. No scratches.',
       'ELECTRONICS', 'LIKE_NEW', 22000, 'B5', 'ACTIVE',
       NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

      ('aaaa0002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222',
       'Apple MacBook Air M2 13" — Space Gray',
       'M2 chip, 8GB RAM, 256GB SSD. Bought from Apple Egypt 8 months ago. Battery cycles under 60. Comes with original charger and box.',
       'ELECTRONICS', 'GOOD', 35000, 'B1', 'ACTIVE',
       NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),

      ('aaaa0003-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111',
       'IKEA MALM 6-Drawer Dresser — White',
       'Used for 2 years, no scratches or stains. Smooth-running drawers, all hardware intact. Self-pickup B5 — too heavy to deliver.',
       'FURNITURE', 'GOOD', 4500, 'B5', 'ACTIVE',
       NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),

      ('aaaa0004-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333',
       'Cosatto baby stroller — practically new',
       'Used for 3 months only — baby outgrew it. Lightweight aluminum frame, reclining seat, raincover and footmuff included. Cleaned thoroughly.',
       'BABY_MATERNITY', 'LIKE_NEW', 3200, 'B7', 'ACTIVE',
       NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),

      ('aaaa0005-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111',
       'Samsung 55" 4K Smart TV — UE55AU7100',
       '2 years old, perfect picture. Comes with Samsung remote and wall mount bracket. Tizen OS with Netflix/Disney+/Shahid apps.',
       'ELECTRONICS', 'GOOD', 8500, 'B5', 'ACTIVE',
       NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours'),

      ('aaaa0006-0000-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222',
       'Nike Air Max 270 sneakers — Size 42, original',
       'Brand new with tags. Bought from Nike Cairo Festival Mall but wrong size. White and black colorway.',
       'FASHION', 'NEW_WITH_TAGS', 2800, 'B3', 'ACTIVE',
       NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours'),

      ('aaaa0007-0000-0000-0000-000000000007', '33333333-3333-3333-3333-333333333333',
       'Brio wooden train set — 60+ pieces',
       'Classic Brio train set with tracks, bridges, engines, and accessories. My kids grew out of it. All pieces accounted for. Stored in original wooden box.',
       'KIDS_TOYS', 'GOOD', 850, 'B7', 'ACTIVE',
       NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),

      ('aaaa0008-0000-0000-0000-000000000008', '22222222-2222-2222-2222-222222222222',
       'iPhone 14 Pro Max — 256GB Deep Purple',
       'Battery health 91%. Always in a case + screen protector — pristine condition. Sold with original box, cable, and a 6-month-old AppleCare+ remainder.',
       'MOBILE_TABLETS', 'LIKE_NEW', 38000, 'B3', 'ACTIVE',
       NOW() - INTERVAL '8 hours', NOW() - INTERVAL '8 hours'),

      ('aaaa0009-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111',
       'Solid oak dining table + 4 chairs',
       'Beautiful solid oak round dining table (110cm diameter) with 4 matching chairs. From an estate sale. Minor surface wear, structurally perfect.',
       'FURNITURE', 'GOOD', 6000, 'B5', 'ACTIVE',
       NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),

      ('aaaa0010-0000-0000-0000-000000000010', '33333333-3333-3333-3333-333333333333',
       'Bosch washing machine 8kg — Series 4',
       '4 years old, works perfectly. Selling because moving to a bigger unit. EcoSilence motor, 1400 RPM. Comes with original manual.',
       'APPLIANCES', 'GOOD', 7500, 'B7', 'ACTIVE',
       NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

      ('aaaa0011-0000-0000-0000-000000000011', '22222222-2222-2222-2222-222222222222',
       'Yoga mat + dumbbells home gym bundle',
       'TPE yoga mat (6mm) + pair of 5kg neoprene-coated dumbbells + resistance bands set. Lightly used, all in great condition.',
       'SPORTS_OUTDOOR', 'GOOD', 950, 'B3', 'ACTIVE',
       NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),

      ('aaaa0012-0000-0000-0000-000000000012', '33333333-3333-3333-3333-333333333333',
       'Kindle Paperwhite 11th gen + 50+ classic books',
       '6 months old, screen has zero scratches. Comes with a leather cover. Pre-loaded with 50+ public-domain classics (Austen, Dickens, etc.).',
       'BOOKS_MEDIA', 'LIKE_NEW', 3500, 'B7', 'ACTIVE',
       NOW() - INTERVAL '18 hours', NOW() - INTERVAL '18 hours'),

      ('aaaa0013-0000-0000-0000-000000000013', '11111111-1111-1111-1111-111111111111',
       'Toddler bicycle (12 inch) — used 3 months',
       'Pink toddler bike with training wheels. My daughter outgrew it after one summer. Tires still grippy, brakes work perfectly.',
       'KIDS_GEAR', 'LIKE_NEW', 1200, 'B5', 'ACTIVE',
       NOW() - INTERVAL '10 hours', NOW() - INTERVAL '10 hours'),

      ('aaaa0014-0000-0000-0000-000000000014', '22222222-2222-2222-2222-222222222222',
       'Vintage Leica M3 film camera + 50mm Summicron',
       'Working 1955 Leica M3 with original 50mm f/2 Summicron lens. CLA done in 2024. For collectors and film enthusiasts only.',
       'VINTAGE_COLLECTIBLES', 'GOOD', 18000, 'B3', 'ACTIVE',
       NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days');

    -- ── photos (1-3 per listing, keyword-matched via loremflickr) ──
    INSERT INTO tenant_soukelkanto."SoukListingPhoto"
      (id, "listingId", "r2Key", url, width, height, bytes, position, "uploadedAt")
    VALUES
      -- 1. PlayStation 5 — 2 photos
      (gen_random_uuid(), 'aaaa0001-0000-0000-0000-000000000001', 'seed/ps5/0.jpg',
       'https://loremflickr.com/640/480/playstation%205?lock=101', 640, 480, 50000, 0, NOW()),
      (gen_random_uuid(), 'aaaa0001-0000-0000-0000-000000000001', 'seed/ps5/1.jpg',
       'https://loremflickr.com/640/480/dualsense%20controller?lock=102', 640, 480, 50000, 1, NOW()),

      -- 2. MacBook Air M2 — 3 photos
      (gen_random_uuid(), 'aaaa0002-0000-0000-0000-000000000002', 'seed/macbook/0.jpg',
       'https://loremflickr.com/640/480/macbook%20air?lock=201', 640, 480, 50000, 0, NOW()),
      (gen_random_uuid(), 'aaaa0002-0000-0000-0000-000000000002', 'seed/macbook/1.jpg',
       'https://loremflickr.com/640/480/laptop%20keyboard?lock=202', 640, 480, 50000, 1, NOW()),
      (gen_random_uuid(), 'aaaa0002-0000-0000-0000-000000000002', 'seed/macbook/2.jpg',
       'https://loremflickr.com/640/480/apple%20laptop%20screen?lock=203', 640, 480, 50000, 2, NOW()),

      -- 3. IKEA dresser — 2 photos
      (gen_random_uuid(), 'aaaa0003-0000-0000-0000-000000000003', 'seed/ikea-malm/0.jpg',
       'https://loremflickr.com/640/480/white%20dresser%20drawers?lock=301', 640, 480, 50000, 0, NOW()),
      (gen_random_uuid(), 'aaaa0003-0000-0000-0000-000000000003', 'seed/ikea-malm/1.jpg',
       'https://loremflickr.com/640/480/bedroom%20furniture?lock=302', 640, 480, 50000, 1, NOW()),

      -- 4. Cosatto stroller — 1 photo
      (gen_random_uuid(), 'aaaa0004-0000-0000-0000-000000000004', 'seed/stroller/0.jpg',
       'https://loremflickr.com/640/480/baby%20stroller?lock=401', 640, 480, 50000, 0, NOW()),

      -- 5. Samsung TV — 2 photos
      (gen_random_uuid(), 'aaaa0005-0000-0000-0000-000000000005', 'seed/samsung-tv/0.jpg',
       'https://loremflickr.com/640/480/samsung%20tv?lock=501', 640, 480, 50000, 0, NOW()),
      (gen_random_uuid(), 'aaaa0005-0000-0000-0000-000000000005', 'seed/samsung-tv/1.jpg',
       'https://loremflickr.com/640/480/4k%20smart%20tv?lock=502', 640, 480, 50000, 1, NOW()),

      -- 6. Nike sneakers — 1 photo
      (gen_random_uuid(), 'aaaa0006-0000-0000-0000-000000000006', 'seed/nike-airmax/0.jpg',
       'https://loremflickr.com/640/480/nike%20air%20max?lock=601', 640, 480, 50000, 0, NOW()),

      -- 7. Wooden train set — 2 photos
      (gen_random_uuid(), 'aaaa0007-0000-0000-0000-000000000007', 'seed/wooden-train/0.jpg',
       'https://loremflickr.com/640/480/wooden%20train%20toy?lock=701', 640, 480, 50000, 0, NOW()),
      (gen_random_uuid(), 'aaaa0007-0000-0000-0000-000000000007', 'seed/wooden-train/1.jpg',
       'https://loremflickr.com/640/480/train%20tracks%20toy?lock=702', 640, 480, 50000, 1, NOW()),

      -- 8. iPhone 14 Pro Max — 3 photos
      (gen_random_uuid(), 'aaaa0008-0000-0000-0000-000000000008', 'seed/iphone/0.jpg',
       'https://loremflickr.com/640/480/iphone%2014%20pro?lock=801', 640, 480, 50000, 0, NOW()),
      (gen_random_uuid(), 'aaaa0008-0000-0000-0000-000000000008', 'seed/iphone/1.jpg',
       'https://loremflickr.com/640/480/iphone%20back%20camera?lock=802', 640, 480, 50000, 1, NOW()),
      (gen_random_uuid(), 'aaaa0008-0000-0000-0000-000000000008', 'seed/iphone/2.jpg',
       'https://loremflickr.com/640/480/iphone%20box?lock=803', 640, 480, 50000, 2, NOW()),

      -- 9. Dining table + chairs — 2 photos
      (gen_random_uuid(), 'aaaa0009-0000-0000-0000-000000000009', 'seed/dining/0.jpg',
       'https://loremflickr.com/640/480/oak%20dining%20table?lock=901', 640, 480, 50000, 0, NOW()),
      (gen_random_uuid(), 'aaaa0009-0000-0000-0000-000000000009', 'seed/dining/1.jpg',
       'https://loremflickr.com/640/480/wooden%20chair?lock=902', 640, 480, 50000, 1, NOW()),

      -- 10. Bosch washing machine — 1 photo
      (gen_random_uuid(), 'aaaa0010-0000-0000-0000-000000000010', 'seed/bosch-wm/0.jpg',
       'https://loremflickr.com/640/480/bosch%20washing%20machine?lock=1001', 640, 480, 50000, 0, NOW()),

      -- 11. Yoga + dumbbells bundle — 1 photo
      (gen_random_uuid(), 'aaaa0011-0000-0000-0000-000000000011', 'seed/yoga-bundle/0.jpg',
       'https://loremflickr.com/640/480/yoga%20mat%20dumbbells?lock=1101', 640, 480, 50000, 0, NOW()),

      -- 12. Kindle Paperwhite — 2 photos
      (gen_random_uuid(), 'aaaa0012-0000-0000-0000-000000000012', 'seed/kindle/0.jpg',
       'https://loremflickr.com/640/480/kindle%20paperwhite?lock=1201', 640, 480, 50000, 0, NOW()),
      (gen_random_uuid(), 'aaaa0012-0000-0000-0000-000000000012', 'seed/kindle/1.jpg',
       'https://loremflickr.com/640/480/ebook%20reader?lock=1202', 640, 480, 50000, 1, NOW()),

      -- 13. Toddler bicycle — 1 photo
      (gen_random_uuid(), 'aaaa0013-0000-0000-0000-000000000013', 'seed/toddler-bike/0.jpg',
       'https://loremflickr.com/640/480/toddler%20bicycle?lock=1301', 640, 480, 50000, 0, NOW()),

      -- 14. Leica M3 — 3 photos
      (gen_random_uuid(), 'aaaa0014-0000-0000-0000-000000000014', 'seed/leica/0.jpg',
       'https://loremflickr.com/640/480/leica%20m3%20camera?lock=1401', 640, 480, 50000, 0, NOW()),
      (gen_random_uuid(), 'aaaa0014-0000-0000-0000-000000000014', 'seed/leica/1.jpg',
       'https://loremflickr.com/640/480/vintage%20film%20camera?lock=1402', 640, 480, 50000, 1, NOW()),
      (gen_random_uuid(), 'aaaa0014-0000-0000-0000-000000000014', 'seed/leica/2.jpg',
       'https://loremflickr.com/640/480/camera%20lens?lock=1403', 640, 480, 50000, 2, NOW());

  END IF;
END $seed$;
