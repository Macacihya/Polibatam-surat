import { Router } from "express";

import GroupController from "./group.Controller";
import GroupMiddleware from "./group.Middleware";

const GroupRoute = Router()
  .get("/", GroupController.GetGroup)
  .get("/:id", GroupController.GetGroupById)
  .post("/", GroupMiddleware.GroupSchemaMiddleware, GroupController.CreateGroup)
  .put("/:id", GroupMiddleware.GroupSchemaMiddleware, GroupController.EditGroup)
  .delete("/:id", GroupController.DeleteGroup);

export default GroupRoute;
