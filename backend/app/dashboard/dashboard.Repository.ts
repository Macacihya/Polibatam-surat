import { Prisma, tbm_user } from "@prisma/client";
import prisma from "../../lib/prisma";
import {
  getDateFromRange,
  getFirstDayOfMonth,
  getFirstDayOfYear,
  getLastDayOfMonth,
  getLastDayOfYear,
} from "../../utils/utils";
import {
  MONTHS,
  SUBMISSION_STATUS_COLORS,
  SUBMISSION_STATUSES,
} from "../../constants";
import moment from "moment";

class DashboardRepository {
  private validateYear(year: any) {
    if (year && !Number.isInteger(+year)) throw new Error("Invalid year");
  }

  private handleDateFilter({
    type,

    range = "",
    month = new Date().getMonth().toString(),
    year = new Date().getFullYear(),

    by = "created_at",
  }: {
    type: any;

    range?: any;
    month?: any;
    year?: any;

    by: any;
  }) {
    switch (type) {
      case "RANGE":
        return {
          [by]: {
            gte: getDateFromRange(range).start,
            lte: getDateFromRange(range).end,
          },
        };
      case "MONTH":
        return {
          [by]: {
            gte: getFirstDayOfMonth(month),
            lte: getLastDayOfMonth(month),
          },
        };
      case "YEAR":
        return {
          [by]: {
            gte: getFirstDayOfYear(year.toString()),
            lte: getLastDayOfYear(year.toString()),
          },
        };
      default:
        return {};
    }
  }

  async FetchDashboard({
    user,
    start_date = moment().startOf("month").toDate(),
    end_date = moment().endOf("month").toDate(),
  }: {
    user: tbm_user;
    start_date?: Date;
    end_date?: Date;
  }) {
    return await prisma.$transaction(async (tx) => {
      const where: Prisma.tbl_documentWhereInput = {
        is_deleted: false,
        date: { gte: start_date, lte: end_date },
      };

      if (!user?.is_admin) {
        const OR_USER: Prisma.tbl_documentWhereInput[] = [
          // document user
          {
            users: {
              some: {
                user_id: user.id,
              },
            },
          },
          // document group → group users
          {
            groups: {
              some: {
                group: {
                  users: {
                    some: {
                      user_id: user.id,
                    },
                  },
                },
              },
            },
          },
          // document unit via unit_name
          {
            units: {
              some: {
                unit_name: user.unit ?? "",
              },
            },
          },
        ];

        if (where.OR) where.OR.push(...OR_USER);
        else where.OR = OR_USER;
      }

      const surat_tugas_count = await tx.tbl_document.count({
        where: {
          ...where,
          type: "SURAT_TUGAS",
        },
      });

      const surat_keputusan_count = await tx.tbl_document.count({
        where: {
          ...where,
          type: "SURAT_KEPUTUSAN",
        },
      });

      const histories = await tx.tbl_document.findMany({
        where: {
          ...where,
        },
        orderBy: {
          date: "desc",
        },
        take: 5,
      });

      return {
        surat_tugas_count,
        surat_keputusan_count,
        histories,
      };
    });
  }

  async fetchSubmissionByStatusBarChart({
    year = new Date().getFullYear(),
  }: {
    year?: number;
  }) {
    return await prisma.$transaction(async (tx) => {
      this.validateYear(year);

      const submissions = await tx.tbl_submission.findMany({
        where: {
          is_deleted: false,
          created_at: {
            gte: getFirstDayOfYear(year.toString()),
            lte: getLastDayOfYear(year.toString()),
          },
        },
      });

      const datasets: any[] = [];

      SUBMISSION_STATUSES.forEach((status) => {
        const data = submissions.reduce((acc, submission) => {
          if (submission.status == status) {
            const month = new Date(submission.created_at).getMonth();
            acc[month] = (acc[month] || 0) + 1;
          }

          return acc;
        }, Array(12).fill(0));

        const statusIndex = SUBMISSION_STATUSES.indexOf(status);

        datasets.push({
          label: status,
          fill: false,
          tension: 0.5,
          backgroundColor: SUBMISSION_STATUS_COLORS[statusIndex],
          borderColor: SUBMISSION_STATUS_COLORS[statusIndex],
          pointBorderColor: "transparent",
          pointHoverBackgroundColor: SUBMISSION_STATUS_COLORS[statusIndex],
          data,
        });
      });

      return {
        labels: MONTHS.map((m) => m?.name),
        datasets: datasets,
      };
    });
  }

  async fetchSubmissionByStatusDonutChart({
    ...params
  }: {
    type: "RANGE" | "MONTH" | "YEAR";

    range?: string;
    month?: string;
    year?: number;
  }) {
    return await prisma.$transaction(async (tx) => {
      const submissions = await tx.tbl_submission.findMany({
        where: {
          is_deleted: false,
          ...this.handleDateFilter({
            ...params,
            by: "created_at",
          }),
        },
      });

      const labels = SUBMISSION_STATUSES;

      const datasets = submissions.reduce((acc, submission) => {
        if (submission.status) {
          const areaIndex = labels.indexOf(submission.status);

          if (areaIndex > -1) acc[areaIndex]++;
        } else acc[labels.length - 1]++;

        return acc;
      }, Array(labels.length).fill(0));

      return {
        labels,
        datasets,
      };
    });
  }
}

export default new DashboardRepository();
