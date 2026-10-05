import { Router } from "express";

import AuthController from "./auth.Controller";
import AuthMiddleware from "./auth.Middleware";

const AuthRoute = Router().post(
  "/login",
  AuthMiddleware.LoginSchemaMiddleware,
  AuthController.Login
);

export default AuthRoute;
