# Post-Merge Code Review Report

**Project:** MadinatyAI CoreMesh  
**Date:** July 26, 2026  
**Reviewer:** Automated + Manual Review  
**Scope:** Post-merge state after integrating `feat/admin-life-express` branch into `main`  
**Status:** Action Required  

---

## Executive Summary

The merge successfully integrated the Admin Portal, Madinty Life, and Madinty Express modules into the CoreMesh platform. The codebase is functional and the dev server runs correctly. However, this review identified **5 security issues**, **7 structural concerns**, and **3 minor improvements** that should be addressed by the development team in priority order.

---

## 1. Security Issues

### S-01: `getDeliveryRequestById` has no authorization check

**Severity:** Critical  
**File:** `apps/core-hub/src/modules/express/express.service.ts:379-384`  
**Status:** Open  

The method returns any delivery request by ID without verifying the caller's identity:

```typescript
async getDeliveryRequestById(deliveryId: string) {
  return this.prisma.expressDeliveryRequest.findUnique({
    where: { id: deliveryId },
  });
}
```

Any authenticated user can fetch any delivery request by guessing/enumerating UUIDs. This exposes:
- Kitchen business names
- Recipient names and phone numbers
- Delivery addresses (inside Madinaty)
- Courier names and phone numbers

**Required Fix:** Verify the caller is either:
1. The owner of the kitchen that created the request, OR
2. The courier assigned to the request, OR
3. A platform admin

Accept the `userId` parameter and validate ownership before returning data.

---

### S-02: Token action endpoint lacks amount and balance validation

**Severity:** High  
**File:** `apps/core-hub/src/modules/admin/admin.service.ts:742-790`  
**Status:** Open  

The `executeTokenAction` method applies `Math.abs()` to the amount but does not:
1. Validate the amount is within a reasonable range (e.g., max 1,000,000 tokens per operation)
2. Check that a deduct operation won't push the wallet balance below zero
3. Log or require a confirmation step for large operations

A compromised admin token or a bug could rapidly drain kitchen wallets or credit absurd amounts.

**Required Fix:**
- Add maximum amount validation (e.g., `if (amount > 100000) throw BadRequestException`)
- For deduct operations: `if (wallet.businessTokens - amount < 0) throw BadRequestException('Insufficient balance')`
- Consider adding an audit log entry with the admin's userId

---

### S-03: Admin Portal stores JWT in `localStorage`

**Severity:** High  
**File:** `apps/core-hub/src/modules/admin/admin-portal.html.ts:2095`  
**Status:** Open  

The admin portal stores the authentication token in `localStorage`:

```javascript
let token = localStorage.getItem('admin_token') || '';
```

The token is then passed as a `Bearer` header on every API call. The platform already supports `HttpOnly` cookies (`cookieParser` is mounted in `main.ts:75`, the `madinaty.access` cookie is referenced). If the admin portal page has any XSS vulnerability — which is likely given the 4,684-line inline HTML with external CDN scripts and no CSP — the token is trivially stealable via `document.cookie` or `localStorage.getItem`.

**Required Fix:**
- Migrate admin portal authentication to use `HttpOnly` cookies (the infrastructure already exists)
- Remove `localStorage` token storage
- Add `SameSite=Strict` and `Secure` flags to the cookie

---

### S-04: Admin Portal HTML — no CSP, inline scripts, external CDNs

**Severity:** Medium  
**File:** `apps/core-hub/src/modules/admin/admin-portal.html.ts:1-4684`  
**Status:** Open  

The entire admin SPA is a single template literal returned from a TypeScript function. It includes:
- Inline `<script>` blocks (no `nonce` or `hash`)
- External CDN scripts: FontAwesome, Chart.js, Leaflet, Google Fonts
- No `Content-Security-Policy` header on the response
- Dynamic `innerHTML` rendering of API data (kitchen names, user phones, transaction descriptions) without sanitization

The controller sets `Content-Type: text/html` but no CSP:

```typescript
res.setHeader('Content-Type', 'text/html');
res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
```

**Required Fix:**
- Add a CSP header to the admin portal response
- Sanitize all dynamic content rendered via `innerHTML` (use `textContent` where possible)
- Long-term: migrate to a separate frontend project (Next.js/Vite) with proper build-time CSP

