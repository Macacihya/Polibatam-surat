import fs from "fs";
import path from "path";
import moment from "moment";
import { Request, Response } from "express";
import { Download, ErrorResponse, Ok } from "../../utils/api-response";
import { docxToHtml, resolvePublicDocxPath } from "../../utils/docx-editor";
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

  async DownloadFile(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const template = await templateRepository.FetchById(id);
      const filePath = resolvePublicDocxPath(template.filepath);

      if (!fs.existsSync(filePath)) {
        throw new Error("Berkas template .docx tidak ditemukan di server.");
      }

      const filename = path.basename(filePath);
      return Download({ res, path: filePath, filename });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async GetContent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { title, pickup_plan } = req.query;
      const template = await templateRepository.FetchById(id);
      const filePath = resolvePublicDocxPath(template.filepath);

      const replacements: Record<string, string> = {};
      if (title && String(title).trim()) {
        replacements.title = String(title).trim().toUpperCase();
      }
      if (pickup_plan && String(pickup_plan).trim()) {
        const parsed = moment(String(pickup_plan));
        if (parsed.isValid()) {
          replacements.date = parsed.format("DD MMMM YYYY");
        }
      }

      const html = docxToHtml(filePath, replacements);

      return Ok({
        res,
        data: {
          template,
          filepath: template.filepath,
          html,
        },
      });
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
