import { Router } from "express";
import notificationController from "./notification.Controller";

const NotificationRoute = Router()
  .get("/", notificationController.Get)
  .put("/read-all", notificationController.MarkAllRead)
  .put("/:id/read", notificationController.MarkRead)
  .put("/:id/unread", notificationController.MarkUnread)
  .delete("/:id", notificationController.Delete);

export default NotificationRoute;
