import { Router } from "express";

import DocumentController from "./document.Controller";
import DocumentMiddleware from "./document.Middleware";

const DocumentRoute = Router()
  .get("/", DocumentController.get)
  .get("/:id", DocumentController.getById)
  .post(
    "/",
    DocumentMiddleware.DocumentUploadMiddleware,
    DocumentMiddleware.DocumentSchemaMiddleware,
    DocumentController.CreateDocument
  )
  .put(
    "/:id",
    DocumentMiddleware.DocumentUploadMiddleware,
    DocumentMiddleware.DocumentSchemaMiddleware,
    DocumentController.EditDocument
  )
  .delete("/:id", DocumentController.DeleteDocument);

export default DocumentRoute;
