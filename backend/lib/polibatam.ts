import { tbm_user } from "@prisma/client";
import { Request, Response } from "express";
import { polibatamInstance } from "../utils/axios";
import { Pegawai, Unit } from "../types";
import userRepository from "../app/user/user.Repository";
import { ErrorResponse, Ok } from "../utils/api-response";
import prisma from "./prisma";

export const PolibatamAct = {
  Login: "Login",
  GetToken: "GetToken",
  GetBiodata: "GetBiodata",
  GetSemuaPegawai: "GetSemuaPegawai",
  GetSemuaUnit: "GetSemuaUnit",
};

class PolibatamClass {
  async GeneratePegawai(req: Request, res: Response) {
    try {
      const resLogin = await polibatamInstance({
        method: "POST",
        data: {
          act: "Login",
          username: "hamim",
          password: "Hamim123",
        },
      });

      if (resLogin.data.error_code === 102)
        throw new Error(resLogin?.data?.error_desc);

      const secretkey = resLogin?.data?.data?.secretkey;

      const token = await polibatamInstance({
        method: "POST",
        data: {
          act: "GetToken",
          secretkey: secretkey,
        },
      }).then((res) => res.data.data.token);

      console.log("Token => " + token);

      let results: Pegawai[] = [];

      const resPegawai = await polibatamInstance({
        method: "POST",
        data: {
          act: "GetSemuaPegawai",
          token: token,
          limit: 1000,
        },
      });

      results = resPegawai.data.data;
      if (!results) throw new Error("User data not found");

      console.log("Generated User => " + results.length);

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

          is_admin: false,
          created_at: new Date(),
          updated_at: new Date(),
          is_deleted: false,
        };
      });

      await userRepository.bulkStore(data);

      return Ok({
        res,
        data: {
          count: data.length,
          data: data,
        },
      });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async GenerateUnit(req: Request, res: Response) {
    try {
      const resLogin = await polibatamInstance({
        method: "POST",
        data: {
          act: "Login",
          username: "hamim",
          password: "Hamim123",
        },
      });

      if (resLogin.data.error_code === 102)
        throw new Error(resLogin?.data?.error_desc);

      const secretkey = resLogin?.data?.data?.secretkey;

      const token = await polibatamInstance({
        method: "POST",
        data: {
          act: "GetToken",
          secretkey: secretkey,
        },
      }).then((res) => res.data.data.token);

      console.log("Token => " + token);

      let units: Unit[] = [];

      const resUnit = await polibatamInstance({
        method: "POST",
        data: {
          act: "GetSemuaUnit",
          token: token,
          limit: 1000,
        },
      });

      units = resUnit.data.data;
      if (!units) throw new Error("Unit data not found");

      for (const unit of units) {
        const leader = await userRepository.FetchUserByNIP(unit.NIK_KEPALA);

        await prisma.tbm_unit.create({
          data: {
            name: unit.UNIT,
            leader_id: leader?.id,
          },
        });
      }

      return Ok({
        res,
        data: {
          count: units.length,
          data: units,
        },
      });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }
}

export const Polibatam = new PolibatamClass();
