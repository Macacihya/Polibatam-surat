import { Request, Response } from "express";
import { ErrorResponse, Ok } from "../../utils/api-response";

import DashboardRepository from "./dashboard.Repository";

class DashboardController {
  async GetDashboard(req: Request, res: Response) {
    try {
      const { start_date, end_date } = req.query;

      const result = await DashboardRepository.FetchDashboard({
        user: req.cookies.user,

        start_date: start_date ? new Date(String(start_date)) : undefined,
        end_date: end_date ? new Date(String(end_date)) : undefined,
      });

      return Ok({ res, data: result });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async getSubmissionByStatusBarChart(req: Request, res: Response) {
    try {
      const { year } = req.query;

      const result = await DashboardRepository.fetchSubmissionByStatusBarChart({
        year: year ? Number(year) : undefined,
      });

      return Ok({
        res,
        data: result,
        meta: {
          year: year || new Date().getFullYear(),
        },
      });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async getSubmissionByStatusDonutChart(req: Request, res: Response) {
    try {
      const { type, range, month, year } = req.query;

      const result =
        await DashboardRepository.fetchSubmissionByStatusDonutChart({
          type: type ? (type as any) : "YEAR",

          range: range ? (range as any) : undefined,
          month: month ? String(month) : undefined,
          year: year ? Number(year) : undefined,
        });

      return Ok({
        res,
        data: result,
        meta: { type, year, month, range },
      });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }
}

export default new DashboardController();
