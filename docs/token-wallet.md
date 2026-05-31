# Shared Token Wallet — Business & Technical Documentation

> **MadinatyAI Ecosystem Hub** — Closed-loop credit system for cross-app token consumption.
> Version 1.0 · June 2026

---

## 1. Business Overview

### 1.1 What Is the Shared Token Wallet?

The **Shared Token Wallet** is a closed-loop credit system within the MadinatyAI Ecosystem Hub. It replaces the traditional "pay per service" model with a unified token balance that users and businesses can spend across all ecosystem applications.

### 1.2 Why Tokens Instead of Cash-Per-Service?

| Problem (Old Model) | Solution (Token Model) |
|----------------------|------------------------|
| Kitchen owner pays monthly cash subscription → locked to one service | Buy tokens once, spend across Souq, Kitchen, Tutor, TimeBank |
| Separate billing for each app | Single wallet, unified balance |
| No flexibility to try other services | Budget allocation lets users experiment |
| Cash collection creates operational friction | Offline cash → online tokens, automated ledger |

### 1.3 Token Types

| Type | For | Source | Use Cases |
|------|-----|--------|-----------|
| **Business** | SaaS tenants (restaurants, shops, tutors) | Cash subscription payment | Tenant rental, ad boosts, premium listings |
| **Individual** | End users (customers, students, time-bankers) | Cash purchase or reward | Booking sessions, featured offers, ad priority |

### 1.4 Activity Pricing Examples

| Activity | Cost (tokens) | Description |
|----------|--------------|-------------|
| `kitchen_rental_monthly` | 50 | Kitchen tenant monthly rental |
| `souk_ad_boost_7d` | 10 | SOUK ad priority boost (7 days) |
| `tutor_premium_listing` | 15 | Tutor premium profile listing |
| `timebank_featured` | 5 | TimeBank featured offer |

> **Admin-configurable**: Platform admins can add, remove, or adjust pricing via API without code changes.

---

## 2. Business Flows

### 2.1 Token Acquisition (Cash → Tokens)

```
User pays cash offline (bank transfer, Vodafone Cash, Instapay)
        ↓
Platform admin verifies payment
        ↓
Admin calls POST /api/tokens/credit {userId, amount, tokenType}
        ↓
Tokens appear in user's wallet instantly
        ↓
Immutable transaction record created for audit
```

### 2.2 Token Spending (Wallet → Activity)

```
User wants to rent Kitchen tenant for 1 month
        ↓
App calls POST /api/tokens/spend {userId, activityType, tokenType}
        ↓
Hub checks ActivityPricing for cost (e.g. 50 tokens)
        ↓
Hub checks wallet balance (sufficient?)
        ↓
YES → Deduct 50 tokens, create debit transaction, return updated wallet
NO  → Return InsufficientTokensException
        ↓
App receives confirmation, proceeds with tenant creation
```

### 2.3 Token Allocation (Budgeting)

```
Business user has 200 business tokens
        ↓
User wants to reserve 50 for Souq ads, 100 for Kitchen rental
        ↓
App calls POST /api/tokens/allocate for each activity
        ↓
Tokens are "earmarked" but not spent
        ↓
User can see allocation breakdown in wallet view
```

---

## 3. Technical Architecture

### 3.1 Data Model

```prisma
model TokenWallet {
  id               String   @id @default(uuid())
  userId           String   @unique
  user             GlobalUser @relation(fields: [userId], references: [id])
  businessTokens   Int      @default(0)   // SaaS tenant credits
  individualTokens Int      @default(0)   // End-user credits
  allocations      TokenAllocation[]
  transactions     TokenTransaction[]
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

model TokenAllocation {
  id              String   @id @default(uuid())
  walletId        String
  activityType    String   // e.g. "kitchen_rental"
  tokenType       String   // "business" | "individual"
  allocatedAmount Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  @@unique([walletId, activityType, tokenType])
}

model TokenTransaction {
  id          String   @id @default(uuid())
  walletId    String
  activityType String  // Activity or "CREDIT"
  tokenType   String  // "business" | "individual"
  amount      Int     // Positive = credit, negative = debit
  description String? // Human-readable memo
  referenceId String? // ID of related entity (ad, rental, etc.)
  createdAt   DateTime @default(now())
}

model ActivityPricing {
  id          String   @id @default(uuid())
  activityType String  @unique  // e.g. "kitchen_rental"
  cost        Int               // Token cost
  description String
  isActive    Boolean @default(true)
  updatedAt   DateTime @updatedAt
}
```

### 3.2 Service Layer (`@madinatyai/tokens`)

