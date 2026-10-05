import { Router } from "express";

import DashboardRoute from "../app/dashboard/dashboard.Route";
import DocumentRoute from "../app/document/document.Route";
import GroupRoute from "../app/group/group.Route";
import SubmissionRoute from "../app/submission/submission.Route";
import UserRoute from "../app/user/user.Route";
import { UnitRoute } from "../app/unit/unit.Route";
import { RegulationRoute } from "../app/regulation/regulation.Route";

const protectedRoutes = Router()
  .use("/dashboard", DashboardRoute)
  .use("/document", DocumentRoute)
  .use("/submission", SubmissionRoute)
  .use("/group", GroupRoute)
  .use("/unit", UnitRoute)
  .use("/user", UserRoute)

  .use("/regulation", RegulationRoute);

export { protectedRoutes };
