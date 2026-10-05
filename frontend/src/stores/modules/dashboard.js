import axiosInstance from '@/utils/axios'
import { toast } from 'vue-sonner'

const dashboard = {
  namespaced: true,
  state: {
    loading: {
      reports: false,

      submission_bar_chart: false,
      submission_donut_chart: false,
    },
    data: {
      surat_tugas_count: 0,
      surat_keputusan_count: 0,
      histories: [],
    },

    submission_bar_chart: { labels: [], datasets: [] },
    submission_donut_chart: { labels: [], datasets: [] },
  },
  mutations: {
    SET_LOADING(state, payload) {
      state.loading[payload.key] = payload.value
    },
  },
  actions: {
    GetReports: async (context, params) => {
      context.commit("SET_LOADING", {
        key: "reports",
        value: true,
      })

      try {
        const result = await axiosInstance({
          url: `/dashboard`,
          method: "GET",
          params: params,
        })

        const data = result.data.data

        context.state.data = {
          surat_tugas_count: data.surat_tugas_count,
          surat_keputusan_count: data.surat_keputusan_count,
          histories: data.histories,
        }
        
      } catch (error) {
        toast.error(error.response.data.message)
      } finally {
        context.commit("SET_LOADING", {
          key: "reports",
          value: false,
        })
      }
    }, 
    GetSubmissionStatusBarChart: async context => {
      context.commit("SET_LOADING", {
        key: "submission_bar_chart",
        value: true,
      })

      try {
        const result = await axiosInstance({
          url: `/dashboard/submission-by-status-bar-chart`,
          method: "GET",
          params: {
            year: context.rootState.app.filter.year,
          },
        })

        context.state.submission_bar_chart = result.data.data
        
      } catch (error) {
        toast.error(error.response.data.message)
      } finally {
        context.commit("SET_LOADING", {
          key: "submission_bar_chart",
          value: false,
        })
      }
    }, 
    GetSubmissionStatusDonutChart: async context => {
      context.commit("SET_LOADING", {
        key: "submission_donut_chart",
        value: true,
      })

      try {
        const result = await axiosInstance({
          url: `/dashboard/submission-by-status-donut-chart`,
          method: "GET",
          params: {
            year: context.rootState.app.filter.year,
            month: context.rootState.app.filter.month,
            range: context.rootState.app.filter.range,
            type: context.rootState.app.filter_type,
          },
        })

        context.state.submission_donut_chart = result.data.data
        
      } catch (error) {
        // toast.error(error.response.data.message)
      } finally {
        context.commit("SET_LOADING", {
          key: "submission_donut_chart",
          value: false,
        })
      }
    }, 
  },
}

export default dashboard
