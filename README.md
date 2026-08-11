# Mini ERP + CRM Operations Portal 🚀

[![Build & Verification Status](https://img.shields.io/badge/System--Verification-100%25--PASSED-success?style=for-the-badge&logo=github)](https://github.com/Yuvraj0317/Client-Relation)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v14+-blue?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma_ORM-v5.22-darkblue?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![React](https://img.shields.io/badge/React-v18.3-cyan?style=for-the-badge&logo=react)](https://react.dev/)

A full-stack, enterprise-grade **Mini ERP + CRM Operations Portal** built for wholesale and distribution businesses. The portal manages Customer Relationship Management (CRM), Inventory Control, Stock Movement Auditing, and Sales Delivery Challan dispatches with ACID stock deduction guardrails and price snapshotting.

---

## 1. Project Overview
The **Mini ERP + CRM Operations Portal** digitizes core B2B wholesale workflows. It bridges customer lifecycle management, inventory control, and delivery order fulfillment into a unified, role-based platform.

---

## 2. Business Problem
Wholesale and distribution companies frequently face critical operational bottlenecks:
- **Inventory Discrepancies**: Manual order logging leads to stock overselling and negative inventory balances.
- **Price Distortion**: Historical invoices get distorted when product prices change in master catalogs.
- **Uncoordinated Role Access**: Sales teams lack visibility into real-time stock levels, while warehouse leads lack order approval context.
- **Lack of Audit Trails**: Manual inventory adjustments lack user attribution and timestamp logs.

This platform solves these problems through **ACID database transactions**, **historical product snapshotting**, **role-based permissions**, and **auditable movement logs**.

---

## 3. Key Features
- **Authentication & Security**: Bcrypt password hashing, 24-hour signed JWT session tokens, server-side RBAC authorization middleware.
- **Customer CRM**: Buyer account management (`RETAIL`, `WHOLESALE`, `DISTRIBUTOR`), lifecycle status tracking (`LEAD`, `ACTIVE`, `INACTIVE`), email duplicate prevention, and chronological follow-up notes timeline.
- **Product Catalog & Stock Engine**: Master SKU catalog, dynamic low-stock alert calculation (`currentStock <= minimumStock`), manual Stock `IN`/`OUT` balance adjustments with audit remarks.
- **Sales Delivery Challan Engine**: Sequential auto-numbering (`CH-YYYYMM-XXXX`), frozen price/SKU snapshotting, atomic `$transaction` stock deduction, non-negative inventory guardrails, and cancellation stock restoration.
- **Responsive Admin Frontend**: Operations dashboard, filterable tables, search bars, slide-over drawers, modal forms, 1-click role switcher, and printable delivery invoices.

---

## 4. Tech Stack
- **Backend API Gateway**: Node.js + Express.js + TypeScript
- **Database & ORM**: PostgreSQL + Prisma ORM (v5.22)
- **Frontend SPA**: React (v18) + TypeScript + Vite + Tailwind CSS + Lucide Icons
- **Validation & Security**: Zod + JWT + bcryptjs
- **API Testing**: Postman Collection (`postman_collection.json`) + Integration Test Suites

---

## 5. System Architecture
```
 ┌─────────────────────────────────────────────────────────────┐
 │  React (v18) + TypeScript + Vite + Tailwind CSS Frontend    │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                   REST API Gateway (JSON / JWT)
                                │
 ┌──────────────────────────────▼──────────────────────────────┐
 │  Node.js + Express + Zod Input Validation + RBAC Middleware  │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                      Prisma ORM (v5.22)
                                │
 ┌──────────────────────────────▼──────────────────────────────┐
 │  PostgreSQL Database (ACID Transactions & Stock Guardrails)  │
 └─────────────────────────────────────────────────────────────┘
```

---

## 6. Database Design
Designed with 7 normalized database entities in PostgreSQL via Prisma:
- **`User`**: System user credentials and role definitions (`ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS`).
- **`Customer`**: Buyer profiles with contact info, GST numbers, buyer tiers, and status flags.
- **`CustomerFollowUp`**: Interaction notes with scheduled dates (Cascade delete on Customer).
- **`Product`**: SKU master catalog with unit price, stock balance, and minStock thresholds.
- **`StockMovement`**: Immutable audit logs of Stock `IN` and `OUT` movements with creator tracking.
- **`Challan`**: Delivery orders with sequential numbering (`CH-YYYYMM-XXXX`), total amounts, and status.
- **`ChallanItem`**: Line items storing frozen snapshot data (`productName`, `sku`, `unitPrice`, `quantity`).

---

## 7. Authentication Flow
1. User submits credentials (`POST /api/auth/login`).
2. Server validates email and compares bcrypt hash.
3. Server issues 24-hour signed JWT containing `{ userId, email, role }`.
4. Client stores JWT token and attaches `Authorization: Bearer <token>` header to API calls.
5. Server middleware `authenticate()` verifies cryptographic token signature stateless.

---

## 8. Role-Based Authorization (RBAC)

| Operational Action | ADMIN | SALES | WAREHOUSE | ACCOUNTS |
| :--- | :---: | :---: | :---: | :---: |
| Authenticate / View Profile | ✅ | ✅ | ✅ | ✅ |
| Create / Edit Customers & Follow-ups | ✅ | ✅ | ❌ | ❌ |
| Delete Customer Accounts | ✅ | ❌ | ❌ | ❌ |
| Setup Product SKUs / Adjust Stock | ✅ | ❌ | ✅ | ❌ |
| Delete Products | ✅ | ❌ | ❌ | ❌ |
| Create Draft Sales Challans | ✅ | ✅ | ❌ | ❌ |
| Confirm Sales Challans & Deduct Stock | ✅ | ✅ | ✅ | ❌ |
| Cancel Sales Challans & Restore Stock | ✅ | ❌ | ❌ | ✅ |

---

## 9. Customer CRM Module
- Endpoints: `POST /api/customers`, `GET /api/customers`, `GET /api/customers/:id`, `PUT /api/customers/:id`, `DELETE /api/customers/:id`, `POST /api/customers/:id/followups`, `GET /api/customers/:id/followups`.
- Features search across `name`, `mobile`, `businessName`, `email`, `gstNumber`, filtering by buyer tier and status, and chronological follow-up timeline drawer.

---

## 10. Product Inventory Module
- Endpoints: `POST /api/products`, `GET /api/products`, `GET /api/products/low-stock`, `GET /api/products/:id`, `PUT /api/products/:id`, `DELETE /api/products/:id`, `POST /api/products/:id/stock-movement`, `GET /api/stock/movements`.
- Dynamic low-stock condition: `isLowStock = currentStock <= minimumStock`. Rejects negative prices or stock balances.

---

## 11. Sales Challan Workflow
```
 CREATE DRAFT (POST /api/challans) ──► CONFIRM DISPATCH (POST /api/challans/:id/confirm)
   - Auto CH-YYYYMM-XXXX               - Validates stock inside $transaction
   - Snapshots Name & Price            - Decrements currentStock & logs OUT movement
   - Zero stock deducted               - Status updated to CONFIRMED
                                                    │
                                                    ▼
                                       CANCEL ORDER (POST /api/challans/:id/cancel)
                                       - Increments currentStock back & logs IN movement
                                       - Status updated to CANCELLED
```

---

## 12. Stock Transaction Logic
Stock deduction executes inside a single PostgreSQL transaction (`prisma.$transaction`):
1. Looping validation checks `currentStock >= requestedQuantity` for ALL line items.
2. Shortfall on ANY product throws `InsufficientStockError` (`HTTP 400 Bad Request`), immediately aborting the transaction.
3. Zero partial stock deductions occur.

---

## 13. Product Snapshot Logic
When a delivery challan is created, line items copy `productName`, `sku`, and `unitPrice` into `ChallanItem`. Subsequent catalog updates to product prices or names do NOT mutate historical challan records.

---

## 14. API Documentation
See detailed endpoint specs in [API_DOCUMENTATION.md](file:///c:/Users/HP/OneDrive/Desktop/Fundsroom/API_DOCUMENTATION.md) and Postman Collection (`postman_collection.json`).

---

## 15. Environment Variables

### Backend (`backend/.env.example`)
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/fundsroom_erp?schema=public"
JWT_SECRET="production-super-secret-jwt-key-replace-in-env"
JWT_EXPIRES_IN="24h"
PORT=5000
NODE_ENV="production"
CORS_ORIGIN="http://localhost:3000,http://localhost:5173"
```

### Frontend (`frontend/.env.example`)
```env
VITE_API_URL="/api"
```

---

## 16. Local Setup Instructions
```bash
# 1. Install & seed backend
cd backend
npm install
npx prisma db push --force-reset
npm run prisma:seed
npm run dev

# 2. In second terminal, start frontend
cd frontend
npm install
npm run dev
```

---

## 17. Production Deployment
See complete cloud deployment instructions in [DEPLOYMENT.md](file:///c:/Users/HP/OneDrive/Desktop/Fundsroom/DEPLOYMENT.md).

---

## 18. Test Credentials
- **ADMIN**: `admin@fundsroom.com` / `Password123!`
- **SALES**: `sales@fundsroom.com` / `Password123!`
- **WAREHOUSE**: `warehouse@fundsroom.com` / `Password123!`
- **ACCOUNTS**: `accounts@fundsroom.com` / `Password123!`

---

## 19. Testing Suite
Run integration test suites:
```bash
cd backend
npx tsx src/test_phase3_auth.ts
npx tsx src/test_phase4_crm.ts
npx tsx src/test_phase5_inventory.ts
npx tsx src/test_phase6_challan.ts
npx tsx src/test_phase8_integration.ts
npx tsx src/test_phase9_deployment.ts
```
See full report in [TEST_REPORT.md](file:///c:/Users/HP/OneDrive/Desktop/Fundsroom/TEST_REPORT.md).

---

## 20. Business & Technical Assumptions
See comprehensive business and technical rules in [ASSUMPTIONS.md](file:///c:/Users/HP/OneDrive/Desktop/Fundsroom/ASSUMPTIONS.md).

---

## 21. Known Limitations
- Single currency support (INR ₹).
- Manual stock adjustment requires positive quantity inputs.

---

## 22. Future Improvements
- Multi-warehouse location transfers.
- PDF delivery note download export.
- Real-time WebSocket stock alert notifications.
