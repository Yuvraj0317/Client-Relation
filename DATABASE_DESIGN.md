# Mini ERP + CRM Operations Portal - Database Design Document

## 1. Entity Relationship (ER) Summary

```
 ┌─────────────────┐       1:N       ┌───────────────────────┐
 │     Users       ├─────────────────┤   CustomerFollowUps   │
 └────────┬────────┘                 └───────────────────────┘
          │                                      ▲
          │ 1:N                                  │ 1:N
          ▼                                      │
 ┌─────────────────┐       1:N       ┌───────────┴───────────┐
 │    Customers    ├─────────────────┤   CustomerFollowUps   │
 └────────┬────────┘                 └───────────────────────┘
          │
          │ 1:N
          ▼
 ┌─────────────────┐       1:N       ┌───────────────────────┐
 │  SalesChallans  ├─────────────────┤     ChallanItems      │
 └────────┬────────┘                 └───────────┬───────────┘
          │                                      │
          │ 1:N (ConfirmedBy)                    │ N:1
          ▼                                      ▼
 ┌─────────────────┐       1:N       ┌───────────────────────┐
 │ StockMovements  ├─────────────────┤       Products        │
 └─────────────────┘                 └───────────────────────┘
```

---

## 2. Prisma Schema Specification (`schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  ADMIN
  SALES
  WAREHOUSE
  ACCOUNTS
}

enum CustomerType {
  RETAILER
  WHOLESALER
  DISTRIBUTOR
  DIRECT
}

enum CustomerStatus {
  LEAD
  PROSPECT
  ACTIVE
  INACTIVE
}

enum MovementType {
  IN
  OUT
  ADJUSTMENT
}

enum ReferenceType {
  MANUAL
  SALES_CHALLAN
  RETURN
}

enum ChallanStatus {
  DRAFT
  CONFIRMED
  CANCELLED
}

model User {
  id              String             @id @default(uuid())
  email           String             @unique
  password        String
  name            String
  role            Role               @default(SALES)
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  // Relations
  createdCustomers Customer[]        @relation("CustomerCreatedBy")
  followUps        CustomerFollowUp[] @relation("FollowUpCreatedBy")
  createdProducts  Product[]         @relation("ProductCreatedBy")
  stockMovements   StockMovement[]   @relation("StockMovementCreatedBy")
  createdChallans  SalesChallan[]    @relation("ChallanCreatedBy")
  confirmedChallans SalesChallan[]   @relation("ChallanConfirmedBy")

  @@map("users")
}

model Customer {
  id           String           @id @default(uuid())
  name         String
  companyName  String?
  email        String?          @unique
  phone        String
  address      String
  customerType CustomerType     @default(RETAILER)
  status       CustomerStatus   @default(LEAD)
  createdById  String
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt

  // Relations
  createdBy    User             @relation("CustomerCreatedBy", fields: [createdById], references: [id])
  followUps    CustomerFollowUp[]
  salesChallans SalesChallan[]

  @@index([name])
  @@index([companyName])
  @@index([status])
  @@map("customers")
}

model CustomerFollowUp {
  id           String     @id @default(uuid())
  customerId   String
  note         String
  followUpDate DateTime
  status       String     @default("PENDING") // PENDING, COMPLETED, CANCELLED
  createdById  String
  createdAt    DateTime   @default(now())

  // Relations
  customer     Customer   @relation(fields: [customerId], references: [id], onDelete: Cascade)
  createdBy    User       @relation("FollowUpCreatedBy", fields: [createdById], references: [id])

  @@index([customerId])
  @@index([followUpDate])
  @@map("customer_follow_ups")
}

model Product {
  id           String          @id @default(uuid())
  name         String
  sku          String          @unique
  category     String
  unitPrice    Decimal         @db.Decimal(12, 2)
  currentStock Int             @default(0)
  minStock     Int             @default(5)
  location     String          @default("Main Warehouse")
  createdById  String
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt

  // Relations
  createdBy    User            @relation("ProductCreatedBy", fields: [createdById], references: [id])
  movements    StockMovement[]
  challanItems ChallanItem[]

  @@index([sku])
  @@index([name])
  @@index([category])
  @@map("products")
}

model StockMovement {
  id            String        @id @default(uuid())
  productId     String
  type          MovementType
  quantity      Int
  referenceType ReferenceType @default(MANUAL)
  referenceId   String?
  remarks       String?
  createdById   String
  createdAt     DateTime      @default(now())

  // Relations
  product       Product       @relation(fields: [productId], references: [id])
  createdBy     User          @relation("StockMovementCreatedBy", fields: [createdById], references: [id])

  @@index([productId])
  @@index([createdAt])
  @@map("stock_movements")
}

model SalesChallan {
  id            String        @id @default(uuid())
  challanNumber String        @unique
  customerId    String
  status        ChallanStatus @default(DRAFT)
  totalAmount   Decimal       @db.Decimal(12, 2) @default(0.00)
  notes         String?
  createdById   String
  confirmedById String?
  confirmedAt   DateTime?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  // Relations
  customer      Customer      @relation(fields: [customerId], references: [id])
  createdBy     User          @relation("ChallanCreatedBy", fields: [createdById], references: [id])
  confirmedBy   User?         @relation("ChallanConfirmedBy", fields: [confirmedById], references: [id])
  items         ChallanItem[]

  @@index([challanNumber])
  @@index([customerId])
  @@index([status])
  @@map("sales_challans")
}

model ChallanItem {
  id                String       @id @default(uuid())
  challanId         String
  productId         String
  productName       String       // Snapshot
  productSku        String       // Snapshot
  unitPriceSnapshot Decimal      @db.Decimal(12, 2) // Price at creation
  quantity          Int
  lineTotal         Decimal      @db.Decimal(12, 2)

  // Relations
  challan           SalesChallan @relation(fields: [challanId], references: [id], onDelete: Cascade)
  product           Product      @relation(fields: [productId], references: [id])

  @@index([challanId])
  @@index([productId])
  @@map("challan_items")
}
```

---

## 3. Database Constraints & Indexing Strategy

1. **Unique Constraints**:
   - `users.email`
   - `customers.email` (Nullable unique)
   - `products.sku`
   - `sales_challans.challanNumber`

2. **Performance Indexes**:
   - Search indexes on `products(sku, name, category)` for fast inventory queries.
   - Search indexes on `customers(name, companyName, status)` for CRM lookups.
   - Index on `sales_challans(challanNumber, customerId, status)` for list filtering.
   - Index on `stock_movements(productId, createdAt)` for audit trail rendering.

3. **Check Constraints (Enforced via Prisma Middleware & Postgres SQL)**:
   - `currentStock >= 0` on `products` table.
   - `quantity > 0` on `challan_items` and `stock_movements`.
