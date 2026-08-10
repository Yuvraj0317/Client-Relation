import { z } from 'zod';

export const createCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Customer name is required'),
    companyName: z.string().optional(),
    email: z.string().email('Invalid email format').optional().or(z.literal('')),
    phone: z.string().min(5, 'Phone number is required'),
    address: z.string().min(3, 'Address is required'),
    customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']).default('RETAIL'),
    status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).default('LEAD'),
  }),
});

export const updateCustomerSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Customer ID'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    companyName: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().min(5).optional(),
    address: z.string().min(3).optional(),
    customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']).optional(),
    status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).optional(),
  }),
});

export const createFollowUpSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Customer ID'),
  }),
  body: z.object({
    note: z.string().min(2, 'Follow-up note content is required'),
    followUpDate: z.string().datetime({ message: 'Must be a valid ISO date string' }),
  }),
});
