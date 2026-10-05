import { Router } from "express";
import { UnitController } from "./unit.Controller";

export const UnitRoute = Router()
  .post("/generate", UnitController.generateUnit)

  .get("/", UnitController.get)
  .get("/:id", UnitController.getOne);
