import { Router } from "express";

import DashboardController from "./dashboard.Controller";

const DashboardRoute = Router()
  .get("/", DashboardController.GetDashboard)
  .get("/submission-by-status-bar-chart", DashboardController.getSubmissionByStatusBarChart)
  .get("/submission-by-status-donut-chart", DashboardController.getSubmissionByStatusDonutChart);

export default DashboardRoute;
