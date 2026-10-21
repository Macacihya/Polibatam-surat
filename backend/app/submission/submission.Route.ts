import { Router } from "express";

import submissionMiddleware from "./submission.Middleware";
import submissionController from "./submission.Controller";

const SubmissionRoute = Router()
  .put("/status/:id", submissionMiddleware.UpdateStatusMiddleware, submissionController.UpdateStatus)
  .put("/publish/:id", submissionMiddleware.UploadMiddleware, submissionMiddleware.SchemaPublishMiddleware, submissionController.Publish)
  .put("/assign-verifiers/:id", submissionMiddleware.CheckId, submissionMiddleware.SchemaAssignVerifiersMiddleware, submissionController.AssignVerifiers)
  .post("/assign-verifiers/:id", submissionMiddleware.CheckId, submissionMiddleware.SchemaAssignVerifiersMiddleware, submissionController.AssignVerifiers)
  .put("/verify/:id", submissionMiddleware.CheckId, submissionMiddleware.SchemaVerifyMiddleware, submissionController.VerifySubmission)
  .post("/verify/:id", submissionMiddleware.CheckId, submissionMiddleware.SchemaVerifyMiddleware, submissionController.VerifySubmission)

  // MAIN CRUD
  .get("/", submissionController.Get)
  .get("/:id", submissionController.GetById)
  .post("/", submissionMiddleware.UploadMiddleware, submissionMiddleware.SchemaMiddleware, submissionController.Create)
  .put("/:id", submissionMiddleware.UploadMiddleware, submissionMiddleware.CheckId, submissionMiddleware.SchemaMiddleware, submissionController.Edit)
  .delete("/:id", submissionMiddleware.CheckId, submissionController.Delete);

export default SubmissionRoute;
