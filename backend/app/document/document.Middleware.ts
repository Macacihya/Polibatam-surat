import { Request, Response, NextFunction } from "express";
import {
  BadRequest,
  ErrorResponse,
  InternalServerError,
} from "../../utils/api-response";
import { DocumentSchema } from "./document.Schema";
import { UploadDocument } from "../../utils/multer";
import { MulterError } from "multer";

import DocumentRepository from "./document.Repository";

const Upload = UploadDocument.fields([{ name: "filepath", maxCount: 1 }]);

class DocumentMiddleware {
  async DocumentUploadMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    Upload(req, res, async (err) => {
      if (err)
        return BadRequest({ res, message: (err as MulterError).message });

      try {
        if (!req.files || !(req.files as any).filepath) {
          if (req.params.id) {
            const document = await DocumentRepository.fetchById(req.params.id);
            if (!document) {
              return BadRequest({ res, message: "Document not found." });
            }

            req.body.filepath = document.filepath;

            return next();
          }

          return BadRequest({ res, message: "File is required." });
        }

        req.body.filepath = (req.files as any).filepath[0]?.filename;
        next();
      } catch (error) {
        return InternalServerError({ res, data: error });
      }
    });
  }

  async DocumentSchemaMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const validate = DocumentSchema.parse(req.body);

      if (validate.users.length < 0 && validate.groups?.length < 0) {
        throw new Error("Users or Groups is required.");
      }

      req.body = validate;
      next();
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }
}

export default new DocumentMiddleware();
