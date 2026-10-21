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
import prisma from "../../lib/prisma";

class AuthController {
  async Login(req: Request, res: Response) {
    try {
      const data: LoginSchema = req.body;

      // Mode Dummy untuk Pengujian & Pengembangan Lokal
      const dummyAccounts: Record<string, { nip: string; nama: string; email: string; is_admin: boolean; unit: string; staff: string; status_karyawan: string }> = {
        admin: {
          nip: "admin",
          nama: "Super Administrator (Dummy)",
          email: "admin@polibatam.ac.id",
          is_admin: true,
          unit: "Pusat Informasi & Komputer (P3M)",
          staff: "Tenaga Kependidikan",
          status_karyawan: "PNS",
        },
        administrasi: {
          nip: "administrasi",
          nama: "Regina Administrasi, S.Sos (Dummy)",
          email: "administrasi@polibatam.ac.id",
          is_admin: true,
          unit: "Urusan Administrasi",
          staff: "Administrasi",
          status_karyawan: "PNS",
        },
        dosen: {
          nip: "dosen",
          nama: "Dr. Budi Santoso, M.Kom (Dummy)",
          email: "dosen@polibatam.ac.id",
          is_admin: false,
          unit: "Jurusan Teknik Informatika",
          staff: "Tenaga Pendidik",
          status_karyawan: "Dosen Tetap",
        },
        staff: {
          nip: "staff",
          nama: "Siti Rahmawati, S.Tr.Kom (Dummy)",
          email: "staff@polibatam.ac.id",
          is_admin: false,
          unit: "Bagian Umum & Keuangan",
          staff: "Tenaga Kependidikan",
          status_karyawan: "Pegawai Tetap",
        },
        direktur: {
          nip: "direktur",
          nama: "Ir. Bambang Hendrawan, S.T., M.S.M., Ph.D. (Direktur)",
          email: "direktur@polibatam.ac.id",
          is_admin: false,
          unit: "Pimpinan Politeknik Negeri Batam",
          staff: "Direktur",
          status_karyawan: "PNS",
        },
        wadir: {
          nip: "wadir",
          nama: "Dr. Ahmad Riyadi, S.T., M.T. (Wakil Direktur I)",
          email: "wadir@polibatam.ac.id",
          is_admin: false,
          unit: "Pimpinan Politeknik Negeri Batam",
          staff: "Wakil Direktur",
          status_karyawan: "PNS",
        },
        wakildirektur: {
          nip: "wadir",
          nama: "Dr. Ahmad Riyadi, S.T., M.T. (Wakil Direktur I)",
          email: "wadir@polibatam.ac.id",
          is_admin: false,
          unit: "Pimpinan Politeknik Negeri Batam",
          staff: "Wakil Direktur",
          status_karyawan: "PNS",
        },
      };

      const lowerUsername = (data.username || "").trim().toLowerCase();
      if (dummyAccounts[lowerUsername]) {
        const dummy = dummyAccounts[lowerUsername];
        const user = await prisma.tbm_user.upsert({
          where: { nip: dummy.nip },
          update: dummy,
          create: {
            id: dummy.nip,
            ...dummy,
          },
        });

        const payload = {
          user: {
            ...user,
          },
          token: EncryptToken({
            secretkey: "dummy-secretkey",
            user: user,
          }),
        };

        return await Ok({ res, data: payload, message: "Login success (Dummy Mode)" });
      }

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
