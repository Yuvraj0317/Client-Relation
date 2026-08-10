import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { UnauthorizedError } from '../middlewares/error.middleware';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);
      return res.status(200).json({
        success: true,
        token: result.token,
        user: result.user,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);
      return res.status(201).json({
        success: true,
        token: result.token,
        user: result.user,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User authentication context missing');
      }
      const user = await AuthService.getCurrentUser(req.user.userId);
      return res.status(200).json({
        success: true,
        user,
        data: user,
      });
    } catch (error) {
      return next(error);
    }
  }
}
