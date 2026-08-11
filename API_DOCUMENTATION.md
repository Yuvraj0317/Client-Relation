# REST API Reference Documentation

Complete endpoint documentation for the Mini ERP + CRM Operations Portal.

---

## 🔐 1. Authentication Endpoints

### Login
- **`POST /api/auth/login`**
- **Request Body**:
  ```json
  {
    "email": "admin@fundsroom.com",
    "password": "Password123!"
  }
  ```
- **Success Response (HTTP 200)**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1Ni...",
    "user": {
      "id": "c1f7a08b-...",
      "name": "System Admin",
      "email": "admin@fundsroom.com",
      "role": "ADMIN"
    }
  }
  ```

### Current User Profile
- **`GET /api/auth/me`**
- **Header**: `Authorization: Bearer <token>`
- **Success Response (HTTP 200)**: Returns user profile.

---

## 👥 2. Customer CRM Endpoints

### Create Customer Account
- **`POST /api/customers`** (Restricted to `ADMIN`, `SALES`)
- **Request Body**:
  ```json
  {
    "name": "Starlight Electronics",
    "mobile": "+91 9887766554",
    "email": "starlight@example.com",
    "businessName": "Starlight Retailers Ltd",
    "gstNumber": "27AAAAA0000A1Z5",
    "customerType": "WHOLESALE",
    "address": "Building 12, Tech Park, Pune",
    "status": "ACTIVE"
  }
  ```
- **Success Response (HTTP 201)**: Returns created Customer object.

### Search & List Customers
- **`GET /api/customers`**
- **Query Parameters**: `search`, `customerType`, `status`, `page`, `limit`
- **Success Response (HTTP 200)**: Returns customer list with pagination metadata.

### Get Customer Details
- **`GET /api/customers/:id`**

### Update Customer Profile
- **`PUT /api/customers/:id`** (Restricted to `ADMIN`, `SALES`)

### Delete Customer Account
- **`DELETE /api/customers/:id`** (Restricted to `ADMIN`)

### Log Follow-up Note
- **`POST /api/customers/:id/followups`** (Restricted to `ADMIN`, `SALES`)
- **Request Body**:
  ```json
  {
    "note": "Discussed bulk pricing and delivery schedules",
    "followUpDate": "2026-08-15T10:00:00.000Z"
  }
  ```

### Get Customer Follow-up Timeline
- **`GET /api/customers/:id/followups`**

---

## 📦 3. Product & Inventory Endpoints

### Create Product SKU
- **`POST /api/products`** (Restricted to `ADMIN`, `WAREHOUSE`)
- **Request Body**:
  ```json
  {
    "name": "Industrial Valve 50mm",
    "sku": "VALVE-50MM",
    "category": "Hardware",
    "unitPrice": 1450.00,
    "currentStock": 20,
    "minStock": 5,
    "warehouse": "Main Warehouse"
  }
  ```

### List Product Catalog
- **`GET /api/products`**
- **Query Parameters**: `search`, `category`, `lowStock`, `page`, `limit`

### Low-Stock Warning Catalog
- **`GET /api/products/low-stock`**

### Manual Stock Adjustment
- **`POST /api/products/:id/stock-movement`** (Restricted to `ADMIN`, `WAREHOUSE`)
- **Request Body**:
  ```json
  {
    "type": "IN",
    "quantity": 15,
    "remarks": "Received vendor shipment"
  }
  ```

### Global Stock Movement Audit Logs
- **`GET /api/stock/movements`**

---

## 📜 4. Sales Delivery Challan Endpoints

### Create Draft Delivery Challan
- **`POST /api/challans`** (Restricted to `ADMIN`, `SALES`)
- **Request Body**:
  ```json
  {
    "customerId": "uuid-customer-id",
    "notes": "Express dispatch order",
    "items": [
      {
        "productId": "uuid-product-id",
        "quantity": 5,
        "unitPrice": 1450.00
      }
    ]
  }
  ```
- **Success Response (HTTP 201)**: Returns Draft Challan (`status: "DRAFT"`, zero stock deducted).

### List Delivery Challans
- **`GET /api/challans`**
- **Query Parameters**: `search`, `status`, `customerId`, `page`, `limit`

### Get Delivery Challan Details
- **`GET /api/challans/:id`**

### Confirm Delivery Challan (Atomic Stock Deduction)
- **`POST /api/challans/:id/confirm`** or **`PATCH /api/challans/:id/confirm`** (Restricted to `ADMIN`, `WAREHOUSE`, `SALES`)
- **Success Response (HTTP 200)**: Status updated to `CONFIRMED`, stock balance decremented, `OUT` audit logs generated.

### Cancel Delivery Order (Stock Restoration)
- **`POST /api/challans/:id/cancel`** or **`PATCH /api/challans/:id/cancel`** (Restricted to `ADMIN`, `ACCOUNTS`)
- **Success Response (HTTP 200)**: Status updated to `CANCELLED`, deducted stock restored back, `IN` audit logs generated.
