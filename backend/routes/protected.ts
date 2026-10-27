import { Router } from "express";

import DashboardRoute from "../app/dashboard/dashboard.Route";
import DocumentRoute from "../app/document/document.Route";
import GroupRoute from "../app/group/group.Route";
import SubmissionRoute from "../app/submission/submission.Route";
import UserRoute from "../app/user/user.Route";
import { UnitRoute } from "../app/unit/unit.Route";
import { RegulationRoute } from "../app/regulation/regulation.Route";
import NotificationRoute from "../app/notification/notification.Route";
import VerificationRoute from "../app/verification/verification.Route";

const protectedRoutes = Router()
  .use("/dashboard", DashboardRoute)
  .use("/document", DocumentRoute)
  .use("/submission", SubmissionRoute)
  .use("/group", GroupRoute)
  .use("/unit", UnitRoute)
  .use("/user", UserRoute)
  .use("/notification", NotificationRoute)
  .use("/regulation", RegulationRoute)
  .use("/verification", VerificationRoute);

export { protectedRoutes };
