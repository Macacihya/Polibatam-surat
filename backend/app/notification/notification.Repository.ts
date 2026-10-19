import prisma from "../../lib/prisma";

class NotificationRepository {
  async FetchByUser(user_id: string) {
    const [notifications, unread_count] = await Promise.all([
      prisma.tbl_notification.findMany({
        where: { user_id },
        orderBy: { created_at: "desc" },
        take: 30,
      }),
      prisma.tbl_notification.count({
        where: { user_id, is_read: false },
      }),
    ]);

    return {
      notifications,
      unread_count,
    };
  }

  async MarkAsRead(id: string, user_id: string) {
    return await prisma.tbl_notification.updateMany({
      where: { id, user_id },
      data: { is_read: true },
    });
  }

  async MarkAllAsRead(user_id: string) {
    return await prisma.tbl_notification.updateMany({
      where: { user_id, is_read: false },
      data: { is_read: true },
    });
  }
}

export default new NotificationRepository();
