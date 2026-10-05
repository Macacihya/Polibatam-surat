import axiosInstance from "@/utils/axios";
import moment from "moment";
import { toast } from "vue-sonner";

const form = {
  type: "",
  date: moment().format("YYYY-MM-DD"),
  filepath: "",
  code: "",
  name: "",
  remarks: "",
  users: [],
  groups: [],
  units: [],
};

const document = {
  namespaced: true,
  state: {
    loading: {
      reports: false,
      report: false,
      form: false,
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
          url: `/document`,
          method: "GET",
          params: {
            page: context.state.table_options.page,
            page_size: context.state.table_options.page_size,
            search: context.state.table_options.search,

            ...params,
          },
        });

        context.commit("SET_REPORTS", result.data.data);

        context.commit("SET_OPTIONS_TABLE", {
          page: result.data.pagination.page,
          page_size: result.data.pagination.page_size,
          total_items: result.data.pagination.total_items,
          total_pages: result.data.pagination.total_pages,
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
    GetReport: async (context, document_id) => {
      context.commit("SET_IS_LOADING", {
        key: "report",
        value: true,
      });

      try {
        const result = await axiosInstance({
          url: `/document/${document_id}`,
          method: "GET",
        });

        context.commit("SET_REPORT", result.data.data);

        return result.data.data.id;
      } catch (error) {
        toast.error(error.response.data.message);
      } finally {
        context.commit("SET_IS_LOADING", {
          key: "report",
          value: false,
        });
      }
    },
    Create: async (context, params) => {
      context.commit("SET_IS_LOADING", {
        key: "form",
        value: true,
      });

      try {
        const payload = context.state.form;

        const result = await axiosInstance({
          url: `/document`,
          method: "POST",
          headers: {
            "Content-Type": "multipart/form-data",
          },
          data: {
            ...payload,
            filepath: payload.filepath[0],
          },
        });

        context.dispatch("GetReports", {
          type: payload.type,
        });
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
    SetFormUpdate: async (context, document_id) => {
      context.commit("SET_IS_LOADING", {
        key: "form",
        value: true,
      });

      try {
        const result = await axiosInstance({
          url: `/document/${document_id}?update=true`,
          method: "GET",
        });

        const data = result.data.data;

        context.state.form = {
          type: data.type,
          filepath: null,
          code: data.code,
          name: data.name,
          date: moment(data.date).format("YYYY-MM-DD"),
          remarks: data.remarks,
          users: data.users.map((user) => user.user_id),
          groups: data.groups.map((group) => group.group_id),
          units: data.units.map((unit) => unit.unit_name),
        };

        context.commit("SET_IS_UPDATE", document_id);
      } catch (error) {
        toast.error(error.response.data.message);
      } finally {
        context.commit("SET_IS_LOADING", {
          key: "form",
          value: false,
        });
      }
    },
    Update: async (context, params) => {
      context.commit("SET_IS_LOADING", {
        key: "form",
        value: true,
      });

      try {
        const payload = context.state.form;

        const result = await axiosInstance({
          url: `/document/${params.id}`,
          method: "PUT",
          headers: {
            "Content-Type": "multipart/form-data",
          },
          data: {
            ...payload,
            filepath: payload.filepath ? payload.filepath[0] : null,
          },
        });

        context.dispatch("GetReports", {
          type: payload.type,
        });
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
    Delete: async (context, document_id) => {
      context.commit("SET_IS_LOADING", {
        key: "report",
        value: true,
      });

      try {
        const result = await axiosInstance({
          url: `/document/${document_id}`,
          method: "DELETE",
        });

        context.dispatch("GetReports", {
          type: payload.type,
        });
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
  },
};

export default document;
