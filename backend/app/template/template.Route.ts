import { Router } from "express";
import templateController from "./template.Controller";
import { UploadDocument } from "../../utils/multer";

const TemplateRoute = Router()
  .get("/", templateController.Get)
  .get("/:id", templateController.GetById)
  .post("/", UploadDocument.single("file"), templateController.Create)
  .put("/:id", UploadDocument.single("file"), templateController.Edit)
  .delete("/:id", templateController.Delete);

export default TemplateRoute;
