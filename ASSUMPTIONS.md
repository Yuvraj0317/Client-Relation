# Business & Technical Assumptions Document

This document outlines the core business and technical assumptions incorporated into the design and implementation of the **Mini ERP + CRM Operations Portal**.

---

## 🏢 1. Business & Workflow Assumptions

### A. Customer CRM Lifecycle
1. **Email Uniqueness**: Customer accounts require a unique email address to prevent duplicate buyer registration.
2. **Buyer Tiers**: Customers belong to one of three buyer tiers (`RETAIL`, `WHOLESALE`, `DISTRIBUTOR`) that govern client reporting and order prioritization.
3. **Follow-up Interaction Timeline**: Follow-up interaction notes capture a scheduled target date (`followUpDate`), content note, and author tracking (`createdById`). Deleting a customer record cascade-deletes related follow-up notes.

### B. Product Inventory Control
1. **SKU Uniqueness & Case Normalization**: Stock Keeping Unit (SKU) codes are mandatory, unique, and automatically transformed to uppercase strings (e.g. `VALVE-50MM`).
2. **Non-Negative Inventory**: Product prices (`unitPrice >= 0`), stock levels (`currentStock >= 0`), and minimum stock alert thresholds (`minimumStock >= 0`) must never be negative.
3. **Low-Stock Alert Trigger**: A product triggers a low-stock alert condition when `currentStock <= minimumStock`.
4. **Auditable Stock Movement**: Manual stock adjustments (`IN` or `OUT`) must include a non-zero positive quantity (`quantity > 0`) and a reason remark. Every adjustment appends an immutable record to `StockMovement`.

### C. Sales Delivery Challans & Stock Deduction
1. **Draft Order Isolation**: Creating a Delivery Challan with status `DRAFT` registers the order and snapshots item prices, but **MUST NOT deduct inventory stock**.
2. **Atomic Stock Deduction**: Order confirmation (`POST /api/challans/:id/confirm`) executes inside a single PostgreSQL `$transaction` block:
   - If ANY line item has insufficient stock (`currentStock < quantity`), the entire transaction aborts, returning `HTTP 400 Bad Request` with error code `INSUFFICIENT_STOCK`. Zero partial stock deductions occur.
3. **Product Price & Name Snapshotting**: Line items in `ChallanItem` store frozen snapshot copies of `productName`, `sku`, and `unitPrice` at creation. Future modifications to master catalog prices or product names do NOT alter historical challan records.
4. **Order Cancellation & Stock Restoration**: Cancelling a confirmed order (`POST /api/challans/:id/cancel`) assumes physical goods were unfulfilled or returned. The system automatically executes a stock reversal transaction, restoring product stock levels (`currentStock + quantity`) and logging an `IN` stock movement log.

---

## 💻 2. Technical & Architectural Assumptions

1. **Stateless JWT Session Management**: User session authentication relies on 24-hour signed JSON Web Tokens (JWT) containing `{ userId, email, role }`. The backend evaluates token signatures statelessly without database session lookups.
2. **Server-Side RBAC Authority**: Backend RBAC middleware (`authorize`) is authoritative. Role modifications in client-side storage (e.g. `localStorage`) are ignored by the server.
3. **Database Schema Management**: PostgreSQL is managed via Prisma ORM (v5.22). Primary keys use standard UUIDs (`uuid()`).
4. **Currency Unit**: Financial calculations assume Indian Rupees (INR ₹) formatted to 2 decimal places.
