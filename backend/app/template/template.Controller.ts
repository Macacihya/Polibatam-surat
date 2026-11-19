import { Request, Response } from "express";
import { ErrorResponse, Ok } from "../../utils/api-response";
import templateRepository from "./template.Repository";

class TemplateController {
  async Get(req: Request, res: Response) {
    try {
      const { search, type, is_active } = req.query;
      const data = await templateRepository.FetchAll({
        search: search ? String(search) : undefined,
        type: type ? String(type) : undefined,
        is_active: is_active !== undefined ? is_active === "true" : undefined,
      });

      return Ok({ res, data });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async GetById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = await templateRepository.FetchById(id);
      return Ok({ res, data });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async Create(req: Request, res: Response) {
    try {
      const { code, title, type, description } = req.body;
      let { schema_fields } = req.body;

      if (!code || !title || !type) {
        throw new Error("Kode, judul, dan tipe template wajib diisi.");
      }

      if (typeof schema_fields === "string") {
        try {
          schema_fields = JSON.parse(schema_fields);
        } catch {
          schema_fields = [];
        }
      }

      const file = req.file;
      const filepath = file ? file.filename : req.body.filepath || "";

      if (!filepath) {
        throw new Error("Berkas template .docx wajib diunggah.");
      }

      const data = await templateRepository.Store({
        code,
        title,
        type,
        description,
        filepath,
        schema_fields,
      });

      return Ok({ res, data, message: "Template berhasil ditambahkan." });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async Edit(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { title, type, description, is_active } = req.body;
      let { schema_fields } = req.body;

      if (typeof schema_fields === "string") {
        try {
          schema_fields = JSON.parse(schema_fields);
        } catch {
          schema_fields = undefined;
        }
      }

      const file = req.file;
      const filepath = file ? file.filename : undefined;

      const data = await templateRepository.Update(id, {
        title,
        type,
        description,
        is_active: is_active !== undefined ? String(is_active) === "true" : undefined,
        filepath,
        schema_fields,
      });

      return Ok({ res, data, message: "Template berhasil diperbarui." });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async Delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await templateRepository.Destroy(id);
      return Ok({ res, message: "Template berhasil dihapus." });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }
}

export default new TemplateController();
