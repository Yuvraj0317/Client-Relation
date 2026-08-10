import { prisma } from '../prisma';
import { NotFoundError, ConflictError } from '../middlewares/error.middleware';
import { CustomerStatus, CustomerType } from '@prisma/client';

export class CustomerService {
  static async createCustomer(data: {
    name: string;
    companyName?: string;
    email?: string;
    phone: string;
    address: string;
    customerType: CustomerType;
    status: CustomerStatus;
    createdById: string;
  }) {
    if (data.email) {
      const existing = await prisma.customer.findUnique({
        where: { email: data.email.toLowerCase() },
      });
      if (existing) {
        throw new ConflictError(`Customer with email '${data.email}' already exists`);
      }
    }

    return await prisma.customer.create({
      data: {
        ...data,
        email: data.email ? data.email.toLowerCase() : null,
      },
    });
  }

  static async getCustomers(query: {
    search?: string;
    customerType?: CustomerType;
    status?: CustomerStatus;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { companyName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.customerType) {
      where.customerType = query.customerType;
    }

    if (query.status) {
      where.status = query.status;
    }

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          _count: { select: { followUps: true, challans: true } },
        },
      }),
    ]);

    return {
      customers,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  static async getCustomerById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        followUps: {
          orderBy: { createdAt: 'desc' },
          include: { createdBy: { select: { id: true, name: true } } },
        },
        challans: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            challanNumber: true,
            status: true,
            totalAmount: true,
            createdAt: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundError(`Customer with ID '${id}' not found`);
    }

    return customer;
  }

  static async updateCustomer(id: string, data: any) {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      throw new NotFoundError(`Customer with ID '${id}' not found`);
    }

    if (data.email && data.email.toLowerCase() !== customer.email) {
      const existing = await prisma.customer.findUnique({
        where: { email: data.email.toLowerCase() },
      });
      if (existing) {
        throw new ConflictError(`Customer email '${data.email}' is already taken`);
      }
      data.email = data.email.toLowerCase();
    }

    return await prisma.customer.update({
      where: { id },
      data,
    });
  }

  static async addFollowUp(
    customerId: string,
    data: { note: string; followUpDate: string },
    userId: string
  ) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundError(`Customer with ID '${customerId}' not found`);
    }

    return await prisma.customerFollowUp.create({
      data: {
        customerId,
        note: data.note,
        followUpDate: new Date(data.followUpDate),
        createdById: userId,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });
  }

  static async getFollowUps(customerId: string) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundError(`Customer with ID '${customerId}' not found`);
    }

    return await prisma.customerFollowUp.findMany({
      where: { customerId },
      orderBy: { followUpDate: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  }
}
