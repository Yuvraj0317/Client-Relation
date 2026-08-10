# Mini ERP + CRM Operations Portal - Architecture Document

## 1. High-Level Architecture Overview

The system follows a classic **3-Tier Layered Architecture**:

```
 [ Client Browser (React + TS + Vite) ]
                    │
           HTTPS / JSON REST API
                    ▼
 [ Express.js API Gateway / Router ]
                    │
 ┌──────────────────┴──────────────────┐
 │ Middleware Stack                    │
 │ 1. Cors & Body Parser               │
 │ 2. JWT Authenticator                │
 │ 3. RBAC Authorizer                  │
 │ 4. Zod Request Validator            │
 └──────────────────┬──────────────────┘
                    │
                    ▼
 [ Controller Layer (HTTP Request/Response Handler) ]
                    │
                    ▼
 [ Service Layer (Business Logic & Transactions) ]
                    │
                    ▼
 [ Prisma ORM Data Access Layer ]
                    │
                    ▼
 [ PostgreSQL Database Engine ]
```

---

## 2. Component Design & Responsibilities

### 2.1 Backend Layers
1. **Routes Layer**: Defines URI endpoints and attaches middleware chains (Authentication, RBAC, Validation).
2. **Controllers Layer**: Parses incoming HTTP requests, extracts parameters/body, delegates to services, and formats standard HTTP responses.
3. **Services Layer**: Encapsulates core domain business rules, handles transactional operations (e.g. confirming sales challan + deducting stock + creating audit log), and interacts with Prisma.
4. **Validators Layer (Zod)**: Ensures structural and type correctness of request payload before reaching controllers.
5. **Middlewares Layer**: Handles security, token decoding, permission checking, and global error handling.

### 2.2 Frontend Architecture
- **State Management**: React `AuthContext` for user session & permissions; local state & custom hooks (`useFetch`) for server data caching.
- **Routing**: `react-router-dom` with `ProtectedRoute` wrapper checking authentication status and required role permissions.
- **API Client**: Axios instance configured with base URL, request interceptors (attaching `Authorization: Bearer <token>`), and response interceptors (handling global errors like 401 Unauthorized).

---

## 3. Security & Authentication Architecture

### 3.1 Authentication Strategy
- **Mechanism**: JSON Web Token (JWT) stateless auth.
- **Password Hashing**: `bcryptjs` with salt rounds = 10.
- **Token Payload**:
  ```json
  {
    "userId": "uuid-string",
    "email": "user@fundsroom.com",
    "role": "ADMIN" | "SALES" | "WAREHOUSE" | "ACCOUNTS",
    "iat": 1770742416,
    "exp": 1770828816
  }
  ```
- **Token Transmission**: `Authorization: Bearer <token>` in HTTP request header.

### 3.2 Role-Based Access Control (RBAC)
Four primary system roles are supported:

| Feature / Resource | ADMIN | SALES | WAREHOUSE | ACCOUNTS |
| :--- | :---: | :---: | :---: | :---: |
| **Manage Users** | ✅ Full | ❌ None | ❌ None | ❌ None |
| **View Customers** | ✅ Read | ✅ Read | ✅ Read | ✅ Read |
| **Create/Edit Customers** | ✅ Write | ✅ Write | ❌ None | ❌ None |
| **Add Follow-Up Notes** | ✅ Write | ✅ Write | ❌ None | ❌ None |
| **View Inventory & Stock** | ✅ Read | ✅ Read | ✅ Read | ✅ Read |
| **Create/Edit Products** | ✅ Write | ❌ None | ✅ Write | ❌ None |
| **Stock IN/OUT Movements** | ✅ Write | ❌ None | ✅ Write | ❌ None |
| **Create/Edit Draft Challan** | ✅ Write | ✅ Write | ❌ None | ❌ None |
| **Confirm Sales Challan** | ✅ Write | ✅ Write | ✅ Write | ❌ None |
| **Cancel Sales Challan** | ✅ Write | ❌ None | ❌ None | ✅ Write |

---

## 4. Concurrency & Stock Transaction Architecture

### 4.1 Transactional Stock Deduction Guardrail
When a Sales Challan is changed from `DRAFT` to `CONFIRMED`, stock deduction MUST be executed atomically. To prevent race conditions (e.g. two sales managers confirming orders simultaneously for the last item in stock):

```ts
// Transaction Flow Pseudocode
await prisma.$transaction(async (tx) => {
  // 1. Fetch Challan & Items
  const challan = await tx.salesChallan.findUnique({
    where: { id: challanId },
    include: { items: true }
  });

  if (challan.status !== 'DRAFT') {
    throw new BadRequestError('Challan is not in DRAFT state');
  }

  // 2. Validate Stock for ALL items first
  for (const item of challan.items) {
    const product = await tx.product.findUnique({ where: { id: item.productId } });
    if (!product || product.currentStock < item.quantity) {
      throw new InsufficientStockError(
        `Insufficient stock for product ${product?.name || item.productName}. Required: ${item.quantity}, Available: ${product?.currentStock || 0}`
      );
    }
  }

  // 3. Perform Stock Deductions & Create Stock Movement Logs atomically
  for (const item of challan.items) {
    // Atomic deduction with conditional check in SQL
    const updatedProduct = await tx.product.updateMany({
      where: {
        id: item.productId,
        currentStock: { gte: item.quantity } // Hard DB constraint check
      },
      data: {
        currentStock: { decrement: item.quantity }
      }
    });

    if (updatedProduct.count === 0) {
      throw new InsufficientStockError(`Stock changed concurrently for item ${item.productName}`);
    }

    // Immutable Stock Movement Log
    await tx.stockMovement.create({
      data: {
        productId: item.productId,
        type: 'OUT',
        quantity: item.quantity,
        referenceType: 'SALES_CHALLAN',
        referenceId: challan.id,
        remarks: `Stock deducted for Challan #${challan.challanNumber}`,
        createdById: userId
      }
    });
  }

  // 4. Update Challan Status to CONFIRMED
  return await tx.salesChallan.update({
    where: { id: challanId },
    data: {
      status: 'CONFIRMED',
      confirmedById: userId,
      confirmedAt: new Date()
    }
  });
});
```

---

## 5. Global Error Handling Strategy

Standard JSON API Response Format across all endpoints:

```json
// Success Response (200 OK / 201 Created)
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 45
  }
}

// Error Response (400, 401, 403, 404, 422, 500)
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Insufficient stock for product Wireless Mouse. Required: 15, Available: 5",
    "details": null
  }
}
```
