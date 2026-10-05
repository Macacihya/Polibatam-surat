import { Request, Response } from "express";
import { ErrorResponse, Ok } from "../../utils/api-response";
import { RegulationRepository } from "./regulation.Repository";

class Controller {
  async get(req: Request, res: Response) {
    try {
      const { search, page, page_size } = req.query;

      const result = await RegulationRepository.fetch({
        search: search ? String(search) : "",

        page: page ? Number(page) : 1,
        page_size: page_size ? Number(page_size) : 10,
      });

      return Ok({ res, data: result.data, pagination: result.pagination });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async getOne(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await RegulationRepository.fetchOne({ id });

      return Ok({ res, data: result });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const result = await RegulationRepository.create({
        creator: req.cookies.user,
        data: req.body,
      });

      return Ok({ res, data: result });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async bulkCreate(req: Request, res: Response) {
    try {
      const result = await RegulationRepository.bulkCreate({
        creator: req.cookies.user,
        data: req.body,
      });

      return Ok({ res, data: result });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const result = await RegulationRepository.update({
        id: req.params.id,
        data: req.body,
        modifier: req.cookies.user,
      });

      return Ok({ res, data: result });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const result = await RegulationRepository.delete({
        id: req.params.id,
        modifier: req.cookies.user,
      });

      return Ok({ res, data: result });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }
}

export const RegulationController = new Controller();
