import { Router } from "express";
import { VerifyAuthToken } from "../middlewares/auth";
import { Request, Response } from "express";
import { Ok } from "../utils/api-response";

import AuthRoute from "../app/auth/auth.Route";

import { protectedRoutes } from "./protected";
import { generatedRoutes } from "./generated";

const routes = Router();

// AUTH
routes.use("/", AuthRoute);

routes.use("/generate", generatedRoutes);
routes.use("/", VerifyAuthToken, protectedRoutes);

// WHOAMI
routes.get("/whoami", VerifyAuthToken, (req: Request, res: Response) => {
  const user = req.cookies.user;
  const verifier_stages =
    user?.is_admin || user?.nip === "admin"
      ? [1, 2, 3]
      : user?.nip === "198001012005"
      ? [1]
      : user?.nip === "staff"
      ? [2]
      : user?.nip === "197903032003" || user?.nip === "wadir"
      ? [3]
      : [];

  return Ok({ res, data: { ...user, verifier_stages } });
});

export default routes;
