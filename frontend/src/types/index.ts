export type Role = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

export type CustomerType = 'RETAILER' | 'WHOLESALER' | 'DISTRIBUTOR' | 'DIRECT';
export type CustomerStatus = 'LEAD' | 'PROSPECT' | 'ACTIVE' | 'INACTIVE';

export interface CustomerFollowUp {
  id: string;
  customerId: string;
  note: string;
  followUpDate: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  createdById: string;
  createdBy?: { id: string; name: string; email?: string };
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  companyName?: string;
  email?: string;
  phone: string;
  address: string;
  customerType: CustomerType;
  status: CustomerStatus;
  createdById: string;
  createdBy?: { id: string; name: string; email?: string };
  createdAt: string;
  updatedAt: string;
  followUps?: CustomerFollowUp[];
  _count?: { followUps: number; salesChallans: number };
}

export interface StockMovement {
  id: string;
  productId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  referenceType: 'MANUAL' | 'SALES_CHALLAN' | 'RETURN';
  referenceId?: string;
  remarks?: string;
  createdById: string;
  createdBy?: { id: string; name: string };
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minStock: number;
  location: string;
  createdById: string;
  createdBy?: { id: string; name: string; email?: string };
  movements?: StockMovement[];
  createdAt: string;
  updatedAt: string;
}

export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface ChallanItem {
  id: string;
  challanId: string;
  productId: string;
  productName: string;
  productSku: string;
  unitPriceSnapshot: number;
  quantity: number;
  lineTotal: number;
  product?: Product;
}

export interface SalesChallan {
  id: string;
  challanNumber: string;
  customerId: string;
  customer?: Customer;
  status: ChallanStatus;
  totalAmount: number;
  notes?: string;
  createdById: string;
  createdBy?: { id: string; name: string; email?: string };
  confirmedById?: string;
  confirmedBy?: { id: string; name: string; email?: string };
  confirmedAt?: string;
  items?: ChallanItem[];
  createdAt: string;
  updatedAt: string;
  _count?: { items: number };
}
