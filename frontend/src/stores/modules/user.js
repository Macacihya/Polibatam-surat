import axiosInstance from '@/utils/axios'
import { toast } from 'vue-sonner'

const user = {
  namespaced: true,
  state: {
    loading: {
      reports: false,
      report: false,
      generate: false,
      toggle_admin: false,
    },
    table_options: {
      search: "",
      page: 1,
      page_size: 5,
      total_items: 0,
      total_pages: 0,
    },
    reports: [],
    report: {},
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
  },
  actions: {
    GetReports: async context => {
      context.commit("SET_IS_LOADING", {
        key: "reports",
        value: true,
      })

      try {
        const result = await axiosInstance({
          url: `/user`,
          method: "GET",
          params: {
            page: context.state.table_options.page,
            page_size: context.state.table_options.page_size,
            search: context.state.table_options.search,
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
    GetReport: async (context, nip) => {
      context.commit("SET_IS_LOADING", {
        key: "report",
        value: true,
      })

      try {
        const result = await axiosInstance({
          url: `/user/${nip}`,
          method: "GET",
        })

        let entries = Object.entries(result.data.data)
        let data = []
        entries.forEach(item => {
          data.push({
            key: item[0],
            value: item[1],
          })
        })

        context.commit("SET_REPORT", data)
      } catch (error) {
        toast.error(error.response.data.message)
      } finally {
        context.commit("SET_IS_LOADING", {
          key: "report",
          value: false,
        })
      }
    },
    ToggleRole: async (context, nip) => {
      context.commit("SET_IS_LOADING", {
        key: "toggle_admin",
        value: true,
      })

      try {
        const result = await axiosInstance({
          url: `/user/role/${nip}`,
          method: "PUT",
        })

        toast.success(result.data.message)
        context.dispatch("GetReports")

        return true
      } catch (error) {
        toast.error(error.response.data.message)
      } finally {
        context.commit("SET_IS_LOADING", {
          key: "toggle_admin",
          value: false,
        })
      }
    },
    Generate: async context => {
      context.commit("SET_IS_LOADING", {
        key: "generate",
        value: true,
      })

      try {
        await axiosInstance({
          url: `/user/generate`,
          method: "POST",
        })

        toast.success("Data generated successfully")

      } catch (error) {
        toast.error(error.response.data.message)
      } finally {
        context.commit("SET_IS_LOADING", {
          key: "generate",
          value: false,
        })
      }
    },
  },
}

export default user
