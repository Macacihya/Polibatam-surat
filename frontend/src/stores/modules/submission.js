import axiosInstance from "@/utils/axios";
import moment from "moment";
import { toast } from "vue-sonner";

const form = {
  title: "",
  type: "",
  is_attachment: false,
  filepath_attachment: "",
  pickup_plan: moment().format("YYYY-MM-DD"),

  list_consider: [""],
  list_observe: [""],
  list_decide: [""],

  users: [],
  units: [],
  groups: [],

  // status
  status: "DRAFT",

  // publish
  filepath: null,
  code: "",
  date: "",
};

const submission = {
  namespaced: true,
  state: {
    loading: {
      reports: false,
      report: false,
      form: false,
    },
    meta: {
      DRAFT: 0,
      POSTED: 0,
      APPROVED: 0,
      PUBLISHED: 0,
      REJECTED: 0,
      ALL: 0,
    },
    table_options: {
      search: "",
      page: 1,
      page_size: 10,
      total_items: 0,
      total_pages: 0,
    },
    form: { ...form },
    is_update: "",

    reports: [],
    report: "",
  },
  mutations: {
    SET_IS_LOADING(state, payload) {
      state.loading[payload.key] = payload.value;
    },
    SET_OPTIONS_TABLE(state, payload) {
      Object.assign(state.table_options, payload);
    },
    SET_META(state, payload) {
      Object.assign(state.meta, payload);
    },

    SET_FORM(state, payload) {
      state.form[payload.key] = payload.value;
    },
    RESET_FORM(state) {
      state.form = { ...form };
    },
    SET_IS_UPDATE(state, payload) {
      state.is_update = payload;
    },

    SET_REPORTS(state, payload) {
      state.reports = payload;
    },
    SET_REPORT(state, payload) {
      state.report = payload;
    },
  },
  actions: {
    GetReports: async (context, params) => {
      context.commit("SET_IS_LOADING", {
        key: "reports",
        value: true,
      });

      try {
        const result = await axiosInstance({
          url: `/submission`,
          method: "GET",
          params: {
            page: context.state.table_options.page,
            page_size: context.state.table_options.page_size,
            search: context.state.table_options.search,

            status: params?.status,
          },
        });

        context.commit("SET_REPORTS", result.data.data);

        context.commit("SET_OPTIONS_TABLE", {
          page: result.data.pagination.page,
          page_size: result.data.pagination.page_size,
          total_items: result.data.pagination.total_items,
          total_pages: result.data.pagination.total_pages,
        });

        context.commit("SET_META", {
          DRAFT: result.data.meta.DRAFT,
          POSTED: result.data.meta.POSTED,
          APPROVED: result.data.meta.APPROVED,
          PUBLISHED: result.data.meta.PUBLISHED,
          REJECTED: result.data.meta.REJECTED,
          ALL: result.data.meta.ALL,
        });
      } catch (error) {
        console.log(error);
        toast.error(error.response.data.message);
      } finally {
        context.commit("SET_IS_LOADING", {
          key: "reports",
          value: false,
        });
      }
    },
    GetReport: async (context, submission_id) => {
      context.commit("SET_IS_LOADING", {
        key: "report",
        value: true,
      });

      try {
        const result = await axiosInstance({
          url: `/submission/${submission_id}`,
          method: "GET",
        });

        context.commit("SET_REPORT", result.data.data);
      } catch (error) {
        toast.error(error.response.data.message);
      } finally {
        context.commit("SET_IS_LOADING", {
          key: "report",
          value: false,
        });
      }
    },
    Create: async (context) => {
      context.commit("SET_IS_LOADING", {
        key: "form",
        value: true,
      });

      try {
        const payload = context.state.form;

        const result = await axiosInstance({
          url: `/submission`,
          method: "POST",
          headers: {
            "Content-Type": "multipart/form-data",
          },
          data: {
            ...payload,
            filepath_attachment: payload.filepath_attachment[0],
          },
        });

        context.dispatch("GetReports");
        toast.success(result.data.message);

        return true;
      } catch (error) {
        toast.error(error.response.data.message);
      } finally {
        context.commit("SET_IS_LOADING", {
          key: "form",
          value: false,
        });
      }
    },
    SetFormUpdate: async (context, submission_id) => {
      context.commit("SET_IS_LOADING", {
        key: "form",
        value: true,
      });

      try {
        const result = await axiosInstance({
          url: `/submission/${submission_id}`,
          method: "GET",
        });

        const data = result.data.data;

        const no = data.no.toString().padStart(3, "0");
        const date = moment().format("MM/YYYY");

        context.state.form = {
          title: data.title,
          type: data.type,
          is_attachment: data.is_attachment,
          filepath_attachment: null,
          pickup_plan: moment(data.pickup_plan).format("YYYY-MM-DD"),
          list_consider: data.list_consider,
          list_observe: data.list_observe,
          list_decide: data.list_decide,

          groups: data.groups?.map((item) => item.group_id),
          users: data.users?.map((item) => item.user_id),
          units: data.units?.map((item) => item.unit_name),

          status: data.status,

          filepath: null,
          code: `${no}/K/PL29/${date}`,
          date: moment().format("YYYY-MM-DD"),
        };

        context.commit("SET_IS_UPDATE", submission_id);
      } catch (error) {
        console.log(error);

        toast.error(error.response.data.message);
      } finally {
        context.commit("SET_IS_LOADING", {
          key: "form",
          value: false,
        });
      }
    },
    Update: async (context, submission_id) => {
      context.commit("SET_IS_LOADING", {
        key: "form",
        value: true,
      });

      try {
        const payload = context.state.form;

        const result = await axiosInstance({
          url: `/submission/${submission_id}`,
          method: "PUT",
          headers: {
            "Content-Type": "multipart/form-data",
          },
          data: {
            ...payload,
            filepath_attachment: payload.filepath_attachment
              ? payload.filepath_attachment[0]
              : null,
          },
        });

        context.dispatch("GetReports");
        toast.success(result.data.message);

        return true;
      } catch (error) {
        console.log(error);
        toast.error(error.response.data.message);
      } finally {
        context.commit("SET_IS_LOADING", {
          key: "form",
          value: false,
        });
      }
    },
    Delete: async (context, submission_id) => {
      context.commit("SET_IS_LOADING", {
        key: "report",
        value: true,
      });

      try {
        const result = await axiosInstance({
          url: `/submission/${submission_id}`,
          method: "DELETE",
        });

        context.dispatch("GetReports");
        toast.success(result.data.message);

        return true;
      } catch (error) {
        toast.error(error.response.data.message);
      } finally {
        context.commit("SET_IS_LOADING", {
          key: "report",
          value: false,
        });
      }
    },
    UpdateStatus: async (context, payload) => {
      context.commit("SET_IS_LOADING", {
        key: "form",
        value: true,
      });

      try {
        const result = await axiosInstance({
          url: `/submission/status/${payload.id}`,
          method: "PUT",
          data: {
            status: payload.status,
            reject_remarks: payload?.reject_remarks,
          },
        });

        context.dispatch("GetReports");
        toast.success(result.data.message);

        return true;
      } catch (error) {
        toast.error(error.response.data.message);
      } finally {
        context.commit("SET_IS_LOADING", {
          key: "form",
          value: false,
        });
      }
    },
    Publish: async (context, submission_id) => {
      context.commit("SET_IS_LOADING", {
        key: "form",
        value: true,
      });

      try {
        const payload = context.state.form;

        const result = await axiosInstance({
          url: `/submission/publish/${submission_id}`,
          method: "PUT",
          headers: {
            "Content-Type": "multipart/form-data",
          },
          data: {
            ...payload,
            filepath: payload.filepath ? payload.filepath[0] : null,
          },
        });

        context.dispatch("GetReports");
        toast.success(result.data.message);

        return true;
      } catch (error) {
        console.log(error);
        toast.error(error.response.data.message);
      } finally {
        context.commit("SET_IS_LOADING", {
          key: "form",
          value: false,
        });
      }
    },
  },
};

export default submission;
