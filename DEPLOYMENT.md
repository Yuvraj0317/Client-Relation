# Production Deployment & Setup Guide 🚀

This document provides step-by-step instructions for deploying the **Mini ERP + CRM Operations Portal** to production environments (Cloud VMs, Docker, Render, Railway, Vercel, Netlify, or AWS).

---

## 1. Local Setup Instructions

### Prerequisites
- **Node.js**: v18.x or v20+
- **PostgreSQL Database**: v14+ running locally on port 5432
- **Package Manager**: `npm`

### Local Setup Steps
```bash
# 1. Clone the repository
git clone https://github.com/Yuvraj0317/Client-Relation.git
cd Client-Relation

# 2. Setup & Seed Backend Database
cd backend
npm install
npx prisma db push --force-reset
npm run prisma:seed

# 3. Start Backend Server (Port 5000)
npm run dev

# 4. In a separate terminal, Setup & Start Frontend (Port 3000)
cd ../frontend
npm install
npm run dev
```

---

## 2. Production Environment Variables

Ensure `.env` files are NEVER committed to version control (`.gitignore` excludes all `.env` files). Use environment configuration panels on your cloud provider (e.g. Render, Railway, Vercel, AWS ECS).

### Backend Production Environment Variables (`backend/.env.example`)
| Variable Name | Required | Description & Sample Production Value |
| :--- | :---: | :--- |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string: `postgresql://db_user:password@prod-db-host:5432/fundsroom_erp?schema=public` |
| `JWT_SECRET` | **Yes** | Long cryptographically random string (64+ chars) used for signing user tokens |
| `JWT_EXPIRES_IN` | Optional | JWT session validity duration (Default: `24h`) |
| `PORT` | Optional | Backend HTTP listener port (Default: `5000` or process `$PORT`) |
| `NODE_ENV` | **Yes** | Set to `production` |
| `CORS_ORIGIN` | **Yes** | Allowed frontend client domain(s), e.g. `https://erp.yourdomain.com` or comma-separated list |

### Frontend Production Environment Variables (`frontend/.env.example`)
| Variable Name | Required | Description & Sample Production Value |
| :--- | :---: | :--- |
| `VITE_API_URL` | **Yes** | Deployed backend API gateway base path: `https://api.yourdomain.com/api` (or `/api` if reverse proxied via NGINX) |

---

## 3. Production Database Migration

Execute Prisma production migrations against the production PostgreSQL instance prior to starting the web application process:

```bash
cd backend

# Deploy database schema migrations
npx prisma migrate deploy

# (Optional) Run initial seed script to populate test accounts
npx tsx prisma/seed.ts
```

---

## 4. Backend Deployment Guide (Node.js / Express Gateway)

### Option A: PaaS (Render / Railway / Heroku)
1. Connect GitHub repository `Yuvraj0317/Client-Relation`.
2. Set Root Directory: `backend`.
3. Build Command: `npm install && npx prisma generate && npm run build`
4. Start Command: `node dist/server.js`
5. Configure Environment Variables in PaaS Dashboard: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `NODE_ENV=production`.

### Option B: Linux Server (Ubuntu / NGINX / PM2)
```bash
cd /var/www/backend
npm install
npx prisma generate
npm run build
pm2 start dist/server.js --name "mini-erp-api"
```

---

## 5. Frontend Deployment Guide (React + Vite)

### Option A: Static Hosting (Vercel / Netlify / Cloudflare Pages)
1. Connect GitHub repository `Yuvraj0317/Client-Relation`.
2. Set Root Directory: `frontend`.
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Configure Environment Variable: `VITE_API_URL=https://api.yourdomain.com/api`.

### Option B: NGINX Static Web Server
```nginx
server {
    listen 80;
    server_name erp.yourdomain.com;

    root /var/www/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 6. Test Account Setup & Credentials

The seed script (`backend/prisma/seed.ts`) populates 4 test accounts representing all core operational roles:

| Role | Email Credentials | Default Password | Initial Permissions |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@fundsroom.com` | `Password123!` | Full system access across CRM, Inventory, Stock Movements, Challans, and Users |
| **SALES** | `sales@fundsroom.com` | `Password123!` | Create & edit Customers, log Follow-up notes, Create & Confirm Sales Challans |
| **WAREHOUSE** | `warehouse@fundsroom.com` | `Password123!` | Setup SKU catalog, log manual Stock IN/OUT, Confirm Delivery Dispatches |
| **ACCOUNTS** | `accounts@fundsroom.com` | `Password123!` | Financial views, capability to Cancel Sales Challans with stock restoration |

---

## 7. Post-Deployment Verification & Health Checks

After deployment, perform verification checks against the live environment:

### Health Check Endpoint
```bash
curl -X GET https://api.yourdomain.com/health
# Response: {"success":true,"data":{"status":"OK","service":"Mini ERP + CRM API Gateway","environment":"production"}}
```

### Functional Verification Sequence
1. **Login Test**: Perform `POST /api/auth/login` to confirm JWT token generation.
2. **CRM Test**: Fetch `GET /api/customers` to verify database connection.
3. **Inventory Test**: Fetch `GET /api/products` and `GET /api/products/low-stock`.
4. **Challan Test**: Create draft challan (`POST /api/challans`) and verify status `DRAFT` without stock deduction.
5. **Confirmation & Stock Deduction**: Confirm challan (`POST /api/challans/:id/confirm`) and verify product `currentStock` is decremented atomically.

---

## 8. Troubleshooting Guide

| Issue Symptom | Probable Cause | Recommended Resolution |
| :--- | :--- | :--- |
| `CORS Error` on Frontend API calls | `CORS_ORIGIN` does not match client domain | Update `CORS_ORIGIN` in backend environment settings to include the frontend URL (e.g. `https://erp.yourdomain.com`). |
| `401 Unauthorized` on API requests | Expired or missing Bearer token in header | Clear browser `localStorage` and log in again to acquire a fresh JWT token. |
| `INSUFFICIENT_STOCK` (HTTP 400) | Requested quantity exceeds product `currentStock` | Increase product stock balance via Stock `IN` movement (`POST /api/products/:id/stock-movement`). |
| Prisma DB Connection Timeout | Database URL invalid or firewall blocking port 5432 | Verify `DATABASE_URL` format and ensure cloud database accepts connections from backend server IP. |
