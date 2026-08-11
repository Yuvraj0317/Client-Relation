import { prisma } from '../prisma';
import { NotFoundError, BadRequestError, InsufficientStockError } from '../middlewares/error.middleware';
import { ChallanStatus, MovementType } from '@prisma/client';

export class SalesChallanService {
  private static async generateChallanNumber(): Promise<string> {
    const date = new Date();
    const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `CH-${yearMonth}-`;

    const lastChallan = await prisma.challan.findFirst({
      where: {
        challanNumber: { startsWith: prefix },
      },
      orderBy: { challanNumber: 'desc' },
    });

    let sequence = 1;
    if (lastChallan) {
      const parts = lastChallan.challanNumber.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }

    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }

  static async createChallan(data: {
    customerId: string;
    notes?: string;
    items: Array<{ productId: string; quantity: number; unitPrice?: number }>;
    createdById: string;
  }) {
    const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
    if (!customer) {
      throw new NotFoundError(`Customer with ID '${data.customerId}' not found`);
    }

    if (!data.items || data.items.length === 0) {
      throw new BadRequestError('Challan must contain at least one product item');
    }

    // Business Rule 6: A product should not appear twice in the same challan
    const productIds = data.items.map((i) => i.productId);
    const uniqueProductIds = new Set(productIds);
    if (uniqueProductIds.size !== productIds.length) {
      throw new BadRequestError('A product cannot appear twice in the same delivery challan');
    }

    // Business Rule 3: Product quantity must be greater than zero
    for (const item of data.items) {
      if (!item.quantity || item.quantity <= 0) {
        throw new BadRequestError('Product quantity must be greater than zero');
      }
    }

    // Business Rule 5: Every product must exist in master catalog
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      throw new NotFoundError('One or more product items were not found in master catalog');
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    let totalAmount = 0;
    let totalQuantity = 0;

    const challanItemsData = data.items.map((item) => {
      const prod = productMap.get(item.productId)!;
      const itemUnitPrice = item.unitPrice !== undefined ? item.unitPrice : Number(prod.unitPrice);
      const itemTotal = itemUnitPrice * item.quantity;
      totalAmount += itemTotal;
      totalQuantity += item.quantity;

      // Business Rule 8: Snapshot product data
      return {
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        unitPrice: itemUnitPrice,
        quantity: item.quantity,
      };
    });

    const challanNumber = await this.generateChallanNumber();

    const challan = await prisma.challan.create({
      data: {
        challanNumber,
        customerId: data.customerId,
        notes: data.notes || null,
        totalAmount,
        status: ChallanStatus.DRAFT,
        createdById: data.createdById,
        items: {
          create: challanItemsData,
        },
      },
      include: {
        customer: { select: { id: true, name: true, businessName: true, companyName: true, email: true, mobile: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        items: true,
      },
    });

    return {
      ...challan,
      totalQuantity,
    };
  }

  static async getChallans(query: {
    search?: string;
    status?: ChallanStatus;
    customerId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { challanNumber: { contains: query.search, mode: 'insensitive' } },
        { customer: { name: { contains: query.search, mode: 'insensitive' } } },
        { customer: { businessName: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.customerId) {
      where.customerId = query.customerId;
    }

    const [total, challans] = await Promise.all([
      prisma.challan.count({ where }),
      prisma.challan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, businessName: true, companyName: true, email: true, mobile: true } },
          createdBy: { select: { id: true, name: true } },
          confirmedBy: { select: { id: true, name: true } },
          items: true,
        },
      }),
    ]);

    const formattedChallans = challans.map((ch) => ({
      ...ch,
      totalQuantity: ch.items.reduce((sum, item) => sum + item.quantity, 0),
    }));