```typescript
class TokensService {
  credit(userId, amount, tokenType, reason?)     // Admin credits tokens
  spend(userId, activityType, tokenType, ref?)   // Deduct for activity
  allocate(userId, activityType, tokenType, amt)   // Budget earmarking
  getWallet(userId)                              // View balance + history
  listActivityPricing()                          // Get active pricing
  setActivityPricing(type, cost, desc, active?)  // Admin pricing CRUD
}
```

### 3.3 API Endpoints

All routes prefixed with `/api`.

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/tokens/credit` | PLATFORM_ADMIN | Credit tokens to user wallet |
| POST | `/tokens/spend` | — | Spend tokens on an activity |
| POST | `/tokens/allocate` | — | Allocate tokens to activity budget |
| GET | `/tokens/wallet?userId=` | — | Get wallet + transactions |
| GET | `/tokens/pricing` | — | List active pricing |
| POST | `/tokens/pricing` | PLATFORM_ADMIN | Set/update pricing |

### 3.4 Request/Response Examples

**Credit tokens (admin):**
```bash
POST /api/tokens/credit
{
  "userId": "u-123",
  "amount": 100,
  "tokenType": "business",
  "reason": "Monthly kitchen subscription payment"
}
```

**Spend tokens:**
```bash
POST /api/tokens/spend
{
  "userId": "u-123",
  "activityType": "kitchen_rental",
  "tokenType": "business",
  "referenceId": "rental-456"
}
```

**Get wallet:**
```bash
GET /api/tokens/wallet?userId=u-123
```

```json
{
  "userId": "u-123",
  "businessTokens": 50,
  "individualTokens": 0,
  "allocations": [
    { "activityType": "kitchen_rental", "tokenType": "business", "allocatedAmount": 50 }
  ],
  "recentTransactions": [
    {
      "activityType": "kitchen_rental",
      "tokenType": "business",
      "amount": -50,
      "description": "Spent on kitchen_rental",
      "referenceId": "rental-456",
      "createdAt": "2026-06-01T00:00:00Z"
    }
  ]
}
```

---

## 4. Security & Compliance

| Aspect | Implementation |
|--------|---------------|
| **Not a financial instrument** | Tokens are closed-loop credits, not money. No PCI-DSS, no banking license required. |
| **Cash stays outside** | Payment collection is offline. Hub only records token issuance. |
| **Immutable audit trail** | Every credit/debit creates a `TokenTransaction` row. No deletions. |
| **Role-based admin** | Credit and pricing endpoints protected by `PLATFORM_ADMIN` role guard. |
| **Input validation** | All DTOs use `class-validator` with strict whitelisting. |
| **Negative balance prevention** | Spend and allocate operations check balance before deducting. |

---

## 5. Future Extensibility

| Feature | Status | Implementation Path |
|---------|--------|---------------------|
| **Token expiry** | Not in v1 | Add `expiresAt` to `TokenTransaction`, scheduled cleanup job |
| **Refunds** | Not in v1 | Add `refundReferenceId` to transactions, reverse debit logic |
| **Bulk credit** | Not in v1 | Add batch `creditMany()` endpoint for admin CSV upload |
| **External payment gateway** | Phase 2 | Webhook from Paymob/Fawry → auto-credit tokens |
| **Promotional tokens** | Phase 2 | Add `source` field to transactions (PROMO, REFERRAL, PURCHASE) |
| **Token marketplace** | Phase 3 | Allow users to trade token types (business ↔ individual) |

---

## 6. Glossary

| Term | Definition |
|------|------------|
| **Business token** | Token type for SaaS tenants and service providers |
| **Individual token** | Token type for end consumers and regular users |
| **Activity** | A chargeable action in the ecosystem (rental, ad boost, premium listing) |
| **ActivityPricing** | Admin-configurable cost table mapping activities to token amounts |
| **Allocation** | User-managed budget earmarking tokens for specific activities |
| **Transaction** | Immutable record of every credit or debit to a wallet |
| **Closed-loop** | Tokens cannot be redeemed for cash; they only circulate within the ecosystem |

---

## 7. Integration Guide for Ecosystem Apps

### 7.1 Before Spending Tokens

1. Call `GET /api/tokens/wallet?userId={id}` to check balance
2. Display available tokens to user
3. Call `POST /api/tokens/spend` before creating the paid resource
4. If successful, proceed with app logic (create rental, boost ad, etc.)
5. If `InsufficientTokensException`, prompt user to acquire more tokens

### 7.2 Error Handling

| Error | HTTP | Meaning | Action |
|-------|------|---------|--------|
| `InsufficientTokensException` | 400 | Balance < required cost | Show "Buy more tokens" prompt |
| `InvalidActivityException` | 400 | Activity not configured or inactive | Log error, contact admin |
| Validation errors | 400 | Missing/invalid fields | Show field-level errors |
