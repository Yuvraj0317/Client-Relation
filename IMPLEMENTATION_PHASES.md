# Mini ERP + CRM Operations Portal - Implementation Phases Plan

## Phase 1: Backend Architecture & Database Scaffolding

### Objective
Establish the foundational Node.js + TypeScript Express backend server, setup Prisma ORM with PostgreSQL database connection, establish project layout, and configure global error handling middleware.

### Tasks
1. Initialize backend directory structure, `package.json`, `tsconfig.json`, and `.env.example`.
2. Configure Prisma schema with all models: `User`, `Customer`, `CustomerFollowUp`, `Product`, `StockMovement`, `SalesChallan`, `ChallanItem`, and Enums.
3. Setup PostgreSQL connection configuration and migration scripts.
4. Implement standard Express API response utility (`apiResponse.ts`) and global error handling middleware (`error.middleware.ts`).
5. Setup Zod validation middleware wrapper (`validate.middleware.ts`).

### Files Expected to Change / Create
- [NEW] `backend/package.json`
- [NEW] `backend/tsconfig.json`
- [NEW] `backend/.env.example`
- [NEW] `backend/prisma/schema.prisma`
- [NEW] `backend/src/config/env.ts`
- [NEW] `backend/src/utils/apiResponse.ts`
- [NEW] `backend/src/middlewares/error.middleware.ts`
- [NEW] `backend/src/middlewares/validate.middleware.ts`
- [NEW] `backend/src/server.ts`

### Dependencies
- Node.js, Express, TypeScript, Prisma CLI, `@prisma/client`, `zod`, `dotenv`, `cors`.

### Acceptance Criteria
- Server boots cleanly on designated PORT with `/health` returning `{ success: true, message: "Server operational" }`.
- `npx prisma db push` / `npx prisma migrate dev` creates PostgreSQL tables without errors.
- Unhandled route requests return standard 404 JSON response.

### Testing Requirements
- Test `/health` endpoint via HTTP client.
- Test Prisma DB connectivity and schema sync against local/cloud PostgreSQL.

---

## Phase 2: Authentication & Role-Based Authorization Engine

### Objective
Implement secure user registration, JWT login authentication, password hashing with bcrypt, and flexible Role-Based Access Control (RBAC) middleware.

### Tasks
1. Create password hashing helper (`hash.ts`) and JWT signing/verification helper (`jwt.ts`).
2. Build Zod validation schemas for login and registration requests (`auth.validator.ts`).
3. Build `auth.service.ts` for database credential validation and JWT issuance.
4. Implement `auth.controller.ts` for handling `/api/v1/auth/login`, `/api/v1/auth/register`, `/api/v1/auth/me`.
5. Implement `auth.middleware.ts` to decode Bearer tokens and attach `req.user`.
6. Implement `rbac.middleware.ts` (`authorizeRoles('ADMIN', 'SALES', ...)`).

### Files Expected to Change / Create
- [NEW] `backend/src/utils/hash.ts`
- [NEW] `backend/src/utils/jwt.ts`
- [NEW] `backend/src/validators/auth.validator.ts`
- [NEW] `backend/src/services/auth.service.ts`
- [NEW] `backend/src/controllers/auth.controller.ts`
- [NEW] `backend/src/routes/auth.routes.ts`
- [NEW] `backend/src/middlewares/auth.middleware.ts`
- [NEW] `backend/src/middlewares/rbac.middleware.ts`

### Dependencies
- `jsonwebtoken`, `bcryptjs`, `@types/jsonwebtoken`, `@types/bcryptjs`.

### Acceptance Criteria
- Valid credentials return JWT token and user profile; invalid password returns HTTP 401.
- Protected endpoints reject requests missing `Authorization: Bearer <token>` header.
- Endpoint protected by `authorizeRoles('ADMIN')` returns 403 Forbidden when accessed with `SALES` token.

### Testing Requirements
- Unit test JWT generation and bcrypt verify functions.
- Integration test `/api/v1/auth/login` and `/api/v1/auth/me` with sample credentials.

---

## Phase 3: Product & Inventory Management Engine

### Objective
Develop complete CRUD APIs for product master data, low-stock threshold calculations, and stock movement (IN/OUT) audit logging.

### Tasks
1. Write Zod validation schemas for Product creation, update, and manual stock movements.
2. Implement `product.service.ts`:
   - Product list with searching (by name/SKU/category), low-stock filtering, and pagination.
   - Product creation with unique SKU check.
   - Stock movement logging (creating `StockMovement` records & updating product `currentStock`).
3. Build `product.controller.ts` and attach authentication/RBAC middleware on `product.routes.ts`.

