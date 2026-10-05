import { Router } from "express";

import UserController from "./user.Controller";

const UserRoute = Router()
  .post("/generate", UserController.GenerateUser)

  .put("/role/:id", UserController.ToggleUserRole)

  .get("/", UserController.GetUser)
  .get("/:id", UserController.GetUserByNIP);

export default UserRoute;