    return {
      challans: formattedChallans,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  static async getChallanById(id: string) {
    const challan = await prisma.challan.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, businessName: true, companyName: true, email: true, mobile: true, address: true, gstNumber: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        confirmedBy: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, currentStock: true, minStock: true, location: true } },
          },
        },
      },
    });

    if (!challan) {
      throw new NotFoundError(`Delivery Challan with ID '${id}' not found`);
    }

    const totalQuantity = challan.items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      ...challan,
      totalQuantity,
    };
  }

  static async confirmChallan(id: string, userId: string) {
    return await prisma.$transaction(async (tx) => {
      const challan = await tx.challan.findUnique({
        where: { id },
        include: { items: true, customer: true },
      });

      if (!challan) {
        throw new NotFoundError(`Delivery Challan with ID '${id}' not found`);
      }

      // Business Rule 11: A confirmed challan cannot be confirmed again
      if (challan.status === ChallanStatus.CONFIRMED) {
        throw new BadRequestError(`Challan '${challan.challanNumber}' is already confirmed`);
      }

      // Business Rule 12: A cancelled challan cannot be confirmed
      if (challan.status === ChallanStatus.CANCELLED) {
        throw new BadRequestError(`Cannot confirm cancelled Challan '${challan.challanNumber}'`);
      }

      // Business Rule 9 & 10: Atomic verification inside ONE transaction block
      for (const item of challan.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) {
          throw new NotFoundError(`Product '${item.productName}' (SKU: ${item.sku}) not found in database`);
        }

        // Verify stock sufficiency to prevent negative stock
        if (product.currentStock < item.quantity) {
          throw new InsufficientStockError(
            `Insufficient stock for product '${product.name}' (SKU: ${product.sku}). Available: ${product.currentStock}, Required: ${item.quantity}`
          );
        }
      }

      // Deduct product stock and log OUT stock movement entries
      for (const item of challan.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: { decrement: item.quantity },
          },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: MovementType.OUT,
            quantity: item.quantity,
            referenceId: challan.id,
            remarks: `Delivery Challan dispatch '${challan.challanNumber}' for customer '${challan.customer.name}'`,
            reason: `Delivery Challan dispatch '${challan.challanNumber}' for customer '${challan.customer.name}'`,
            createdById: userId,
          },
        });
      }

      // Update status to CONFIRMED
      const updatedChallan = await tx.challan.update({
        where: { id },
        data: {
          status: ChallanStatus.CONFIRMED,
          confirmedAt: new Date(),
          confirmedById: userId,
        },
        include: {
          customer: { select: { id: true, name: true } },
          confirmedBy: { select: { id: true, name: true } },
          items: true,
        },
      });

      return {
        ...updatedChallan,
        totalQuantity: updatedChallan.items.reduce((sum, i) => sum + i.quantity, 0),
      };
    });
  }

  static async cancelChallan(id: string, userId: string) {
    return await prisma.$transaction(async (tx) => {
      const challan = await tx.challan.findUnique({
        where: { id },
        include: { items: true, customer: true },
      });

      if (!challan) {
        throw new NotFoundError(`Delivery Challan with ID '${id}' not found`);
      }

      if (challan.status === ChallanStatus.CANCELLED) {
        throw new BadRequestError(`Challan '${challan.challanNumber}' is already cancelled`);
      }

      // Business Rule 13: If a confirmed challan is cancelled, restore deducted stock and log IN reversal movements
      if (challan.status === ChallanStatus.CONFIRMED) {
        for (const item of challan.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              currentStock: { increment: item.quantity },
            },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: MovementType.IN,
              quantity: item.quantity,
              referenceId: challan.id,
              remarks: `Stock restoration on Challan cancellation '${challan.challanNumber}'`,
              reason: `Stock restoration on Challan cancellation '${challan.challanNumber}'`,
              createdById: userId,
            },
          });
        }
      }

      const updatedChallan = await tx.challan.update({
        where: { id },
        data: {
          status: ChallanStatus.CANCELLED,
        },
        include: {
          customer: { select: { id: true, name: true } },
          items: true,
        },
      });

      return {
        ...updatedChallan,
        totalQuantity: updatedChallan.items.reduce((sum, i) => sum + i.quantity, 0),
      };
    });
  }
}