---

### S-05: Seed file uses string-interpolated raw SQL

**Severity:** Low  
**File:** `prisma/seed.ts:47-52, 55-65, 68-79, 81-92, 103-115`  
**Status:** Open  

The seed file constructs SQL via template string interpolation:

```typescript
INSERT INTO tenant_kitchen."KitchenBusiness"
  ... '${sampleUser.id}' ...
```

While `sampleUser.id` is a Prisma-generated UUID and currently safe, this pattern is fragile. If the seed file is ever modified to accept external input or run with user-provided data, it becomes a SQL injection vector.

**Required Fix:** Use Prisma's `$executeRaw` with tagged template literals (parameterized queries):

```typescript
await prisma.$executeRaw`INSERT INTO ... VALUES (${sampleUser.id}, ...)`
```

---

## 2. Structural Issues

### ST-01: Duplicate `SouqListing` model in Prisma schema

**Severity:** Medium  
**File:** `prisma/schema.prisma:271-278` (placeholder) and `prisma/schema.prisma:382-413` (full)  
**Status:** Open  

Two `SouqListing` models exist in the schema:
1. A minimal placeholder at line 271 with only `id`, `ownerGlobalUserId`, `title`, `createdAt`
2. A full-featured model at line 382 with all fields, relations, enums, and proper mapping

The placeholder was likely created during early tenant scaffolding and should have been removed when the real model was added. Prisma may silently use one or conflict.

**Required Fix:** Remove the placeholder `SouqListing` model (lines 271-278). Keep only the full model at line 382.

---

### ST-02: No test coverage for new modules

**Severity:** Medium  
**Files:** Missing spec files for Express, Life, and Admin token services  
**Status:** Open  

Existing modules have `.spec.ts` files (auth, soukelkanto, reports, business, etc.), but the newly merged modules have zero test coverage:

| Missing Test File | Module |
|---|---|
| `express.service.spec.ts` | Express courier + delivery service |
| `life.service.spec.ts` | Life locations, items, bookings, posts, photos |
| `admin.service.spec.ts` | Admin stats, kitchens, users, tokens dashboard |

**Required Fix:** Add unit tests covering:
- Courier registration and status transitions
- Delivery request lifecycle (create → accept → pickup → deliver)
- Life location CRUD and hierarchy tree
- Booking creation and status updates
- Token dashboard aggregation
- Token credit/deduct operations
- Edge cases: not found, forbidden, invalid state transitions

---

### ST-03: Status fields use plain `String` instead of Prisma enums

**Severity:** Medium  
**File:** `prisma/schema.prisma` — multiple models  
**Status:** Open  

Several status fields are defined as `String` with default values instead of proper Prisma enums:

| Model | Field | Current Type | Should Be |
|---|---|---|---|
| `KitchenBusiness` (line 286) | `status` | `String @default("PENDING")` | `enum KitchenStatus` |
| `ExpressCourier` (line 825) | `status` | `String @default("PENDING")` | `enum CourierStatus` |
| `ExpressDeliveryRequest` (line 842) | `status` | `String @default("PENDING")` | `enum DeliveryStatus` |
| `TutorBooking` (line 360) | `status` | `String @default("PENDING")` | `enum BookingStatus` |

Using strings means:
- No compile-time type safety
- Typos in status values won't be caught
- API documentation won't show valid values
- No database-level constraint

**Required Fix:** Create Prisma enums for each status field and update the models. Generate a new migration.

---

### ST-04: `getSubtreeHierarchy` uses N+1 recursive queries

**Severity:** Medium  
**File:** `apps/core-hub/src/modules/life/life.service.ts:119-134`  
**Status:** Open  

The method fetches each level of the location tree with a separate database query:

```typescript
async getSubtreeHierarchy(parentId: string | null = null): Promise<any[]> {
  const locations = await this.prisma.lifeLocation.findMany({
    where: { parentId },
    orderBy: { name: 'asc' },
  });
  const tree = [];
  for (const loc of locations) {
    const children = await this.getSubtreeHierarchy(loc.id); // recursive call
    tree.push({ ...loc, children });
  }
  return tree;
}
```

