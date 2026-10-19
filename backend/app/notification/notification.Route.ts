import { Router } from "express";
import notificationController from "./notification.Controller";

const NotificationRoute = Router()
  .get("/", notificationController.Get)
  .put("/read-all", notificationController.MarkAllRead)
  .put("/:id/read", notificationController.MarkRead);

export default NotificationRoute;
