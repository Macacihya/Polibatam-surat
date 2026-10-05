import { Router } from "express";

import submissionMiddleware from "./submission.Middleware";
import submissionController from "./submission.Controller";

const SubmissionRoute = Router()
  .put("/status/:id", submissionMiddleware.UpdateStatusMiddleware, submissionController.UpdateStatus)
  .put("/publish/:id", submissionMiddleware.UploadMiddleware, submissionMiddleware.SchemaPublishMiddleware, submissionController.Publish)

  // MAIN CRUD
  .get("/", submissionController.Get)
  .get("/:id", submissionController.GetById)
  .post("/", submissionMiddleware.UploadMiddleware, submissionMiddleware.SchemaMiddleware, submissionController.Create)
  .put("/:id", submissionMiddleware.UploadMiddleware, submissionMiddleware.CheckId, submissionMiddleware.SchemaMiddleware, submissionController.Edit)
  .delete("/:id", submissionMiddleware.CheckId, submissionController.Delete);

export default SubmissionRoute;
