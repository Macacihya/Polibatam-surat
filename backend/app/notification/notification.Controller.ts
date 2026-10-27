import { Request, Response } from "express";
import { ErrorResponse, Ok } from "../../utils/api-response";
import notificationRepository from "./notification.Repository";

class NotificationController {
  async Get(req: Request, res: Response) {
    try {
      const user = req.cookies.user;
      const data = await notificationRepository.FetchByUser(user.id);

      return Ok({ res, data });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async MarkRead(req: Request, res: Response) {
    try {
      const user = req.cookies.user;
      const { id } = req.params;

      await notificationRepository.MarkAsRead(id, user.id);

      return Ok({ res, message: "Notifikasi berhasil ditandai telah dibaca." });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async MarkUnread(req: Request, res: Response) {
    try {
      const user = req.cookies.user;
      const { id } = req.params;

      await notificationRepository.MarkAsUnread(id, user.id);

      return Ok({ res, message: "Notifikasi berhasil ditandai belum dibaca." });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async Delete(req: Request, res: Response) {
    try {
      const user = req.cookies.user;
      const { id } = req.params;

      await notificationRepository.Delete(id, user.id);

      return Ok({ res, message: "Notifikasi berhasil dihapus." });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }

  async MarkAllRead(req: Request, res: Response) {
    try {
      const user = req.cookies.user;

      await notificationRepository.MarkAllAsRead(user.id);

      return Ok({ res, message: "Semua notifikasi berhasil ditandai telah dibaca." });
    } catch (error) {
      return ErrorResponse({ res, error });
    }
  }
}

export default new NotificationController();
