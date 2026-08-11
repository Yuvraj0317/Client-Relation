import { prisma } from '../prisma';
import { NotFoundError, AppError, InsufficientStockError } from '../middlewares/error.middleware';
import { ChallanStatus, MovementType, Prisma } from '@prisma/client';

export class SalesChallanService {
  /**
   * Helper to generate unique sequential Challan Number (e.g. CH-202608-0001)
   */
  private static async generateChallanNumber(): Promise<string> {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `CH-${yearMonth}-`;

    const lastChallan = await prisma.challan.findFirst({
      where: { challanNumber: { startsWith: prefix } },
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

  static async createDraftChallan(data: {
    customerId: string;
    notes?: string;
    items: { productId: string; quantity: number }[];
    createdById: string;
  }) {
    // 1. Verify Customer exists
    const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
    if (!customer) {
      throw new NotFoundError(`Customer with ID '${data.customerId}' not found`);
    }

    // 2. Fetch product details and build snapshots & line totals
    const itemDataList = [];
    let totalAmount = new Prisma.Decimal(0);

    for (const item of data.items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        throw new NotFoundError(`Product with ID '${item.productId}' not found`);
      }

      const unitPrice = product.unitPrice;
      const lineTotal = new Prisma.Decimal(unitPrice.toString()).mul(item.quantity);
      totalAmount = totalAmount.add(lineTotal);

      itemDataList.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        unitPrice,
        quantity: item.quantity,
      });
    }

    const challanNumber = await this.generateChallanNumber();

    // 3. Create Draft Challan
    return await prisma.challan.create({
      data: {
        challanNumber,
        customerId: data.customerId,
        notes: data.notes,
        status: ChallanStatus.DRAFT,
        totalAmount,
        createdById: data.createdById,
        items: {
          create: itemDataList,
        },
      },
      include: {
        customer: true,
        items: { include: { product: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  static async getChallans(query: {
    status?: ChallanStatus;
    customerId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.customerId) {
      where.customerId = query.customerId;
    }

    if (query.search) {
      where.OR = [
        { challanNumber: { contains: query.search, mode: 'insensitive' } },
        { customer: { name: { contains: query.search, mode: 'insensitive' } } },
        { customer: { companyName: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [total, challans] = await Promise.all([
      prisma.challan.count({ where }),
      prisma.challan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, companyName: true, phone: true } },
          createdBy: { select: { id: true, name: true } },
          confirmedBy: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
      }),
    ]);

    return {
      challans,
      meta: { page, limit, total },
    };
  }

  static async getChallanById(id: string) {
    const challan = await prisma.challan.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: { select: { id: true, name: true, email: true } },
        confirmedBy: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, currentStock: true, minStock: true } },
          },
        },
      },
    });

    if (!challan) {
      throw new NotFoundError(`Sales Challan with ID '${id}' not found`);
    }

    return challan;
  }

  /**
   * Confirm Sales Challan — Atomic Stock Deduction Transaction
   */
  static async confirmChallan(challanId: string, userId: string) {
    return await prisma.$transaction(async tx => {
      // 1. Fetch Challan & Items
      const challan = await tx.challan.findUnique({
        where: { id: challanId },
        include: { items: true },
      });

      if (!challan) {
        throw new NotFoundError(`Sales Challan with ID '${challanId}' not found`);
      }

      if (challan.status !== ChallanStatus.DRAFT) {
        throw new AppError(
          `Cannot confirm Challan. Current status is '${challan.status}', expected 'DRAFT'`,
          400,
          'INVALID_STATUS_TRANSITION'
        );
      }

      // 2. Validate Stock for ALL items first
      for (const item of challan.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) {
          throw new NotFoundError(`Product '${item.productName}' no longer exists`);
        }

        if (product.currentStock < item.quantity) {
          throw new InsufficientStockError(
            `Insufficient stock for '${product.name}' (SKU: ${product.sku}). Requested: ${item.quantity}, Available: ${product.currentStock}`
          );
        }
      }

      // 3. Perform atomic stock deduction & log movements
      for (const item of challan.items) {
        // Decrement stock in DB
        const updatedProduct = await tx.product.updateMany({
          where: {
            id: item.productId,
            currentStock: { gte: item.quantity },
          },
          data: {
            currentStock: { decrement: item.quantity },
          },
        });

        if (updatedProduct.count === 0) {
          throw new InsufficientStockError(
            `Stock changed concurrently for item '${item.productName}'`
          );
        }

        // Create immutable StockMovement audit log
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: MovementType.OUT,
            quantity: item.quantity,
            referenceId: challan.id,
            remarks: `Dispatch stock deduction for Challan #${challan.challanNumber}`,
            createdById: userId,
          },
        });
      }

      // 4. Update Challan Status to CONFIRMED
      return await tx.challan.update({
        where: { id: challanId },
        data: {
          status: ChallanStatus.CONFIRMED,
          confirmedById: userId,
          confirmedAt: new Date(),
        },
        include: {
          customer: true,
          items: true,
          confirmedBy: { select: { id: true, name: true } },
        },
      });
    });
  }

  /**
   * Cancel Sales Challan — Restores Stock if previously CONFIRMED
   */
  static async cancelChallan(challanId: string, userId: string) {
    return await prisma.$transaction(async tx => {
      const challan = await tx.challan.findUnique({
        where: { id: challanId },
        include: { items: true },
      });

      if (!challan) {
        throw new NotFoundError(`Sales Challan with ID '${challanId}' not found`);
      }

      if (challan.status === ChallanStatus.CANCELLED) {
        throw new AppError('Challan is already cancelled', 400, 'ALREADY_CANCELLED');
      }

      // If challan was CONFIRMED, restore stock
      if (challan.status === ChallanStatus.CONFIRMED) {
        for (const item of challan.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { increment: item.quantity } },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: MovementType.IN,
              quantity: item.quantity,
              referenceId: challan.id,
              remarks: `Stock restored from cancelled Challan #${challan.challanNumber}`,
              createdById: userId,
            },
          });
        }
      }

      // Set status to CANCELLED
      return await tx.challan.update({
        where: { id: challanId },
        data: { status: ChallanStatus.CANCELLED },
        include: {
          customer: true,
          items: true,
        },
      });
    });
  }
}
