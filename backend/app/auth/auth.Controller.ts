import {
  PolibatamResponseBiodata,
  PolibatamResponseLogin,
  User,
} from "../../types";
import { ErrorResponse, Ok } from "../../utils/api-response";
import { polibatamInstance } from "../../utils/axios";
import { EncryptToken } from "../../utils/jwt";
import { Request, Response } from "express";
import UserRepository from "../user/user.Repository";
import { PolibatamAct } from "../../lib/polibatam";
import { LoginSchema } from "./auth.Schema";

class AuthController {
  async Login(req: Request, res: Response) {
    try {
      const data: LoginSchema = req.body;

      const loginResponse: PolibatamResponseLogin = await polibatamInstance({
        method: "POST",
        data: {
          act: PolibatamAct.Login,
          username: data.username,
          password: data.password,
        },
      });

      // Validasi jika API mengembalikan respons non-JSON atau diblokir intranet
      if (!loginResponse || typeof loginResponse !== "object") {
        throw new Error("Layanan autentikasi Polibatam tidak dapat dijangkau dari luar jaringan kampus.");
      }

      // Validasi kegagalan login dari API Polibatam
      if (loginResponse.error_code && loginResponse.error_code !== 0) {
        throw new Error(loginResponse.error_desc || "Username atau password salah.");
      }

      if (!loginResponse.data?.secretkey) {
        throw new Error("Gagal memperoleh secretkey dari API Polibatam.");
      }

      const biodataResponse: PolibatamResponseBiodata = await polibatamInstance(
        {
          method: "POST",
          data: {
            act: PolibatamAct.GetBiodata,
            secretkey: loginResponse.data.secretkey,
          },
        }
      );

      if (!biodataResponse || !biodataResponse.data) {
        throw new Error("Gagal mengambil data profil pengguna dari API Polibatam.");
      }

      if (biodataResponse.data.role === "Mahasiswa") {
        throw new Error("Akses ditolak: role Mahasiswa tidak diizinkan masuk ke sistem.");
      }

      const user = await UserRepository.checkOrInsertUser({
        nip: biodataResponse.data.id,
        secretkey: loginResponse.data.secretkey,
      });

      const payload = {
        user: {
          ...user,
        },
        token: EncryptToken({
          secretkey: loginResponse.data.secretkey,
          user: user,
        }),
      };

      return await Ok({ res, data: payload, message: "Login success" });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }
}

export default new AuthController();
