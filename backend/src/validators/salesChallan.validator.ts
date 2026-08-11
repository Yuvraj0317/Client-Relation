import { z } from 'zod';

export const createChallanSchema = z.object({
  body: z.object({
    customerId: z.string().uuid('Invalid Customer ID'),
    notes: z.string().optional(),
    items: z.array(
      z.object({
        productId: z.string().uuid('Invalid Product ID'),
        quantity: z.number().int().positive('Item quantity must be a positive integer'),
        unitPrice: z.number().min(0, 'Unit price cannot be negative').optional(),
      })
    ).min(1, 'Delivery Challan must contain at least one item'),
  }),
});

export const updateChallanSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Challan ID'),
  }),
  body: z.object({
    notes: z.string().optional(),
    items: z.array(
      z.object({
        productId: z.string().uuid('Invalid Product ID'),
        quantity: z.number().int().positive(),
        unitPrice: z.number().min(0).optional(),
      })
    ).optional(),
  }),
});
