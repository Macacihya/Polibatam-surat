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

      console.log("req.body", req.body);

      const loginResponse: PolibatamResponseLogin = await polibatamInstance({
        method: "POST",
        data: {
          act: PolibatamAct.Login,
          username: data.username,
          password: data.password,
        },
      });

      console.log("loginResponse", loginResponse);

      if (
        loginResponse.error_code == 102 ||
        loginResponse.error_code == 103 ||
        loginResponse.error_code == 104
      )
        throw new Error(loginResponse.error_desc);

      const biodataResponse: PolibatamResponseBiodata = await polibatamInstance(
        {
          method: "POST",
          data: {
            act: PolibatamAct.GetBiodata,
            secretkey: loginResponse.data.secretkey,
          },
        }
      );

      console.log("biodataResponse", biodataResponse);

      if (biodataResponse.data.role === "Mahasiswa")
        throw new Error("Mahasiswa tidak bisa login");

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

      // const user = await UserRepository.FetchUserByNIP(data.username);

      // const payload = {
      //   user: {
      //     ...user,
      //   },
      //   token: EncryptToken({
      //     secretkey: "",
      //     user: user,
      //   }),
      // };

      return await Ok({ res, data: payload, message: "Login success" });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }
}

export default new AuthController();
