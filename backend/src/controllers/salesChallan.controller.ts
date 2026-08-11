import { Request, Response, NextFunction } from 'express';
import { SalesChallanService } from '../services/salesChallan.service';
import { ApiResponse } from '../utils/apiResponse';
import { UnauthorizedError } from '../middlewares/error.middleware';
import { ChallanStatus } from '@prisma/client';

export class SalesChallanController {
  static async createDraft(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const challan = await SalesChallanService.createDraftChallan({
        ...req.body,
        createdById: req.user.userId,
      });
      return ApiResponse.success(res, challan, undefined, 201);
    } catch (error) {
      return next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const search = req.query.search as string;
      const customerId = req.query.customerId as string;
      const status = req.query.status as ChallanStatus;

      const result = await SalesChallanService.getChallans({
        status,
        customerId,
        search,
        page,
        limit,
      });

      return ApiResponse.success(res, result.challans, result.meta);
    } catch (error) {
      return next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const challan = await SalesChallanService.getChallanById(req.params.id);
      return ApiResponse.success(res, challan);
    } catch (error) {
      return next(error);
    }
  }

  static async confirm(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const challan = await SalesChallanService.confirmChallan(
        req.params.id,
        req.user.userId
      );
      return ApiResponse.success(res, challan);
    } catch (error) {
      return next(error);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const challan = await SalesChallanService.cancelChallan(
        req.params.id,
        req.user.userId
      );
      return ApiResponse.success(res, challan);
    } catch (error) {
      return next(error);
    }
  }
}
