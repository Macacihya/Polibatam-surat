import { Router } from "express";
import verificationController from "./verification.Controller";

const VerificationRoute = Router()
  .get("/stages", verificationController.GetStages)
  .get("/approvals", verificationController.GetApprovals)
  .put("/approvals/:id/approve", verificationController.Approve)
  .put("/approvals/:id/reject", verificationController.Reject);

export default VerificationRoute;
