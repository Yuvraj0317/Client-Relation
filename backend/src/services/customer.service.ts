import { prisma } from '../prisma';
import { NotFoundError, ConflictError } from '../middlewares/error.middleware';
import { CustomerStatus, CustomerType } from '@prisma/client';

export class CustomerService {
  static async createCustomer(data: {
    name: string;
    mobile?: string;
    phone?: string;
    email?: string;
    businessName?: string;
    companyName?: string;
    gstNumber?: string;
    address: string;
    customerType: CustomerType;
    status: CustomerStatus;
    followUpDate?: string;
    notes?: string;
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

    const mobileNum = data.mobile || data.phone || '';
    const busName = data.businessName || data.companyName || null;

    return await prisma.customer.create({
      data: {
        name: data.name,
        mobile: mobileNum,
        phone: mobileNum,
        email: data.email ? data.email.toLowerCase() : null,
        businessName: busName,
        companyName: busName,
        gstNumber: data.gstNumber || null,
        address: data.address,
        customerType: data.customerType || CustomerType.RETAIL,
        status: data.status || CustomerStatus.LEAD,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
        notes: data.notes || null,
        createdById: data.createdById,
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
        { mobile: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
        { businessName: { contains: query.search, mode: 'insensitive' } },
        { companyName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { gstNumber: { contains: query.search, mode: 'insensitive' } },
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

    if (data.mobile || data.phone) {
      data.mobile = data.mobile || data.phone;
      data.phone = data.mobile;
    }

    if (data.businessName || data.companyName) {
      data.businessName = data.businessName || data.companyName;
      data.companyName = data.businessName;
    }

    if (data.followUpDate) {
      data.followUpDate = new Date(data.followUpDate);
    }

    return await prisma.customer.update({
      where: { id },
      data,
    });
  }

  static async deleteCustomer(id: string) {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      throw new NotFoundError(`Customer with ID '${id}' not found`);
    }

    return await prisma.customer.delete({
      where: { id },
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

    const followUp = await prisma.customerFollowUp.create({
      data: {
        customerId,
        note: data.note,
        followUpDate: new Date(data.followUpDate),
        createdById: userId,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    // Optionally update customer's latest followUpDate
    await prisma.customer.update({
      where: { id: customerId },
      data: { followUpDate: new Date(data.followUpDate) },
    });

    return followUp;
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