### Files Expected to Change / Create
- [NEW] `backend/src/validators/product.validator.ts`
- [NEW] `backend/src/services/product.service.ts`
- [NEW] `backend/src/controllers/product.controller.ts`
- [NEW] `backend/src/routes/product.routes.ts`

### Dependencies
- Phase 1 & Phase 2 modules.

### Acceptance Criteria
- Products can be listed with filter `lowStockOnly=true` returning items where `currentStock <= minStock`.
- Manual Stock IN increases stock and logs movement; Stock OUT decreases stock and checks non-negativity constraint.
- Duplicate SKU creation throws 409 Conflict error.

### Testing Requirements
- Test API endpoints for Product CRUD, search query filtering, and low-stock filter.
- Verify `stock_movements` table receives audit log entry on stock movement creation.

---

## Phase 4: Customer CRM Module & Follow-up Tracking

### Objective
Implement customer management system supporting customer creation, search/filtering, status/type classification, and follow-up interaction notes with action dates.

### Tasks
1. Build Zod validation schemas for Customer creation, update, and Follow-up notes (`customer.validator.ts`).
2. Build `customer.service.ts`:
   - Customer search across name, company name, status, and type.
   - Create and update customer records.
   - Append follow-up notes with dates and status.
   - Retrieve customer timeline history.
3. Build `customer.controller.ts` and wire routes in `customer.routes.ts`.

### Files Expected to Change / Create
- [NEW] `backend/src/validators/customer.validator.ts`
- [NEW] `backend/src/services/customer.service.ts`
- [NEW] `backend/src/controllers/customer.controller.ts`
- [NEW] `backend/src/routes/customer.routes.ts`

### Dependencies
- Phase 1 & Phase 2 modules.

### Acceptance Criteria
- Customer accounts created with automatic tracking of author (`createdById`).
- Follow-up timeline records notes ordered chronologically with follow-up dates.
- Search API returns matching customer records filtered by status and type.

### Testing Requirements
- Test creation of customer and subsequent addition of follow-up note via API.

---

## Phase 5: Sales Challan Engine & Stock Transaction Guardrails

### Objective
Build multi-item Sales Challan management with automatic challan numbering, unit price snapshotting, and atomic stock deduction upon confirmation preventing negative inventory balance.

### Tasks
1. Build Zod validators for Challan creation and status updates (`salesChallan.validator.ts`).
2. Implement sequential Challan Number generator (e.g. `CH-202608-0001`).
3. Build `salesChallan.service.ts`:
   - `createDraftChallan`: Fetch product unit prices, create snapshot items, compute totals, set status to `DRAFT`.
   - `confirmChallan`: Execute Prisma `$transaction`. Validate current stock for all line items. Atomically decrement product stock and create `StockMovement` records (type `OUT`). Set status to `CONFIRMED`.
   - `cancelChallan`: If confirmed, execute `$transaction` to restore stock and create `StockMovement` records (type `IN`). Set status to `CANCELLED`.
4. Build `salesChallan.controller.ts` and routes with RBAC.

### Files Expected to Change / Create
- [NEW] `backend/src/validators/salesChallan.validator.ts`
- [NEW] `backend/src/services/salesChallan.service.ts`
- [NEW] `backend/src/controllers/salesChallan.controller.ts`
- [NEW] `backend/src/routes/salesChallan.routes.ts`

### Dependencies
- Phase 1, Phase 2, Phase 3 modules.

### Acceptance Criteria
- Creating a draft challan does NOT alter product stock levels.
- Confirming a challan with requested quantity > current stock fails with HTTP 400 `INSUFFICIENT_STOCK` error and leaves database unchanged.
- Confirming a valid challan deducts stock atomically and creates stock movement logs.
- Cancelling a confirmed challan restores product stock accurately.

### Testing Requirements
- Test insufficient stock edge case.
- Test successful confirmation flow and verify stock decrement.
- Test cancellation flow and verify stock restoration.

---

## Phase 6: Frontend Setup & Core Design System

### Objective
Initialize Vite + React + TypeScript project, configure Tailwind CSS, set up AuthContext, build common layout components (Sidebar, Topbar, Modals, Status Badges), and implement protected routes.

### Tasks
1. Scaffold frontend app in `frontend/` directory using Vite React-TS template.
2. Install dependencies (`react-router-dom`, `lucide-react`, `axios`, `clsx`, `tailwind-merge`).
3. Configure Tailwind CSS color palette, typography, and utility classes.
4. Implement API Axios client with authorization request interceptors (`services/api.ts`).
5. Build `AuthContext.tsx` handling login, token storage in localStorage, logout, and current user role state.
6. Build Layout system (`Sidebar.tsx`, `Navbar.tsx`, `Badge.tsx`, `Modal.tsx`, `DataTable.tsx`).

