# Mini ERP + CRM Operations Portal - Frontend Architecture Plan

## 1. UI & Visual Design Framework

- **Framework**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + Custom CSS Theme Design System
- **Iconography**: Lucide React Icons (`lucide-react`)
- **Color Palette**:
  - Primary / Slate Dark Sidebar: `bg-slate-900`, `text-slate-100`
  - Accent Brand Blue: `#2563eb` (Tailwind `blue-600`)
  - Status Badges:
    - `CONFIRMED` / `ACTIVE` / `IN_STOCK`: Green (`bg-emerald-100 text-emerald-800 border-emerald-300`)
    - `DRAFT` / `PROSPECT` / `LOW_STOCK`: Amber (`bg-amber-100 text-amber-800 border-amber-300`)
    - `CANCELLED` / `INACTIVE` / `OUT_OF_STOCK`: Red (`bg-rose-100 text-rose-800 border-rose-300`)

---

## 2. Component Hierarchy & Navigation Flow

```
[ App Root ]
  ├── AuthProvider (JWT, User Session, Role Permissions)
  └── Router
       ├── /login -> Login Page (with 1-click Demo Role Credentials loader)
       └── Protected Layout (Sidebar + Top Navbar + Notification Banner)
            ├── /dashboard -> Dashboard Overview Page
            ├── /customers -> Customer CRM List & Modals
            ├── /customers/:id -> Customer Detail & Follow-up Timeline
            ├── /inventory -> Inventory Management & Stock Movement Log
            ├── /sales-challans -> Sales Challan List
            ├── /sales-challans/new -> Challan Builder Page
            └── /sales-challans/:id -> Challan View & Print Mode
```

---

## 3. Screen Specs & Key User Flows

### 3.1 Login & Demo Mode Switcher
- Modern centered glassmorphism login box.
- Includes instant credential autofill buttons for:
  - 🔑 Admin (`admin@fundsroom.com`)
  - 💼 Sales Manager (`sales@fundsroom.com`)
  - 📦 Warehouse Manager (`warehouse@fundsroom.com`)
  - 💳 Accounts Officer (`accounts@fundsroom.com`)

### 3.2 Dashboard Page
- **KPI Metrics Cards**:
  - Total Active Customers & Leads
  - Total SKU Inventory Count
  - Low Stock Warning Alert Counter (clickable filter to Inventory)
  - Pending Draft Challans Count
  - Total Confirmed Sales Revenue
- **Quick Action Bar**: "New Customer", "Add Product", "Stock In/Out", "Create Challan".

### 3.3 Customer CRM Module
- Search input for real-time customer/company filtering.
- Dropdown filters for Customer Type (`RETAILER`, `WHOLESALER`, `DISTRIBUTOR`) and Status (`LEAD`, `PROSPECT`, `ACTIVE`).
- Customer Detail View displaying contact details, order history, and a rich vertical timeline of follow-up notes with scheduled next-action dates.

### 3.4 Inventory & Stock Movement Module
- High-visibility badges for Low Stock items (`currentStock <= minStock`).
- Filter tab for "All Items" vs "Low Stock Alerts Only".
- **Stock Movement Modal**: Choose `IN` or `OUT`, specify quantity and reference notes. Immediately updates DB stock and logs immutable record.

### 3.5 Sales Challan Builder & Dispatch Engine
- Customer selection dropdown with search.
- Dynamic line item editor:
  - Add product dropdown (displays live available stock alongside price).
  - Quantity input (with real-time warning if requested > currentStock).
  - Automatic line total and overall total computation.
- Action Buttons:
  - "Save as Draft" (Creates DRAFT status, zero stock impact).
  - "Confirm & Deduct Stock" (Triggers server transaction, validates stock, deducts inventory, changes status to CONFIRMED).
- Print View: Clean printable Delivery Challan invoice format.
