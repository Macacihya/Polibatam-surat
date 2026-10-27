import { Request, Response } from "express";
import { ErrorResponse, Ok } from "../../utils/api-response";
import verificationRepository from "./verification.Repository";
import submissionRepository from "../submission/submission.Repository";

class VerificationController {
  async GetStages(req: Request, res: Response) {
    try {
      const data = await verificationRepository.GetStages();
      return Ok({ res, data });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async GetApprovals(req: Request, res: Response) {
    try {
      const { stage, page, page_size, search } = req.query;
      const data = await verificationRepository.GetApprovals({
        stage: stage ? Number(stage) : undefined,
        page: page ? Number(page) : undefined,
        page_size: page_size ? Number(page_size) : undefined,
        search: search ? String(search) : undefined,
      });

      return Ok({
        res,
        data: data.rows,
        pagination: data.pagination,
        meta: data.meta,
      });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async Approve(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { remarks } = req.body;
      const user = req.cookies.user;

      await submissionRepository.VerifySubmission({
        submission_id: id,
        action: "APPROVE",
        remarks,
        user,
      });

      return Ok({ res, message: "Surat berhasil disetujui." });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async Reject(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { remarks } = req.body;
      const user = req.cookies.user;

      if (!remarks) {
        throw new Error("Catatan penolakan wajib diisi.");
      }

      await submissionRepository.VerifySubmission({
        submission_id: id,
        action: "REJECT",
        remarks,
        user,
      });

      return Ok({ res, message: "Surat berhasil ditolak." });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async GetTracking(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = await verificationRepository.GetTracking(id);
      return Ok({ res, data });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }
}

export default new VerificationController();
