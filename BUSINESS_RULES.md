# Mini ERP + CRM Operations Portal - Business Rules & Logic Specification

## 1. Authentication & Security Business Rules

1. **User Authentication**:
   - Every system user must possess a valid, non-expired JWT.
   - Passwords must be hashed using bcrypt (10 salt rounds) before DB storage.
   - Session tokens expire after 24 hours.

2. **Role-Based Authorization Rules**:
   - `ADMIN`: Full read/write access across all system resources including user management.
   - `SALES`: Full access to CRM (Customers & Follow-ups), read-only on Inventory, create & confirm Sales Challans. Cannot cancel confirmed challans or adjust warehouse stock directly.
   - `WAREHOUSE`: Full access to Inventory & Stock Movements, can confirm Sales Challans (for physical dispatch), read-only on Customers. Cannot edit customer records or cancel sales orders.
   - `ACCOUNTS`: Read-only access to CRM and Inventory, write access to cancel Sales Challans (financial reversals).

---

## 2. Customer CRM Business Rules

1. **Customer Uniqueness**:
   - Customer email (if provided) must be unique across the system.
   - Customer phone number is required for all records.

2. **Customer Tiers & Status**:
   - Tiers: `RETAILER`, `WHOLESALER`, `DISTRIBUTOR`, `DIRECT`.
   - Lifecycle Statuses: `LEAD` -> `PROSPECT` -> `ACTIVE` -> `INACTIVE`.

3. **Follow-Up Notes**:
   - A customer follow-up record is immutable once created.
   - Each follow-up must record: note content, follow-up target date, status (`PENDING`, `COMPLETED`), and the author user ID.

---

## 3. Product & Inventory Business Rules

1. **SKU Uniqueness**:
   - Product SKU must be unique, uppercase, alphanumeric with hyphens (e.g. `SKU-ELEC-1001`).

2. **Stock Non-Negativity Principle**:
   - `currentStock` can NEVER be negative (`currentStock >= 0`).
   - Any operation that attempts to reduce stock below 0 MUST abort and throw an HTTP 400 `INSUFFICIENT_STOCK` error.

3. **Low Stock Threshold**:
   - A product is flagged as `LOW_STOCK` whenever `currentStock <= minStock`.
   - Low stock products trigger visual indicators on the dashboard and inventory screens.

4. **Stock Movement Logging**:
   - Every physical stock addition or removal MUST create an immutable record in `stock_movements`.
   - `MovementType` can be `IN` (restock/cancel return), `OUT` (sales dispatch), or `ADJUSTMENT` (audit/damage reconciliation).

---

## 4. Sales Challan Workflow & Stock Guardrails

1. **Challan Number Generation**:
   - Challan numbers are auto-generated with format `CH-YYYYMM-XXXX` (e.g., `CH-202608-0001`).
   - Numbers are sequentially incremented and guaranteed unique via database constraints.

2. **Price Snapshot Rule**:
   - When a product is added to a Sales Challan line item, `unitPriceSnapshot` captures the product's current unit price at that exact moment.
   - Future edits to the product's master price will NOT alter existing sales challan line item snapshots.

3. **Status Transitions & Stock Effects**:

```
 ┌───────────────┐        Confirm (Stock OUT)       ┌───────────────────┐
 │     DRAFT     ├─────────────────────────────────►│     CONFIRMED     │
 └───────┬───────┘                                  └─────────┬─────────┘
         │                                                    │
         │ Cancel (No stock change)                           │ Cancel (Stock IN restore)
         ▼                                                    ▼
 ┌──────────────────────────────────────────────────────────────┐
 │                          CANCELLED                           │
 └──────────────────────────────────────────────────────────────┘
```

   - **DRAFT**: Created by Sales/Admin. Products are reserved in intent only. **NO stock is deducted yet**. Line items and quantities can be freely modified.
   - **CONFIRMED**: Triggered by Sales/Warehouse/Admin.
     - Performs atomic transactional stock check.
     - If all requested items have sufficient stock, deducts stock, creates `OUT` stock movement records, sets `confirmedAt` timestamp and `confirmedById`.
     - Once `CONFIRMED`, line items CANNOT be edited.
   - **CANCELLED**: Triggered by Admin/Accounts.
     - If cancelling a `DRAFT` challan, status changes to `CANCELLED` with zero stock impact.
     - If cancelling a `CONFIRMED` challan, stock is atomically restored (`IN` movement logged for each line item), and status changes to `CANCELLED`.
