import { Request, Response } from "express";
import { ErrorResponse, Ok } from "../../utils/api-response";
import submissionRepository from "./submission.Repository";

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

      await submissionRepository.Destroy(submission_id);

      return Ok({ res, message: "Submission deleted." });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }
}

export default new SubmissionController();
