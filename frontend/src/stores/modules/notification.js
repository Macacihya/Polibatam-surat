import axiosInstance from "@/utils/axios";
import moment from "moment";
import { toast } from "vue-sonner";

const resolveIconAndColor = (title = "") => {
  const lower = title.toLowerCase();
  if (lower.includes("tolak") || lower.includes("batal")) {
    return { icon: "tabler-circle-x", color: "error" };
  }
  if (lower.includes("revisi") || lower.includes("perbaikan")) {
    return { icon: "tabler-alert-triangle", color: "warning" };
  }
  if (lower.includes("setuju") || lower.includes("disetujui") || lower.includes("terbit")) {
    return { icon: "tabler-circle-check", color: "success" };
  }
  if (lower.includes("verifikasi")) {
    return { icon: "tabler-file-check", color: "info" };
  }
  return { icon: "tabler-bell", color: "primary" };
};

const formatNotification = (item) => {
  const { icon, color } = resolveIconAndColor(item.title);
  return {
    id: item.id,
    title: item.title,
    subtitle: item.message,
    time: moment(item.created_at).fromNow(),
    isSeen: Boolean(item.is_read),
    link: item.link || null,
    icon,
    color,
    raw: item,
  };
};

const notification = {
  namespaced: true,
  state: {
    loading: false,
    notifications: [],
    unread_count: 0,
  },
  mutations: {
    SET_LOADING(state, payload) {
      state.loading = payload;
    },
    SET_NOTIFICATIONS(state, payload) {
      state.notifications = payload;
    },
    SET_UNREAD_COUNT(state, payload) {
      state.unread_count = payload;
    },
    MARK_ITEM_READ(state, id) {
      const target = state.notifications.find((n) => n.id === id);
      if (target && !target.isSeen) {
        target.isSeen = true;
        state.unread_count = Math.max(0, state.unread_count - 1);
      }
    },
    MARK_ITEM_UNREAD(state, id) {
      const target = state.notifications.find((n) => n.id === id);
      if (target && target.isSeen) {
        target.isSeen = false;
        state.unread_count += 1;
      }
    },
    MARK_ALL_ITEMS_READ(state) {
      state.notifications.forEach((n) => {
        n.isSeen = true;
      });
      state.unread_count = 0;
    },
    REMOVE_ITEM(state, id) {
      const index = state.notifications.findIndex((n) => n.id === id);
      if (index !== -1) {
        if (!state.notifications[index].isSeen) {
          state.unread_count = Math.max(0, state.unread_count - 1);
        }
        state.notifications.splice(index, 1);
      }
    },
  },
  actions: {
    GetNotifications: async ({ commit }) => {
      commit("SET_LOADING", true);
      try {
        const result = await axiosInstance({
          url: "/notification",
          method: "GET",
        });

        const list = result.data?.data?.notifications || [];
        const unreadCount = result.data?.data?.unread_count ?? 0;

        const formatted = list.map(formatNotification);
        commit("SET_NOTIFICATIONS", formatted);
        commit("SET_UNREAD_COUNT", unreadCount);
      } catch (error) {
        console.error("Gagal mengambil notifikasi:", error);
      } finally {
        commit("SET_LOADING", false);
      }
    },

    MarkRead: async ({ commit }, id) => {
      commit("MARK_ITEM_READ", id);
      try {
        await axiosInstance({
          url: `/notification/${id}/read`,
          method: "PUT",
        });
      } catch (error) {
        console.error("Gagal menandai notifikasi dibaca:", error);
      }
    },

    MarkUnread: async ({ commit }, id) => {
      commit("MARK_ITEM_UNREAD", id);
      try {
        await axiosInstance({
          url: `/notification/${id}/unread`,
          method: "PUT",
        });
      } catch (error) {
        console.error("Gagal menandai notifikasi belum dibaca:", error);
      }
    },

    MarkAllRead: async ({ commit }) => {
      commit("MARK_ALL_ITEMS_READ");
      try {
        await axiosInstance({
          url: "/notification/read-all",
          method: "PUT",
        });
        toast.success("Semua notifikasi ditandai telah dibaca");
      } catch (error) {
        console.error("Gagal menandai semua dibaca:", error);
      }
    },

    RemoveNotification: async ({ commit }, id) => {
      commit("REMOVE_ITEM", id);
      try {
        await axiosInstance({
          url: `/notification/${id}`,
          method: "DELETE",
        });
      } catch (error) {
        console.error("Gagal menghapus notifikasi:", error);
      }
    },
  },
};

export default notification;
