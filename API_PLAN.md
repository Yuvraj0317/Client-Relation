# Mini ERP + CRM Operations Portal - API Specification Plan

## 1. Global API Standards

- **Base URL**: `/api/v1`
- **Content-Type**: `application/json`
- **Authentication**: `Authorization: Bearer <token>`
- **Response Wrapper**:
  ```json
  {
    "success": true,
    "data": {},
    "meta": { "page": 1, "limit": 10, "total": 100 } // included for paginated endpoints
  }
  ```

---

## 2. Authentication API (`/api/v1/auth`)

### 2.1 Login User
- **Method**: `POST`
- **Path**: `/api/v1/auth/login`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "admin@fundsroom.com",
    "password": "Password123!"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOiJIUzI1Ni...",
      "user": {
        "id": "u-101",
        "name": "Admin User",
        "email": "admin@fundsroom.com",
        "role": "ADMIN"
      }
    }
  }
  ```

### 2.2 Get Current Profile
- **Method**: `GET`
- **Path**: `/api/v1/auth/me`
- **Access**: Authenticated
- **Success Response (200 OK)**: User profile object.

### 2.3 Register User
- **Method**: `POST`
- **Path**: `/api/v1/auth/register`
- **Access**: Restricted (`ADMIN` only)
- **Request Body**: `{ "name": "...", "email": "...", "password": "...", "role": "SALES" }`

---

## 3. Customer CRM API (`/api/v1/customers`)

### 3.1 List Customers
- **Method**: `GET`
- **Path**: `/api/v1/customers`
- **Access**: Authenticated (`ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS`)
- **Query Params**: `search`, `customerType`, `status`, `page`, `limit`
- **Success Response (200 OK)**: Paginated array of customer objects.

### 3.2 Create Customer
- **Method**: `POST`
- **Path**: `/api/v1/customers`
- **Access**: Restricted (`ADMIN`, `SALES`)
- **Request Body**:
  ```json
  {
    "name": "Apex Electronics",
    "companyName": "Apex Trading Corp",
    "email": "contact@apex.com",
    "phone": "+91 9876543210",
    "address": "42 Commercial Hub, Mumbai",
    "customerType": "WHOLESALER",
    "status": "ACTIVE"
  }
  ```

### 3.3 Update Customer
- **Method**: `PUT`
- **Path**: `/api/v1/customers/:id`
- **Access**: Restricted (`ADMIN`, `SALES`)

### 3.4 Add Follow-up Note
- **Method**: `POST`
- **Path**: `/api/v1/customers/:id/follow-ups`
- **Access**: Restricted (`ADMIN`, `SALES`)
- **Request Body**:
  ```json
  {
    "note": "Discussed bulk order requirements for Q3. Promised quote by Friday.",
    "followUpDate": "2026-08-15T10:00:00.000Z",
    "status": "PENDING"
  }
  ```

---

## 4. Product & Inventory API (`/api/v1/products`)

### 4.1 List Products
- **Method**: `GET`
- **Path**: `/api/v1/products`
- **Access**: Authenticated
- **Query Params**: `search`, `category`, `lowStockOnly=true|false`, `page`, `limit`

### 4.2 Create Product
- **Method**: `POST`
- **Path**: `/api/v1/products`
- **Access**: Restricted (`ADMIN`, `WAREHOUSE`)
- **Request Body**:
  ```json
  {
    "name": "Industrial Router X500",
    "sku": "SKU-ROUT-500",
    "category": "Networking",
    "unitPrice": 12500.00,
    "currentStock": 45,
    "minStock": 10,
    "location": "Warehouse A - Rack 4"
  }
  ```

### 4.3 Log Stock Movement (Manual IN / OUT)
- **Method**: `POST`
- **Path**: `/api/v1/products/:id/stock-movement`
- **Access**: Restricted (`ADMIN`, `WAREHOUSE`)
- **Request Body**:
  ```json
  {
    "type": "IN",
    "quantity": 20,
    "remarks": "Received fresh shipment from supplier shipment #771"
  }
  ```

### 4.4 Get Low Stock Products
- **Method**: `GET`
- **Path**: `/api/v1/products/low-stock`
- **Access**: Authenticated

---

## 5. Sales Challan API (`/api/v1/sales-challans`)

### 5.1 Create Draft Sales Challan
- **Method**: `POST`
- **Path**: `/api/v1/sales-challans`
- **Access**: Restricted (`ADMIN`, `SALES`)
- **Request Body**:
  ```json
  {
    "customerId": "cust-uuid-123",
    "notes": "Urgent dispatch requested",
    "items": [
      {
        "productId": "prod-uuid-001",
        "quantity": 5
      },
      {
        "productId": "prod-uuid-002",
        "quantity": 2
      }
    ]
  }
  ```
- **Response**: Returns created Challan with automatically generated `challanNumber` (e.g. `CH-202608-0001`), snapshot prices, and `status: "DRAFT"`.

### 5.2 Confirm Sales Challan (Triggers Stock Deduction)
- **Method**: `PATCH`
- **Path**: `/api/v1/sales-challans/:id/confirm`
- **Access**: Restricted (`ADMIN`, `SALES`, `WAREHOUSE`)
- **Business Logic**: Executes transactional validation. Deducts stock from products, logs immutable `StockMovement` records with type `OUT`, updates status to `CONFIRMED`.
- **Error Case (400 Bad Request)**:
  ```json
  {
    "success": false,
    "error": {
      "code": "INSUFFICIENT_STOCK",
      "message": "Stock check failed: Requested 5 units for Industrial Router X500, but only 2 available in stock."
    }
  }
  ```

### 5.3 Cancel Sales Challan
- **Method**: `PATCH`
- **Path**: `/api/v1/sales-challans/:id/cancel`
- **Access**: Restricted (`ADMIN`, `ACCOUNTS`)
- **Business Logic**: If state was `CONFIRMED`, atomically restores deducted product stock and logs `StockMovement` of type `IN`. Set status to `CANCELLED`.
