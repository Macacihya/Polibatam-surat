import { tbm_unit } from "@prisma/client";
import { PolibatamAct } from "../../lib/polibatam";
import { PolibatamUnit } from "../../types";
import { ErrorResponse, Ok } from "../../utils/api-response";
import { polibatamInstance } from "../../utils/axios";
import { UnitRepository } from "./unit.Repository";
import { Request, Response } from "express";
import userRepository from "../user/user.Repository";

class Controller {
  async generateUnit(req: Request, res: Response) {
    try {
      let results: PolibatamUnit[] = [];

      const token = await polibatamInstance({
        method: "POST",
        data: {
          act: PolibatamAct.GetToken,
          secretkey: req.cookies.secretkey,
        },
      });

      const resUnit = await polibatamInstance({
        method: "POST",
        data: {
          act: PolibatamAct.GetSemuaUnit,
          token: token.data.token,
          limit: 1000,
        },
      });

      results = resUnit.data;
      if (!results) throw new Error("Unit data not found");

      console.log("Generated Unit => " + results.length);

      const data = await Promise.all(
        results.map(async (item) => {
          const leader = await userRepository.FetchUserByNIP(item.NIK_KEPALA);

          return {
            name: item.UNIT,
            leader_id: leader ? leader.id : null,

            created_at: new Date(),
            updated_at: new Date(),
            is_deleted: false,
          };
        })
      );

      await UnitRepository.bulkStore(data);

      return Ok({ res, message: "Unit data generated" });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async get(req: Request, res: Response) {
    try {
      const { search, page, page_size } = req.query;

      const data = await UnitRepository.fetch({
        search: search ? String(search) : undefined,
        page: page ? Number(page) : 1,
        page_size: page_size ? Number(page_size) : 10,
      });

      return Ok({ res, data: data.data, pagination: data.pagination });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async getOne(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const data = await UnitRepository.fetchOne({ id });

      return Ok({ res, data });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }
}

export const UnitController = new Controller();
