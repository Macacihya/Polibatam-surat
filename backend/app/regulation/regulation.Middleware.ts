import { Request, Response, NextFunction } from "express";
import { ErrorResponse } from "../../utils/api-response";
import { RegulationBulkSchema, RegulationSchema } from "./regulation.Schema";

class Middleware {
  async schema(req: Request, res: Response, next: NextFunction) {
    try {
      const validate = RegulationSchema.parse(req.body);

      req.body = validate;
      next();
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async bulkSchema(req: Request, res: Response, next: NextFunction) {
    try {
      const validate = RegulationBulkSchema.parse(req.body);

      req.body = validate;
      next();
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }
}

export const RegulationMiddleware = new Middleware();
