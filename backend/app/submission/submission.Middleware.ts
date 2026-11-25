import { Request, Response, NextFunction } from "express";
import { ErrorResponse } from "../../utils/api-response";
import {
  AssignVerifiersSchema,
  SubmissionPublishSchema,
  SubmissionSchema,
  SubmissionStatus,
  VerifySubmissionSchema,
} from "./submission.Schema";
import { UploadDocument } from "../../utils/multer";
import { normalizeStoredFilepath } from "../../utils/docx-editor";
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

        if (files && files[fieldName] && files[fieldName][0]) {
          req.body[fieldName] = files[fieldName][0].filename;
          return;
        }

        if (typeof req.body[fieldName] === "string" && req.body[fieldName].trim()) {
          req.body[fieldName] = normalizeStoredFilepath(req.body[fieldName]);
          return;
        }

        if (req.params.id) {
          const document = await submissionRepository.FetchById(req.params.id);
          if (document && document[fieldName]) {
            req.body[fieldName] = document[fieldName];
          }
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

  async UploadDraftDocxMiddleware(req: Request, res: Response, next: NextFunction) {
    if (req.is("multipart/form-data")) {
      return UploadDocument.single("file")(req, res, (err) => {
        if (err) return ErrorResponse({ res, error: err });
        next();
      });
    }
    next();
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

      const hasStructuredContent =
        validate.list_consider.some((item) => item.trim() !== "") ||
        validate.list_observe.some((item) => item.trim() !== "") ||
        validate.list_decide.some((item) => item.trim() !== "");
      const hasWordContent =
        Boolean(validate.filepath && validate.filepath.trim() !== "") ||
        Boolean(validate.editor_content && validate.editor_content.replace(/<[^>]*>/g, "").trim() !== "");

      if (validate.status === SubmissionStatus.POSTED && !hasStructuredContent && !hasWordContent) {
        throw new Error("Dokumen Word atau isi surat wajib diisi sebelum diajukan.");
      }

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

  async SchemaAssignVerifiersMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const user = req.cookies.user;
      const isAuthorized =
        user?.is_admin ||
        user?.staff === "Administrasi" ||
        user?.unit?.toLowerCase().includes("administrasi");

      if (!isAuthorized) {
        throw new Error(
          "Hanya Admin / Urusan Administrasi yang dapat menugaskan verifikator."
        );
      }

      const validate = await AssignVerifiersSchema.parseAsync(req.body);
      req.body = validate;
      next();
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async SchemaVerifyMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const validate = await VerifySubmissionSchema.parseAsync(req.body);
      req.body = validate;
      next();
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }
}

export default new SubmissionMiddleware();
