import { Router } from "express";
import { RegulationController } from "./regulation.Controller";
import { RegulationMiddleware } from "./regulation.Middleware";

export const RegulationRoute = Router()
  .get("/", RegulationController.get)
  .get("/:id", RegulationController.getOne)
  .post("/", RegulationMiddleware.schema, RegulationController.create)
  .post(
    "/bulk",
    RegulationMiddleware.bulkSchema,
    RegulationController.bulkCreate
  )
  .put("/:id", RegulationMiddleware.schema, RegulationController.update)
  .delete("/:id", RegulationController.delete);
