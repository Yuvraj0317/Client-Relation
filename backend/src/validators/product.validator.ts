import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Product name is required'),
    sku: z.string().min(2, 'SKU code is required'),
    category: z.string().min(2, 'Category is required'),
    unitPrice: z.number({ invalid_type_error: 'Unit price must be a valid number' })
      .min(0, 'Unit price cannot be negative'),
    currentStock: z.number({ invalid_type_error: 'Current stock must be a valid number' })
      .int('Current stock must be an integer')
      .min(0, 'Current stock cannot be negative')
      .default(0),
    minStock: z.number().int().min(0, 'Minimum stock cannot be negative').optional(),
    minimumStock: z.number().int().min(0, 'Minimum stock cannot be negative').optional(),
    location: z.string().optional(),
    warehouse: z.string().optional(),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Product ID'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    sku: z.string().min(2).optional(),
    category: z.string().optional(),
    unitPrice: z.number().min(0, 'Unit price cannot be negative').optional(),
    currentStock: z.number().int().min(0, 'Current stock cannot be negative').optional(),
    minStock: z.number().int().min(0, 'Minimum stock cannot be negative').optional(),
    minimumStock: z.number().int().min(0, 'Minimum stock cannot be negative').optional(),
    location: z.string().optional(),
    warehouse: z.string().optional(),
  }),
});

export const stockMovementSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Product ID').optional(),
  }),
  body: z.object({
    productId: z.string().uuid('Invalid Product ID').optional(),
    type: z.enum(['IN', 'OUT']),
    quantity: z.number().int().positive('Movement quantity must be a positive integer'),
    remarks: z.string().optional(),
    reason: z.string().optional(),
    referenceId: z.string().optional(),
  }),
});
