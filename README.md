# Fundsroom Mini ERP + CRM Operations Portal

A production-grade Mini ERP and CRM Operations Portal built for wholesale and distribution enterprises. The portal handles Customer Relationship Management (CRM), Product SKU Inventory, Immutably Logged Stock Movements, and Sales Delivery Challans with strict non-negative inventory guardrails.

---

## 🌟 Key Core Features

### 1. Authentication & Role-Based Access Control (RBAC)
- **Roles**: `ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS`
- **Stateless Authentication**: JWT tokens with 24-hour expiration
- **Password Security**: Hashed using `bcryptjs` (10 salt rounds)
- **1-Click Demo Login**: Quick role switcher embedded on the login page and top navbar

### 2. Customer Relationship Management (CRM)
- Create, edit, and search customer database by buyer name, company, email, phone, status, and tier
- **Customer Tiers**: `RETAILER`, `WHOLESALER`, `DISTRIBUTOR`, `DIRECT`
- **Customer Statuses**: `LEAD`, `PROSPECT`, `ACTIVE`, `INACTIVE`
- **Follow-up Interaction Notes**: Chronological timeline of customer notes with target follow-up action dates

### 3. Product SKU & Inventory Intelligence
- Product master catalog tracking SKU codes, unit prices, category, current stock, and minimum stock threshold
- **Low Stock Warnings**: Visual alerts triggered when `currentStock <= minStock`
- **Stock Movement Log**: Audit trail of every `IN` (receive), `OUT` (dispatch), or `ADJUSTMENT` movement with author tracking and remarks

### 4. Sales Challan Dispatch Engine
- Multi-item sales delivery notes with auto-generated sequential numbers (e.g. `CH-202608-0001`)
- **Price Snapshotting**: Freezes product unit price on line items upon creation
- **Atomic Stock Deduction**: Status transition from `DRAFT` to `CONFIRMED` executes inside a PostgreSQL `$transaction`. Validates stock availability and deducts inventory atomically
- **Zero Negative Stock Guardrail**: If requested quantity exceeds available stock, transaction aborts with HTTP 400 `INSUFFICIENT_STOCK` error
- **Order Cancellation**: Status transition to `CANCELLED` automatically restores product stock and logs `IN` movement audit records

---

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js, TypeScript, Prisma ORM, PostgreSQL
- **Frontend**: React (v18), TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Authentication**: JWT, bcryptjs
- **Validation**: Zod schema validation

---

## 🔑 Pre-Configured Test Credentials

| Role | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@fundsroom.com` | `Password123!` | Full system access across CRM, Inventory, Stock, Challans, Users |
| **Sales Manager** | `sales@fundsroom.com` | `Password123!` | Customer CRM, Follow-ups, Create & Confirm Sales Challans |
| **Warehouse Manager** | `warehouse@fundsroom.com` | `Password123!` | Master Inventory, Manual Stock IN/OUT, Confirm Challan Dispatches |
| **Accounts Officer** | `accounts@fundsroom.com` | `Password123!` | Read-only views, Cancel Sales Challans with stock reversals |

---

## 🚀 Quickstart & Installation Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database server running locally or on cloud (e.g., Supabase / Neon / Docker)

### 1. Backend Setup
```bash
cd backend
npm install

# Configure Environment Variables (.env)
cp .env.example .env

# Generate Prisma Client & Push Database Schema
npm run prisma:generate
npm run prisma:push

# Seed Demo Users, Customers, Products & Challans
npm run prisma:seed

# Start Backend Dev Server (Port 5000)
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install

# Start Vite Development Server (Port 3000)
npm run dev
```

Visit **`http://localhost:3000`** in your web browser.

---

## 📡 REST API Summary

- `POST /api/v1/auth/login` — Authenticate user credentials & receive JWT
- `GET /api/v1/auth/me` — Fetch current logged-in user profile
- `GET /api/v1/customers` — List customers with search & status/type filters
- `POST /api/v1/customers` — Create new customer (Admin, Sales)
- `POST /api/v1/customers/:id/follow-ups` — Add follow-up note (Admin, Sales)
- `GET /api/v1/products` — List products with search, category & low-stock filters
- `GET /api/v1/products/low-stock` — Fetch products requiring restock
- `POST /api/v1/products/:id/stock-movement` — Log manual Stock IN/OUT (Admin, Warehouse)
- `GET /api/v1/sales-challans` — List sales challans with status tabs
- `POST /api/v1/sales-challans` — Issue Draft Sales Challan (Admin, Sales)
- `PATCH /api/v1/sales-challans/:id/confirm` — Confirm Challan & deduct stock atomically
- `PATCH /api/v1/sales-challans/:id/cancel` — Cancel Challan & restore stock (Admin, Accounts)

---

## 📌 Postman Collection
Import [`postman_collection.json`](file:///c:/Users/HP/OneDrive/Desktop/Fundsroom/postman_collection.json) into Postman to test all endpoints.

---

## ⚙️ Assumptions & Limitations
1. **Single Currency**: All prices and transactions are denominated in Indian Rupees (₹ INR).
2. **Single Warehouse Location**: Default warehouse location is assigned as "Main Warehouse". Multi-location transfer workflows can be extended via the `location` string field.
3. **Draft Modifications**: Draft sales challans do not lock stock until confirmed.
