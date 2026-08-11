import { prisma } from '../prisma';
import { ConflictError, NotFoundError, InsufficientStockError } from '../middlewares/error.middleware';
import { MovementType } from '@prisma/client';

export class ProductService {
  static async createProduct(data: {
    name: string;
    sku: string;
    category: string;
    unitPrice: number;
    currentStock: number;
    minStock: number;
    location: string;
    createdById: string;
  }) {
    const existing = await prisma.product.findUnique({
      where: { sku: data.sku.toUpperCase() },
    });

    if (existing) {
      throw new ConflictError(`Product with SKU '${data.sku}' already exists`);
    }

    const product = await prisma.product.create({
      data: {
        ...data,
        sku: data.sku.toUpperCase(),
      },
    });

    // Log initial stock movement if initial stock > 0
    if (data.currentStock > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          type: 'IN',
          quantity: data.currentStock,
          remarks: 'Initial stock setup during product creation',
          createdById: data.createdById,
        },
      });
    }

    return product;
  }

  static async getProducts(query: {
    search?: string;
    category?: string;
    lowStockOnly?: boolean;
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
        { sku: { contains: query.search, mode: 'insensitive' } },
        { category: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.category) {
      where.category = { equals: query.category, mode: 'insensitive' };
    }

    let products = await prisma.product.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (query.lowStockOnly) {
      products = products.filter(p => p.currentStock <= p.minStock);
    }

    const total = products.length;
    const paginatedProducts = products.slice(skip, skip + limit);

    return {
      products: paginatedProducts,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  static async getLowStockProducts() {
    const allProducts = await prisma.product.findMany({
      orderBy: { currentStock: 'asc' },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    return allProducts.filter(p => p.currentStock <= p.minStock);
  }

  static async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        movements: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: { createdBy: { select: { id: true, name: true } } },
        },
      },
    });

    if (!product) {
      throw new NotFoundError(`Product with ID '${id}' not found`);
    }

    return product;
  }

  static async updateProduct(id: string, data: any) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundError(`Product with ID '${id}' not found`);
    }

    if (data.sku && data.sku.toUpperCase() !== product.sku) {
      const existing = await prisma.product.findUnique({
        where: { sku: data.sku.toUpperCase() },
      });
      if (existing) {
        throw new ConflictError(`Product SKU '${data.sku}' is already taken`);
      }
      data.sku = data.sku.toUpperCase();
    }

    return await prisma.product.update({
      where: { id },
      data,
    });
  }

  static async logStockMovement(
    productId: string,
    movement: { type: MovementType; quantity: number; remarks?: string },
    userId: string
  ) {
    return await prisma.$transaction(async tx => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) {
        throw new NotFoundError(`Product with ID '${productId}' not found`);
      }

      let newStock = product.currentStock;
      if (movement.type === 'IN') {
        newStock += movement.quantity;
      } else if (movement.type === 'OUT') {
        if (product.currentStock < movement.quantity) {
          throw new InsufficientStockError(
            `Insufficient stock for '${product.name}'. Required: ${movement.quantity}, Available: ${product.currentStock}`
          );
        }
        newStock -= movement.quantity;
      }

      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { currentStock: newStock },
      });

      const log = await tx.stockMovement.create({
        data: {
          productId,
          type: movement.type,
          quantity: movement.quantity,
          remarks: movement.remarks || `Manual stock ${movement.type} movement`,
          createdById: userId,
        },
      });

      return { product: updatedProduct, movementLog: log };
    });
  }

  static async getStockLogs(productId: string) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundError(`Product with ID '${productId}' not found`);
    }

    return await prisma.stockMovement.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }
}
