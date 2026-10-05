import { Request, Response } from "express";
import { ErrorResponse, Ok } from "../../utils/api-response";

import DocumentRepository from "./document.Repository";
import { tbm_user } from "@prisma/client";

class DocumentController {
  async get(req: Request, res: Response) {
    try {
      const { search, page, page_size } = req.query;
      const { type, start_date, end_date } = req.query;

      const result = await DocumentRepository.fetch({
        search: search ? String(search) : undefined,

        page: page ? Number(page) : 1,
        page_size: page_size ? Number(page_size) : 10,
        type: type ? (type as any) : "SURAT_KEPUTUSAN",

        user: req.cookies.user,

        start_date: start_date ? new Date(String(start_date)) : undefined,
        end_date: end_date ? new Date(String(end_date)) : undefined,
      });

      return Ok({ res, data: result.data, pagination: result.pagination });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const document = await DocumentRepository.fetchById(id);

      return Ok({ res, data: document });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async CreateDocument(req: Request, res: Response) {
    try {
      await DocumentRepository.store({
        creator: req.cookies.user,
        body: req.body,
      });

      return Ok({ res, message: "Document created successfully" });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async EditDocument(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await DocumentRepository.update({
        id,
        body: req.body,
        modifier: req.cookies.user,
      });

      return Ok({ res, message: "Document updated successfully" });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async DeleteDocument(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await DocumentRepository.destroy(id);

      return Ok({ res, message: "Document deleted successfully" });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }
}

export default new DocumentController();