For a hierarchy like City → District → Block → Group → Building, this fires 5+ separate queries. With multiple top-level nodes, the query count multiplies.

**Required Fix:** Use a single recursive CTE:

```sql
WITH RECURSIVE location_tree AS (
  SELECT * FROM tenant_life.locations WHERE parent_id IS NULL
  UNION ALL
  SELECT l.* FROM tenant_life.locations l
  JOIN location_tree t ON l.parent_id = t.id
)
SELECT * FROM location_tree ORDER BY name;
```

Then assemble the tree in memory from the flat result set.

---

### ST-05: `CourierProfileInput` type duplicated in service

**Severity:** Low  
**File:** `apps/core-hub/src/modules/express/express.service.ts:7-14`  
**Status:** Open  

The service defines its own `CourierProfileInput` type instead of importing the DTO class:

```typescript
type CourierProfileInput = {
  name: string;
  phone?: string;
  vehicleType: string;
  nationalId: string;
  nationalIdPhoto?: string;
  personalPhoto?: string;
};
```

This means the service layer's type can drift from the DTO's validation decorators. The controller accepts `CourierProfileDto` (with class-validator decorators) but passes it to a method typed as `CourierProfileInput`.

**Required Fix:** Import and use `CourierProfileDto` in the service method signatures instead of the local type alias.

---

### ST-06: Life booking creation is public with no rate limiting

**Severity:** Low  
**File:** `apps/core-hub/src/modules/life/life.controller.ts:127-135`  
**Status:** Open  

```typescript
@Public()
@Post(':id/bookings')
createBooking(@Param('id') id: string, @Body() dto: CreateLifeBookingDto) {
  return this.lifeService.createBooking(id, dto);
}
```

Anyone (including unauthenticated bots) can create bookings with customer names and phone numbers. While the global `RateLimitGuard` applies, there's no per-IP or per-location rate limit.

**Required Fix:** Consider adding a per-IP rate limit for booking creation, or require authentication. At minimum, add phone number validation and a captcha for public endpoints.

---

### ST-07: No rate limiting on token action endpoint

**Severity:** Low  
**File:** `apps/core-hub/src/modules/admin/admin.controller.ts:176-183`  
**Status:** Open  

The `POST /admin-api/tokens/action` endpoint has no specific rate limit beyond the global `RateLimitGuard`. An admin (or compromised admin token) could rapidly fire credit/deduct operations.

**Required Fix:** Add a per-endpoint rate limit (e.g., max 10 token operations per minute per admin) or require a confirmation/2FA step for operations above a threshold.

---

## 3. Minor / DX Improvements

### DX-01: New DTOs missing `@ApiProperty` decorators

**Severity:** Low  
**Files:** `apps/core-hub/src/modules/express/dto/*.ts`, `apps/core-hub/src/modules/life/dto/*.ts`  
**Status:** Open  

The Express and Life DTOs have `class-validator` decorators (`@IsString`, `@IsOptional`, etc.) but no `@ApiProperty()` decorators from `@nestjs/swagger`. This means the Swagger/OpenAPI docs at `/api/v1/docs` will show empty or incomplete request schemas for these endpoints.

**Required Fix:** Add `@ApiProperty({ example: '...', description: '...' })` to each field in the DTOs, or use `@ApiProperty()` with default values.

---

### DX-02: `unwrapApiData` and `getApiMessage` duplicated inline

**Severity:** Low  
**File:** `apps/core-hub/src/modules/admin/admin-portal.html.ts:2147-2160`  
**Status:** Open  

These client-side utility functions are defined inline in the admin portal HTML. If a kitchen portal or express portal is built, they'll need the same functions.

**Required Fix:** Extract to a shared client utilities file (e.g., `shared/api-utils.js`) that can be imported by all portal HTML templates.

---

### DX-03: `forbidNonWhitelisted: true` may break clients

**Severity:** Low  
**File:** `apps/core-hub/src/main.ts:83`  
**Status:** Informational  

The global `ValidationPipe` is configured with `forbidNonWhitelisted: true`, which rejects any request body containing fields not explicitly declared in the DTO. While good for security, this can break clients that send extra metadata or unused fields.

