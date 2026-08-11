import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service';
import { ApiResponse } from '../utils/apiResponse';
import { UnauthorizedError } from '../middlewares/error.middleware';

export class ProductController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const product = await ProductService.createProduct({
        ...req.body,
        createdById: req.user.userId,
      });
      return ApiResponse.success(res, product, undefined, 201);
    } catch (error) {
      return next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const search = req.query.search as string;
      const category = req.query.category as string;
      const lowStock = req.query.lowStock === 'true';

      const result = await ProductService.getProducts({
        search,
        category,
        lowStock,
        page,
        limit,
      });

      return ApiResponse.success(res, result.products, result.meta);
    } catch (error) {
      return next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.getProductById(req.params.id);
      return ApiResponse.success(res, product);
    } catch (error) {
      return next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.updateProduct(req.params.id, req.body);
      return ApiResponse.success(res, product);
    } catch (error) {
      return next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await ProductService.deleteProduct(req.params.id);
      return ApiResponse.success(res, { message: 'Product deleted successfully' });
    } catch (error) {
      return next(error);
    }
  }

  static async stockMovement(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const productId = req.params.id || req.body.productId;
      const result = await ProductService.logStockMovement(
        productId,
        req.body,
        req.user.userId
      );
      return ApiResponse.success(res, result, undefined, 201);
    } catch (error) {
      return next(error);
    }
  }

  static async getStockLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await ProductService.getStockLogs(req.params.id);
      return ApiResponse.success(res, logs);
    } catch (error) {
      return next(error);
    }
  }

  static async getAllMovements(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await ProductService.getAllStockMovements({ page, limit });
      return ApiResponse.success(res, result.movements, result.meta);
    } catch (error) {
      return next(error);
    }
  }
}
