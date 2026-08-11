import { prisma } from '../prisma';
import { NotFoundError, ConflictError, BadRequestError } from '../middlewares/error.middleware';
import { MovementType } from '@prisma/client';

export class ProductService {
  static async createProduct(data: {
    name: string;
    sku: string;
    category: string;
    unitPrice: number;
    currentStock?: number;
    minStock?: number;
    minimumStock?: number;
    location?: string;
    warehouse?: string;
    createdById: string;
  }) {
    if (data.unitPrice < 0) {
      throw new BadRequestError('Unit price cannot be negative');
    }

    const currentStock = data.currentStock !== undefined ? data.currentStock : 0;
    if (currentStock < 0) {
      throw new BadRequestError('Current stock cannot be negative');
    }

    const minStockVal = data.minimumStock !== undefined
      ? data.minimumStock
      : (data.minStock !== undefined ? data.minStock : 5);

    if (minStockVal < 0) {
      throw new BadRequestError('Minimum stock cannot be negative');
    }

    const warehouseLocation = data.warehouse || data.location || 'Main Warehouse';
    const normalizedSku = data.sku.toUpperCase().trim();

    const existing = await prisma.product.findUnique({
      where: { sku: normalizedSku },
    });
    if (existing) {
      throw new ConflictError(`Product SKU '${normalizedSku}' already exists`);
    }

    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: data.name,
          sku: normalizedSku,
          category: data.category,
          unitPrice: data.unitPrice,
          currentStock,
          minStock: minStockVal,
          minimumStock: minStockVal,
          location: warehouseLocation,
          warehouse: warehouseLocation,
          createdById: data.createdById,
        },
      });

      // Initial Stock Movement audit log if stock > 0
      if (currentStock > 0) {
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            type: MovementType.IN,
            quantity: currentStock,
            remarks: 'Initial stock intake on SKU registration',
            reason: 'Initial stock intake on SKU registration',
            createdById: data.createdById,
          },
        });
      }

      return {
        ...product,
        minimumStock: product.minStock,
        warehouse: product.location,
        isLowStock: product.currentStock <= product.minStock,
      };
    });
  }

  static async getProducts(query: {
    search?: string;
    category?: string;
    lowStock?: boolean;
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
        { warehouse: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.category) {
      where.category = { equals: query.category, mode: 'insensitive' };
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    const formattedProducts = products.map((prod) => ({
      ...prod,
      minimumStock: prod.minStock,
      warehouse: prod.location,
      isLowStock: prod.currentStock <= prod.minStock,
    }));

    const finalProducts = query.lowStock
      ? formattedProducts.filter((p) => p.isLowStock)
      : formattedProducts;

    return {
      products: finalProducts,
      meta: {
        page,
        limit,
        total: query.lowStock ? finalProducts.length : total,
      },
    };
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

    return {
      ...product,
      minimumStock: product.minStock,
      warehouse: product.location,
      isLowStock: product.currentStock <= product.minStock,
    };
  }

  static async updateProduct(id: string, data: any) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundError(`Product with ID '${id}' not found`);
    }

    if (data.unitPrice !== undefined && data.unitPrice < 0) {
      throw new BadRequestError('Unit price cannot be negative');
    }

    if (data.currentStock !== undefined && data.currentStock < 0) {
      throw new BadRequestError('Current stock cannot be negative');
    }

    if (data.minimumStock !== undefined || data.minStock !== undefined) {
      const minStockVal = data.minimumStock !== undefined ? data.minimumStock : data.minStock;
      if (minStockVal < 0) throw new BadRequestError('Minimum stock cannot be negative');
      data.minStock = minStockVal;
      data.minimumStock = minStockVal;
    }

    if (data.warehouse || data.location) {
      const wh = data.warehouse || data.location;
      data.location = wh;
      data.warehouse = wh;
    }

    if (data.sku) {
      const normalizedSku = data.sku.toUpperCase().trim();
      if (normalizedSku !== product.sku) {
        const existing = await prisma.product.findUnique({
          where: { sku: normalizedSku },
        });
        if (existing) {
          throw new ConflictError(`Product SKU '${normalizedSku}' is already taken`);
        }
        data.sku = normalizedSku;
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data,
    });

    return {
      ...updated,
      minimumStock: updated.minStock,
      warehouse: updated.location,
      isLowStock: updated.currentStock <= updated.minStock,
    };
  }

  static async deleteProduct(id: string) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundError(`Product with ID '${id}' not found`);
    }

    return await prisma.product.delete({
      where: { id },
    });
  }

  static async logStockMovement(
    productId: string,
    data: { type: MovementType; quantity: number; remarks?: string; reason?: string; referenceId?: string },
    userId: string
  ) {
    if (data.quantity <= 0) {
      throw new BadRequestError('Movement quantity must be greater than zero');
    }

    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) {
        throw new NotFoundError(`Product with ID '${productId}' not found`);
      }

      let newStock = product.currentStock;
      const reasonText = data.reason || data.remarks || 'Stock movement log';

      if (data.type === MovementType.IN) {
        newStock += data.quantity;
      } else if (data.type === MovementType.OUT) {
        if (product.currentStock < data.quantity) {
          throw new BadRequestError(
            `Insufficient stock for SKU '${product.sku}'. Current stock: ${product.currentStock}, Requested deduction: ${data.quantity}`
          );
        }
        newStock -= data.quantity;
      }

      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { currentStock: newStock },
      });

      const movement = await tx.stockMovement.create({
        data: {
          productId,
          type: data.type,
          quantity: data.quantity,
          referenceId: data.referenceId || null,
          remarks: reasonText,
          reason: reasonText,
          createdById: userId,
        },
        include: {
          product: { select: { id: true, name: true, sku: true } },
          createdBy: { select: { id: true, name: true, email: true } },
        },
      });

      return {
        product: {
          ...updatedProduct,
          minimumStock: updatedProduct.minStock,
          warehouse: updatedProduct.location,
          isLowStock: updatedProduct.currentStock <= updatedProduct.minStock,
        },
        movement: {
          ...movement,
          timestamp: movement.createdAt,
        },
      };
    });
  }

  static async getAllStockMovements(query?: { page?: number; limit?: number }) {
    const page = Math.max(1, query?.page || 1);
    const limit = Math.max(1, Math.min(100, query?.limit || 20));
    const skip = (page - 1) * limit;

    const [total, movements] = await Promise.all([
      prisma.stockMovement.count(),
      prisma.stockMovement.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, name: true, sku: true, category: true } },
          createdBy: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    const formatted = movements.map((m) => ({
      id: m.id,
      productId: m.productId,
      product: m.product,
      quantity: m.quantity,
      type: m.type,
      reason: m.reason || m.remarks,
      createdBy: m.createdBy,
      timestamp: m.createdAt,
      createdAt: m.createdAt,
    }));

    return {
      movements: formatted,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  static async getStockLogs(productId: string) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundError(`Product with ID '${productId}' not found`);
    }

    const movements = await prisma.stockMovement.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return movements.map((m) => ({
      ...m,
      reason: m.reason || m.remarks,
      timestamp: m.createdAt,
    }));
  }
}
