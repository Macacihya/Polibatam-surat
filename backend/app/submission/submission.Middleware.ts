import { Request, Response, NextFunction } from "express";
import { ErrorResponse } from "../../utils/api-response";
import { SubmissionPublishSchema, SubmissionSchema } from "./submission.Schema";
import { UploadDocument } from "../../utils/multer";
import submissionRepository from "./submission.Repository";
import {
  SUBMISSION_STATUS,
  SUBMISSION_STATUSES,
} from "../../constants/submission";

const Upload = UploadDocument.fields([
  { name: "filepath_attachment", maxCount: 1 },
  { name: "filepath", maxCount: 1 },
]);

class SubmissionMiddleware {
  async UploadMiddleware(req: Request, res: Response, next: NextFunction) {
    Upload(req, res, async function (err) {
      if (err) return ErrorResponse({ res, error: err });

      const HandleFileUpload = async (
        req: Request,
        fieldName: "filepath" | "filepath_attachment"
      ) => {
        const files = req.files as {
          [fieldName: string]: Express.Multer.File[];
        };

        if (!files || !files[fieldName]) {
          if (req.params.id && fieldName != "filepath") {
            const document = await submissionRepository.FetchById(
              req.params.id
            );
            if (document) req.body[fieldName] = document[fieldName];
          }
        } else {
          req.body[fieldName] = files[fieldName][0]?.filename;
        }
      };

      try {
        await HandleFileUpload(req, "filepath");
        await HandleFileUpload(req, "filepath_attachment");

        next();
      } catch (error) {
        console.log(error);
        return ErrorResponse({ res, error });
      }
    });
  }

  async SchemaMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
      const validate = await SubmissionSchema.parse(req.body);

      if (
        validate.users.length == 0 &&
        validate.groups.length == 0 &&
        validate.units.length == 0
      )
        throw new Error("Users, groups, or units is required.");

      req.body = validate;
      next();
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async SchemaPublishMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id: submission_id } = req.params;
      const submission = await submissionRepository.FetchById(submission_id);
      if (!submission) throw new Error("Submission not found.");

      const validate = await SubmissionPublishSchema.parse(req.body);
      if (
        validate.users.length == 0 &&
        validate.groups.length == 0 &&
        validate.units.length == 0
      )
        throw new Error("Users, groups, or units is required.");

      switch (submission.status) {
        case SUBMISSION_STATUS.REJECTED:
          throw new Error("Status already rejected.");
        case SUBMISSION_STATUS.PUBLISHED:
          throw new Error("Status already published.");
      }

      req.body = validate;
      next();
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async UpdateStatusMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { status } = req.body;
      if (!status) throw new Error("Status is required.");

      const { id: submission_id } = req.params;
      const submission = await submissionRepository.FetchById(submission_id);
      if (!submission) throw new Error("Submission not found.");

      if (!SUBMISSION_STATUSES.includes(status))
        throw new Error("Invalid status.");

      switch (submission.status) {
        case status:
          throw new Error("Status is the same.");
        case SUBMISSION_STATUS.REJECTED:
          throw new Error("Status already rejected.");
        case SUBMISSION_STATUS.PUBLISHED:
          throw new Error("Status already published.");
      }

      next();
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async CheckId(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: submission_id } = req.params;

      const submission = await submissionRepository.FetchById(submission_id);
      if (!submission) throw new Error("Submission not found.");

      next();
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }
}

export default new SubmissionMiddleware();
