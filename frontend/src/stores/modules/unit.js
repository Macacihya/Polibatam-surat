import axiosInstance from '@/utils/axios'
import { toast } from 'vue-sonner'

const unit = {
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
          url: `/unit`,
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
    GetReport: async (context, id) => {
      context.commit("SET_IS_LOADING", {
        key: "report",
        value: true,
      })

      try {
        const result = await axiosInstance({
          url: `/unit/${id}`,
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
    Generate: async context => {
      context.commit("SET_IS_LOADING", {
        key: "generate",
        value: true,
      })

      try {
        await axiosInstance({
          url: `/unit/generate`,
          method: "POST",
        })

        toast.success("Data generated successfully")
        context.dispatch("GetReports")

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

export default unit
