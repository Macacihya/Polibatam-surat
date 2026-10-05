import { Request, Response, NextFunction } from "express";
import { GroupSchema } from "./group.Schema";
import { ErrorResponse } from "../../utils/api-response";

class GroupMiddleware {
  async GroupSchemaMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
      const validate = GroupSchema.parse({
        ...req.body,
        creator_id: req.cookies.user.id,
      });

      if (validate.users?.length === 0 && validate.units?.length === 0) {
        throw new Error("Choose at least one user or unit");
      }

      req.body = validate;
      next();
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }
}

export default new GroupMiddleware();
