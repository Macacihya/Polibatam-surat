import fs from "fs";
import path from "path";
import { Request, Response } from "express";
import { ErrorResponse, Ok } from "../../utils/api-response";
import {
  docxToHtml,
  htmlToDocx,
  normalizeStoredFilepath,
  resolvePublicDocxPath,
} from "../../utils/docx-editor";
import templateRepository from "../template/template.Repository";
import { DraftDocumentSchema } from "./submission.Schema";
import submissionRepository from "./submission.Repository";

async function resolveBaseDocxPath(
  baseFilepath?: string,
  templateId?: string
): Promise<string | undefined> {
  if (baseFilepath) {
    const candidate = resolvePublicDocxPath(baseFilepath);
    if (fs.existsSync(candidate)) return candidate;
  }
  if (templateId) {
    const tpl = await templateRepository.FetchById(templateId);
    const tplPath = resolvePublicDocxPath(tpl.filepath);
    if (fs.existsSync(tplPath)) return tplPath;
  }
  return undefined;
}

class SubmissionController {
  async Get(req: Request, res: Response) {
    try {
      const { status } = req.query;
      const { page, page_size, search } = req.query;

      const result = await submissionRepository.Fetch({
        status: status ? String(status) : undefined,

        search: search ? String(search) : undefined,
        page: page ? Number(page) : 1,
        page_size: page_size ? Number(page_size) : 10,

        user: req.cookies.user,
      });

      return Ok({
        res,
        data: result.data,
        meta: result.meta,
        pagination: result.pagination,
      });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async GetById(req: Request, res: Response) {
    try {
      const { id: submission_id } = req.params;

      const submission = await submissionRepository.FetchById(submission_id);

      return Ok({ res, data: submission });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async Create(req: Request, res: Response) {
    try {
      if (req.body.editor_content && !req.body.filepath) {
        const baseDocxPath = await resolveBaseDocxPath(
          undefined,
          req.body.template_id
        );
        req.body.filepath = htmlToDocx({
          html: req.body.editor_content,
          baseDocxPath,
        });
      }

      const submission = await submissionRepository.Store({
        data: req.body,
        creator: req.cookies.user,
      });

      return Ok({ res, data: submission });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async Edit(req: Request, res: Response) {
    try {
      const { id: submission_id } = req.params;

      if (req.body.editor_content) {
        const existingNorm = normalizeStoredFilepath(req.body.filepath);
        const reuseName =
          existingNorm && path.basename(existingNorm).startsWith("draft-")
            ? path.basename(existingNorm)
            : undefined;
        const baseDocxPath = await resolveBaseDocxPath(
          existingNorm,
          req.body.template_id
        );
        req.body.filepath = htmlToDocx({
          html: req.body.editor_content,
          baseDocxPath,
          outputFileName: reuseName,
        });
      }

      const submission = await submissionRepository.Update({
        submission_id,
        data: req.body,
        modifier: req.cookies.user,
      });

      return Ok({ res, data: submission });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async UpdateStatus(req: Request, res: Response) {
    try {
      const { id: submission_id } = req.params;
      const { status, reject_remarks } = req.body;

      const submission = await submissionRepository.UpdateStatus({
        submission_id,
        status,
        reject_remarks,
      });

      return Ok({ res, data: submission });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async Publish(req: Request, res: Response) {
    try {
      const { id: submission_id } = req.params;

      const submission = await submissionRepository.Publish({
        submission_id,
        data: req.body,
        creator: req.cookies.user,
      });

      return Ok({ res, data: submission });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async Delete(req: Request, res: Response) {
    try {
      const { id: submission_id } = req.params;
      const user = req.cookies.user;

      const submission = await submissionRepository.FetchById(submission_id);
      if (!submission) throw new Error("Pengajuan tidak ditemukan.");

      if (!user?.is_admin && submission.creator_id !== user?.id) {
        throw new Error("Anda tidak memiliki izin untuk menghapus pengajuan ini.");
      }

      if (!["DRAFT", "POSTED", "REJECTED"].includes(submission.status) && !user?.is_admin) {
        throw new Error("Pengajuan yang sudah disetujui atau diterbitkan tidak dapat dihapus.");
      }

      await submissionRepository.Destroy(submission_id);

      return Ok({ res, message: "Pengajuan berhasil dihapus." });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async AssignVerifiers(req: Request, res: Response) {
    try {
      const { id: submission_id } = req.params;
      const { verifiers } = req.body;

      const submission = await submissionRepository.AssignVerifiers({
        submission_id,
        verifiers,
        user: req.cookies.user,
      });

      return Ok({
        res,
        data: submission,
        message: "Verifikator berhasil ditugaskan dan notifikasi telah dikirim.",
      });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async VerifySubmission(req: Request, res: Response) {
    try {
      const { id: submission_id } = req.params;
      const { action, remarks } = req.body;

      const submission = await submissionRepository.VerifySubmission({
        submission_id,
        action,
        remarks,
        user: req.cookies.user,
      });

      return Ok({
        res,
        data: submission,
        message:
          action === "APPROVE"
            ? "Persetujuan verifikasi berhasil disimpan."
            : "Penolakan verifikasi berhasil disimpan.",
      });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async SaveDraftDocument(req: Request, res: Response) {
    try {
      if (req.file) {
        const ext = path.extname(req.file.originalname).toLowerCase();
        if (ext !== ".docx") {
          if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
          throw new Error("Hanya berkas berformat .docx yang didukung.");
        }

        const html = docxToHtml(req.file.path);
        return Ok({
          res,
          data: {
            filepath: req.file.filename,
            html,
            document_source: "UPLOAD",
          },
          message: "Dokumen Word berhasil dimuat ke editor.",
        });
      }

      const parsed = DraftDocumentSchema.parse(req.body);
      const baseDocxPath = await resolveBaseDocxPath(
        parsed.base_filepath || parsed.existing_filepath,
        parsed.template_id
      );

      const existingNorm = normalizeStoredFilepath(parsed.existing_filepath);
      const outputFileName =
        existingNorm && path.basename(existingNorm).startsWith("draft-")
          ? path.basename(existingNorm)
          : undefined;

      const fileName = htmlToDocx({
        html: parsed.html,
        baseDocxPath,
        outputFileName,
      });

      return Ok({
        res,
        data: {
          filepath: fileName,
          html: parsed.html,
        },
        message: "Draf dokumen Word berhasil disimpan.",
      });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async GetDocumentContent(req: Request, res: Response) {
    try {
      const { id: submission_id } = req.params;
      const submission = await submissionRepository.FetchById(submission_id);

      if (!submission) {
        throw new Error("Pengajuan tidak ditemukan.");
      }

      let html = submission.editor_content || "";
      if (!html && submission.filepath) {
        const docPath = resolvePublicDocxPath(submission.filepath);
        if (fs.existsSync(docPath)) {
          html = docxToHtml(docPath);
        }
      }

      if (!html && submission.template?.filepath) {
        const tplPath = resolvePublicDocxPath(submission.template.filepath);
        if (fs.existsSync(tplPath)) {
          html = docxToHtml(tplPath, {
            title: submission.title?.toUpperCase() || "",
          });
        }
      }

      return Ok({
        res,
        data: {
          id: submission.id,
          title: submission.title,
          status: submission.status,
          template_id: submission.template_id,
          document_source: submission.document_source || "TEMPLATE",
          filepath: submission.filepath,
          html: html || "<p></p>",
        },
      });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }
}

export default new SubmissionController();
