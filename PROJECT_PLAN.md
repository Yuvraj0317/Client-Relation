# Mini ERP + CRM Operations Portal - Project Plan

## 1. Project Overview & Vision
The Mini ERP + CRM Operations Portal is a comprehensive, production-grade operations management system built specifically for wholesale and distribution enterprises. The system integrates Customer Relationship Management (CRM), Inventory Control, Stock Movement Auditing, and Sales Challan Workflow Management into a single unified platform.

## 2. Core Objectives
- **Secure Access Control**: Role-Based Access Control (RBAC) across four roles: Admin, Sales, Warehouse, and Accounts.
- **Customer CRM**: Maintain customer records, account status, customer tiers, and follow-up history with scheduled action dates.
- **Product & Inventory Intelligence**: SKU tracking, stock level monitoring, low-stock warnings, and immutably logged Stock IN/OUT movements.
- **Sales Challan Engine**: Multi-item sales delivery notes with status workflows (DRAFT, CONFIRMED, CANCELLED), snapshot pricing, and transactional stock guardrails ensuring zero negative stock.
- **Auditable & Reliable**: End-to-end audit tracking for stock changes, user operations, and challan status changes.

---

## 3. Technology Stack & Rationale

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Backend Runtime** | Node.js (v18+) + TypeScript | Strongly typed server environment, async execution, high performance |
| **Web Framework** | Express.js | Standard lightweight backend framework with mature middleware ecosystem |
| **Database ORM** | Prisma ORM | Type-safe query building, seamless migration management, relational modeling |
| **Database Engine** | PostgreSQL (v14+) | ACID-compliant relational database essential for atomic stock transactions |
| **Input Validation** | Zod | Schema-first type-safe request validation |
| **Authentication** | JWT (JSON Web Tokens) + bcrypt | Stateless authentication with standard authorization headers |
| **Frontend Framework**| React (v18+) + TypeScript | Component-based, highly responsive single-page application |
| **Build System** | Vite | Lightning-fast HMR and optimized production bundle compilation |
| **Styling & UI** | Tailwind CSS + Lucide Icons | Modern, clean, responsive admin dashboard aesthetic |

---

## 4. Repository Directory Structure
```
/ (Root)
├── PROJECT_PLAN.md
├── ARCHITECTURE.md
├── DATABASE_DESIGN.md
├── API_PLAN.md
├── FRONTEND_PLAN.md
├── BUSINESS_RULES.md
├── IMPLEMENTATION_PHASES.md
├── README.md
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── @types/
│       ├── config/
│       │   └── env.ts
│       ├── controllers/
│       │   ├── auth.controller.ts
│       │   ├── customer.controller.ts
│       │   ├── product.controller.ts
│       │   └── salesChallan.controller.ts
│       ├── middlewares/
│       │   ├── auth.middleware.ts
│       │   ├── rbac.middleware.ts
│       │   ├── validate.middleware.ts
│       │   └── error.middleware.ts
│       ├── routes/
│       │   ├── auth.routes.ts
│       │   ├── customer.routes.ts
│       │   ├── product.routes.ts
│       │   └── salesChallan.routes.ts
│       ├── services/
│       │   ├── auth.service.ts
│       │   ├── customer.service.ts
│       │   ├── product.service.ts
│       │   └── salesChallan.service.ts
│       ├── utils/
│       │   ├── jwt.ts
│       │   ├── hash.ts
│       │   ├── logger.ts
│       │   └── apiResponse.ts
│       ├── validators/
│       │   ├── auth.validator.ts
│       │   ├── customer.validator.ts
│       │   ├── product.validator.ts
│       │   └── salesChallan.validator.ts
│       └── server.ts
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── assets/
        ├── components/
        │   ├── common/
        │   │   ├── Navbar.tsx
        │   │   ├── Sidebar.tsx
        │   │   ├── Badge.tsx
        │   │   ├── Modal.tsx
        │   │   ├── DataTable.tsx
        │   │   └── Alert.tsx
        │   └── forms/
        ├── context/
        │   └── AuthContext.tsx
        ├── hooks/
        │   └── useFetch.ts
        ├── pages/
        │   ├── Login.tsx
        │   ├── Dashboard.tsx
        │   ├── Customers.tsx
        │   ├── CustomerDetail.tsx
        │   ├── Inventory.tsx
        │   ├── SalesChallans.tsx
        │   ├── CreateChallan.tsx
        │   └── ChallanDetail.tsx
        ├── services/
        │   └── api.ts
        ├── types/
        │   └── index.ts
        ├── utils/
        │   └── formatters.ts
        ├── App.tsx
        ├── main.tsx
        └── index.css
```

---

## 5. Key Risk Assessment & Mitigation

| Risk | Potential Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| Race condition during stock confirmation | Negative inventory balance | PostgreSQL serializable transactions & Prisma `tx.product.update` with condition `currentStock >= qty` |
| Unauthorized role access | Security breach / data alteration | Explicit RBAC middleware on every restricted API endpoint |
| Orphaned follow-ups or item snapshots | Data inconsistency | Foreign key constraints (`ON DELETE CASCADE` or `RESTRICT`) |
| Unhandled error responses | Bad UI experience & debug difficulty | Centralized Express error handler returning standardized API JSON errors |