### Files Expected to Change / Create
- [NEW] `frontend/package.json`
- [NEW] `frontend/vite.config.ts`
- [NEW] `frontend/tailwind.config.js`
- [NEW] `frontend/src/index.css`
- [NEW] `frontend/src/services/api.ts`
- [NEW] `frontend/src/context/AuthContext.tsx`
- [NEW] `frontend/src/components/common/Sidebar.tsx`
- [NEW] `frontend/src/components/common/Navbar.tsx`
- [NEW] `frontend/src/components/common/Badge.tsx`
- [NEW] `frontend/src/components/common/Modal.tsx`
- [NEW] `frontend/src/components/common/DataTable.tsx`
- [NEW] `frontend/src/App.tsx`

### Dependencies
- Vite, React 18, Tailwind CSS, Lucide React.

### Acceptance Criteria
- Application renders responsive admin sidebar layout with user profile badge and quick role switcher.
- Protected routes redirect unauthenticated users to `/login`.

### Testing Requirements
- Verify responsive layout across mobile and desktop browser window sizes.

---

## Phase 7: Frontend Feature Modules Implementation

### Objective
Build complete interactive UI pages for Login, Overview Dashboard, Customer CRM, Product & Inventory Management, and Sales Challan Creation/Details.

### Tasks
1. Build `Login.tsx` page featuring instant 1-click credentials autofill buttons for Admin, Sales, Warehouse, and Accounts roles.
2. Build `Dashboard.tsx` with KPI metrics cards (Customers, Inventory, Low Stock Warnings, Challans, Confirmed Sales Revenue) and recent activity widgets.
3. Build `Customers.tsx` list page with search, status filters, "New Customer" modal, and `CustomerDetail.tsx` with follow-up drawer.
4. Build `Inventory.tsx` with category filters, low stock alerts, product creation modal, and Stock IN/OUT adjustment modal.
5. Build `SalesChallans.tsx` list page with status filter tabs (`ALL`, `DRAFT`, `CONFIRMED`, `CANCELLED`).
6. Build `CreateChallan.tsx` with dynamic product rows, live stock availability warning indicators, auto-calculated line totals, and "Save Draft" / "Confirm Dispatch" actions.
7. Build `ChallanDetail.tsx` featuring delivery note layout, print preview mode, and status action buttons based on user role permissions.

### Files Expected to Change / Create
- [NEW] `frontend/src/pages/Login.tsx`
- [NEW] `frontend/src/pages/Dashboard.tsx`
- [NEW] `frontend/src/pages/Customers.tsx`
- [NEW] `frontend/src/pages/CustomerDetail.tsx`
- [NEW] `frontend/src/pages/Inventory.tsx`
- [NEW] `frontend/src/pages/SalesChallans.tsx`
- [NEW] `frontend/src/pages/CreateChallan.tsx`
- [NEW] `frontend/src/pages/ChallanDetail.tsx`

### Dependencies
- Phase 1 - Phase 6 completed API backend endpoints.

### Acceptance Criteria
- User can log in seamlessly with any role credential.
- Dashboard displays live statistics fetched from backend.
- Sales Manager can build a multi-item challan, see live stock indicators, and save as draft or confirm dispatch.
- Warehouse Manager can perform stock IN/OUT adjustments and confirm pending draft challans.
- Low stock items highlight clearly in inventory table and trigger warning alert badges.

### Testing Requirements
- Manual End-to-End user flow testing across all four user roles.

---

## Phase 8: Data Seeding, Postman Collection & Documentation

### Objective
Provide automated database seed script populating demo users, customers, products, stock movements, and challans; export Postman API collection; and author comprehensive `README.md`.

### Tasks
1. Build `prisma/seed.ts` script creating:
   - 4 pre-configured test users (Admin, Sales, Warehouse, Accounts).
   - 10+ wholesale customers with follow-up notes.
   - 15+ inventory products with mixed stock levels (including 3 low-stock items).
   - Initial stock IN movement logs.
   - 3 sample Sales Challans (1 Draft, 1 Confirmed, 1 Cancelled).
2. Generate Postman API Collection JSON file (`postman_collection.json`) covering all backend endpoints.
3. Write production-ready `README.md` detailing startup instructions, environment variable setup, architecture overview, role permissions, and API summary.

### Files Expected to Change / Create
- [NEW] `backend/prisma/seed.ts`
- [NEW] `postman_collection.json`
- [NEW] `README.md`

### Dependencies
- Full application codebase.

### Acceptance Criteria
- Running `npx prisma db seed` seeds full operational data cleanly.
- `README.md` clearly explains setup, environment configuration, and test user credentials.

### Testing Requirements
- Execute full seed script and verify login with all seeded test user accounts.
