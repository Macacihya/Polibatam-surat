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
  return Ok({ res, data: req.cookies.user });
});

export default routes;
