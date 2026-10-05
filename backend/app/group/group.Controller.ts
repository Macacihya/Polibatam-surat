import { Request, Response } from "express";
import { ErrorResponse, Ok } from "../../utils/api-response";

import GroupRepository from "./group.Repository";

class GroupController {
  async GetGroup(req: Request, res: Response) {
    try {
      const { search, page, page_size } = req.query;

      const result = await GroupRepository.FetchGroup({
        search: search ? String(search) : undefined,
        page: page ? Number(page) : 1,
        page_size: page_size ? Number(page_size) : 10,
      });

      return Ok({ res, data: result.data, pagination: result.pagination });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async GetGroupById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const group = await GroupRepository.FetchGroupById(id);

      return Ok({ res, data: group });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async CreateGroup(req: Request, res: Response) {
    try {
      const body = req.body;

      const group = await GroupRepository.StoreGroup(body);

      return Ok({ res, data: group, message: "Berhasil menambahkan group" });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async EditGroup(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const body = req.body;

      const group = await GroupRepository.UpdateGroup(id, body);

      return Ok({
        res,
        data: group,
        message: `Berhasil mengubah group ${group.name}`,
      });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async DeleteGroup(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const group = await GroupRepository.DestroyGroup(id);

      return Ok({
        res,
        data: group,
        message: `Berhasil menghapus group ${group.name}`,
      });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }
}

export default new GroupController();
