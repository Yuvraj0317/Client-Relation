import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Product name must be at least 2 characters'),
    sku: z.string().min(2, 'SKU code must be at least 2 characters'),
    category: z.string().min(2, 'Category is required'),
    unitPrice: z.number().positive('Unit price must be a positive number'),
    currentStock: z.number().int().nonnegative('Current stock cannot be negative').default(0),
    minStock: z.number().int().nonnegative('Minimum stock threshold cannot be negative').default(5),
    location: z.string().default('Main Warehouse'),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Product ID'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    sku: z.string().min(2).optional(),
    category: z.string().min(2).optional(),
    unitPrice: z.number().positive().optional(),
    currentStock: z.number().int().nonnegative().optional(),
    minStock: z.number().int().nonnegative().optional(),
    location: z.string().optional(),
  }),
});

export const stockMovementSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Product ID'),
  }),
  body: z.object({
    type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
    quantity: z.number().int().positive('Quantity must be greater than zero'),
    remarks: z.string().optional(),
  }),
});

export const listProductsQuerySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    category: z.string().optional(),
    lowStockOnly: z.enum(['true', 'false']).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});
