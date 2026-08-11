import { Request, Response, NextFunction } from 'express';
import { CustomerService } from '../services/customer.service';
import { ApiResponse } from '../utils/apiResponse';
import { UnauthorizedError } from '../middlewares/error.middleware';
import { CustomerStatus, CustomerType } from '@prisma/client';

export class CustomerController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const customer = await CustomerService.createCustomer({
        ...req.body,
        createdById: req.user.userId,
      });
      return ApiResponse.success(res, customer, undefined, 201);
    } catch (error) {
      return next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const search = req.query.search as string;
      const customerType = req.query.customerType as CustomerType;
      const status = req.query.status as CustomerStatus;

      const result = await CustomerService.getCustomers({
        search,
        customerType,
        status,
        page,
        limit,
      });

      return ApiResponse.success(res, result.customers, result.meta);
    } catch (error) {
      return next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await CustomerService.getCustomerById(req.params.id);
      return ApiResponse.success(res, customer);
    } catch (error) {
      return next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await CustomerService.updateCustomer(req.params.id, req.body);
      return ApiResponse.success(res, customer);
    } catch (error) {
      return next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await CustomerService.deleteCustomer(req.params.id);
      return ApiResponse.success(res, { message: 'Customer account deleted successfully' });
    } catch (error) {
      return next(error);
    }
  }

  static async addFollowUp(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const followUp = await CustomerService.addFollowUp(
        req.params.id,
        req.body,
        req.user.userId
      );
      return ApiResponse.success(res, followUp, undefined, 201);
    } catch (error) {
      return next(error);
    }
  }

  static async getFollowUps(req: Request, res: Response, next: NextFunction) {
    try {
      const followUps = await CustomerService.getFollowUps(req.params.id);
      return ApiResponse.success(res, followUps);
    } catch (error) {
      return next(error);
    }
  }
}
