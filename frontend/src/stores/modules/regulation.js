import axiosInstance from '@/utils/axios'
import { toast } from 'vue-sonner'

const form = {
  title: "",
}

const regulation = {
  namespaced: true,
  state: {
    loading: {
      reports: false,
      report: false,
      generate: false,
    },
    table_options: {
      search: "",
      page: 1,
      page_size: 10,
      total_items: 0,
      total_pages: 0,
    },
    reports: [],
    report: {},

    form: { ...form },
    form_import: [],
    is_update: false,
  },
  mutations: {
    SET_IS_LOADING(state, payload) {
      state.loading[payload.key] = payload.value
    },
    SET_OPTIONS_TABLE(state, payload) {
      Object.assign(state.table_options, payload)
    },
    SET_REPORTS(state, payload) {
      state.reports = payload
    },
    SET_REPORT(state, payload) {
      state.report = payload
    },

    SET_FORM(state, payload) {
      state.form[payload.key] = payload.value
    },
    SET_FORM_IMPORT(state, payload) {
      state.form_import = payload
    },
    RESET_FORM(state) {
      state.form = { ...form }
      state.form_import = []
    },

    SET_IS_UPDATE(state, payload) {
      state.is_update = payload
    },
  },
  actions: {
    GetReports: async (context, params) => {
      context.commit("SET_IS_LOADING", {
        key: "reports",
        value: true,
      })

      try {
        const result = await axiosInstance({
          url: `/regulation`,
          method: "GET",
          params: {
            page: context.state.table_options.page,
            page_size: context.state.table_options.page_size,
            search: context.state.table_options.search,

            ...params,
          },
        })

        context.commit("SET_REPORTS", result.data.data)

        context.commit("SET_OPTIONS_TABLE", {
          page: result.data.pagination.page,
          page_size: result.data.pagination.page_size,
          total_items: result.data.pagination.total_items,
          total_pages: result.data.pagination.total_pages,
        })
      } catch (error) {
        toast.error(error.response.data.message)
      } finally {
        context.commit("SET_IS_LOADING", {
          key: "reports",
          value: false,
        })
      }
    },
    GetReport: async (context, id) => {
      context.commit("SET_IS_LOADING", {
        key: "report",
        value: true,
      })

      try {
        const result = await axiosInstance({
          url: `/regulation/${id}`,
          method: "GET",
        })

        context.commit("SET_REPORT", result.data.data)
      } catch (error) {
        toast.error(error.response.data.message)
      } finally {
        context.commit("SET_IS_LOADING", {
          key: "report",
          value: false,
        })
      }
    },
    Create: async context => {
      context.commit("SET_IS_LOADING", {
        key: "form",
        value: true,
      })

      try {
        const result = await axiosInstance({
          url: `/regulation`,
          method: "POST",
          data: context.state.form,
        })

        toast.success(result.data.message)
        context.dispatch("GetReports")
        
        return true
      } catch (error) {
        toast.error(error.response.data.message)
      } finally {
        context.commit("SET_IS_LOADING", {
          key: "form",
          value: false,
        })
      }
    },
    SetFormUpdate: async (context, id) => {
      context.commit("SET_IS_LOADING", {
        key: "form",
        value: true,
      })

      try {
        const result = await axiosInstance({
          url: `/regulation/${id}`,
          method: "GET",
        })

        const data = result.data.data

        context.state.form = {
          title: data.title,
        }

        context.commit("SET_IS_UPDATE", id)
      } catch (error) {
        toast.error(error.response.data.message)
      } finally {
        context.commit("SET_IS_LOADING", {
          key: "form",
          value: false,
        })
      }
    },
    BulkCreate: async context => {
      context.commit("SET_IS_LOADING", {
        key: "form",
        value: true,
      })

      try {
        const result = await axiosInstance({
          url: `/regulation/bulk`,
          method: "POST",
          data: context.state.form_import,
        })

        toast.success(result.data.message)
        context.dispatch("GetReports")
        
        return true
      } catch (error) {
        toast.error(error.response.data.message)
      } finally {
        context.commit("SET_IS_LOADING", {
          key: "form",
          value: false,
        })
      }
    },
    Update: async (context, id) => {
      context.commit("SET_IS_LOADING", {
        key: "form",
        value: true,
      })

      try {
        const result = await axiosInstance({
          url: `/regulation/${id}`,
          method: "PUT",
          data: context.state.form,
        })

        toast.success(result.data.message)
        context.dispatch("GetReports")
        
        return true
      } catch (error) {
        toast.error(error.response.data.message)
      } finally {
        context.commit("SET_IS_LOADING", {
          key: "form",
          value: false,
        })
      }
    },
    Delete: async (context, id) => {
      context.commit("SET_IS_LOADING", {
        key: "report",
        value: true,
      })

      try {
        const result = await axiosInstance({
          url: `/regulation/${id}`,
          method: "DELETE",
        })

        toast.success(result.data.message)
        context.dispatch("GetReports")
        
        return true
      } catch (error) {
        toast.error(error.response.data.message)
      } finally {
        context.commit("SET_IS_LOADING", {
          key: "report",
          value: false,
        })
      }
    },
  },
}

export default regulation
