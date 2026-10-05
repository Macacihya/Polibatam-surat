import { ErrorResponse } from "../../utils/api-response";
import { Request, Response, NextFunction } from "express";
import { LoginSchema } from "./auth.Schema";

class AuthMiddleware {
  async LoginSchemaMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
      const validate = LoginSchema.parse(req.body);

      req.body = validate;
      next();
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }
}

export default new AuthMiddleware();
