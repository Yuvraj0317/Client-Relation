import { z } from 'zod';

export const challanItemInputSchema = z.object({
  productId: z.string().uuid('Invalid Product ID'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
});

export const createSalesChallanSchema = z.object({
  body: z.object({
    customerId: z.string().uuid('Invalid Customer ID'),
    notes: z.string().optional(),
    items: z.array(challanItemInputSchema).min(1, 'Challan must contain at least 1 product item'),
  }),
});

export const updateSalesChallanSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Challan ID'),
  }),
  body: z.object({
    customerId: z.string().uuid('Invalid Customer ID').optional(),
    notes: z.string().optional(),
    items: z.array(challanItemInputSchema).min(1, 'Challan must contain at least 1 product item').optional(),
  }),
});

export const listSalesChallansQuerySchema = z.object({
  query: z.object({
    status: z.enum(['DRAFT', 'CONFIRMED', 'CANCELLED']).optional(),
    customerId: z.string().uuid().optional(),
    search: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});
