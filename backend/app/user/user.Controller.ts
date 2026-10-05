import { Request, Response } from "express";
import { ErrorResponse, Ok } from "../../utils/api-response";
import { polibatamInstance } from "../../utils/axios";

import { PolibatamPegawai } from "../../types";
import UserRepository from "./user.Repository";
import { tbm_user } from "@prisma/client";
import { PolibatamAct } from "../../lib/polibatam";

class UserController {
  async GenerateUser(req: Request, res: Response) {
    try {
      let results: PolibatamPegawai[] = [];

      const token = await polibatamInstance({
        method: "POST",
        data: {
          act: PolibatamAct.GetToken,
          secretkey: req.cookies.secretkey,
        },
      });

      const resPegawai = await polibatamInstance({
        method: "POST",
        data: {
          act: PolibatamAct.GetSemuaPegawai,
          token: token.data.token,
          limit: 1000,
        },
      });

      results = resPegawai.data;
      if (!results) throw new Error("User data not found");

      console.log("Generated User => " + results.length);

      const admins = await UserRepository.fetchAdmins();

      const data: tbm_user[] = results.map((item) => {
        return {
          id: item.NIP,
          nip: item.NIP,
          nama: item.NAMA,
          gelar_dpn: item.GELAR_DPN,
          gelar_blk: item.GELAR_BLK,
          agama: item.AGAMA,
          email: item.EMAIL,
          sex: item.SEX,
          nomor_status_karyawan: item.NOMOR_STATUS_KARYAWAN,
          status_karyawan: item.STATUS_KARYAWAN,
          nomor_status_kontrak: item.NOMOR_STATUS_KONTRAK,
          status_kontrak: item.STATUS_KONTRAK,
          nomor_staff: item.NOMOR_STAFF,
          staff: item.STAFF,
          nomor_unit: item.NOMOR_UNIT,
          unit: item.UNIT,
          line_number: item.LINE_NUMBER,

          is_admin: admins.includes(item.NIP),
          created_at: new Date(),
          updated_at: new Date(),
          is_deleted: false,
        };
      });

      await UserRepository.bulkStore(data);

      return Ok({ res, message: "Successfully generated user" });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async GetUser(req: Request, res: Response) {
    try {
      const { search, page, page_size } = req.query;

      const result = await UserRepository.FetchUser({
        search: search ? String(search) : undefined,

        page: page ? Number(page) : 1,
        page_size: page_size ? Number(page_size) : 10,
      });

      return Ok({ res, data: result.data, pagination: result.pagination });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async GetUserByNIP(req: Request, res: Response) {
    try {
      const { id: NIP } = req.params;

      const result = await UserRepository.FetchUserByNIP(NIP);

      return Ok({ res, data: result });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async ToggleUserRole(req: Request, res: Response) {
    try {
      const { id: NIP } = req.params;

      const result = await UserRepository.ToggleUserRole(NIP);

      return Ok({ res, data: result });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }
}

export default new UserController();