**Recommendation:** Ensure all DTOs explicitly list every field the frontend sends. If backward compatibility is a concern, consider setting `forbidNonWhitelisted: false` and relying on `whitelist: true` to strip unknown fields silently.

---

## Priority Matrix

| ID | Severity | Effort | Title |
|-----|----------|--------|-------|
| S-01 | Critical | 10 min | Fix `getDeliveryRequestById` authorization bypass |
| S-02 | High | 15 min | Add amount and balance validation to token actions |
| S-03 | High | Large | Migrate admin portal auth to HttpOnly cookies |
| S-04 | Medium | Large | Add CSP and sanitize dynamic content in admin portal |
| S-05 | Low | 30 min | Use parameterized queries in seed file |
| ST-01 | Medium | 5 min | Remove duplicate `SouqListing` model |
| ST-02 | Medium | Medium | Add unit tests for Express, Life, Admin token services |
| ST-03 | Medium | Medium | Convert status strings to Prisma enums |
| ST-04 | Medium | 30 min | Fix N+1 in `getSubtreeHierarchy` with recursive CTE |
| ST-05 | Low | 10 min | Use DTO class in service instead of duplicated type |
| ST-06 | Low | 20 min | Add rate limiting to public booking creation |
| ST-07 | Low | 15 min | Add per-endpoint rate limit on token actions |
| DX-01 | Low | 20 min | Add `@ApiProperty` decorators to new DTOs |
| DX-02 | Low | 15 min | Extract shared client utilities |
| DX-03 | Low | — | Document `forbidNonWhitelisted` behavior for frontend team |

---

## Recommended Action Plan

### Sprint 1 (Immediate — Security)
1. Fix S-01: Add authorization check to `getDeliveryRequestById`
2. Fix S-02: Add amount/balance validation to token actions
3. Fix ST-01: Remove duplicate `SouqListing` model

### Sprint 2 (Short-term — Hardening)
4. Fix ST-03: Convert status strings to Prisma enums + migration
5. Fix ST-04: Optimize `getSubtreeHierarchy` with recursive CTE
6. Fix ST-05: Use DTO classes in service signatures
7. Fix ST-06 + ST-07: Add targeted rate limits
8. Fix DX-01: Add Swagger decorators to DTOs

### Sprint 3 (Medium-term — Quality)
9. Fix ST-02: Add comprehensive unit tests for all new modules
10. Fix S-05: Parameterize seed file SQL

### Sprint 4 (Long-term — Architecture)
11. Fix S-03 + S-04: Migrate admin portal to separate frontend with proper CSP and HttpOnly cookie auth
12. Fix DX-02: Extract shared client utilities when building additional portals

---

## Appendix: Files Reviewed

| File | Lines | Areas Reviewed |
|---|---|---|
| `apps/core-hub/src/main.ts` | 155 | Bootstrap, security headers, CORS, validation pipe |
| `apps/core-hub/src/app/app.module.ts` | 99 | Module wiring, guards, middleware |
| `apps/core-hub/src/modules/admin/admin.controller.ts` | 185 | API endpoints, role guards |
| `apps/core-hub/src/modules/admin/admin.service.ts` | 792 | Business logic, token operations |
| `apps/core-hub/src/modules/admin/admin-portal.html.ts` | 4684 | Frontend SPA, auth flow, API calls |
| `apps/core-hub/src/modules/admin/admin-portal.controller.ts` | 19 | HTML serving |
| `apps/core-hub/src/modules/express/express.controller.ts` | 143 | API endpoints, DTO usage |
| `apps/core-hub/src/modules/express/express.service.ts` | 385 | Courier lifecycle, delivery flow |
| `apps/core-hub/src/modules/life/life.controller.ts` | 202 | API endpoints, role guards, public routes |
| `apps/core-hub/src/modules/life/life.service.ts` | 355 | Location CRUD, hierarchy, bookings |
| `apps/core-hub/src/modules/auth/auth.module.ts` | 80 | OTP providers, JWT config |
| `libs/gateway/src/filters/all-exceptions.filter.ts` | 108 | Error envelope format |
| `prisma/schema.prisma` | 855 | All models, enums, relations |
| `prisma/seed.ts` | 191 | Seed data, raw SQL |
| `package.json` | 81 | Dependencies, scripts |

---

*End of Report*
