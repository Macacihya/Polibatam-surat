import axiosInstance from "@/utils/axios"
import moment from "moment"
import { toast } from 'vue-sonner'

const first_day = moment().startOf('month').format('YYYY-MM-DD')
const last_day = moment().endOf('month').format('YYYY-MM-DD')

const app = {
  namespaced: true,
  state: {
    loading: false,
    user: "",
    token: "",

    filter_type: 'YEAR',
    filter: {
      range: `${first_day} to ${last_day}`,
      month: moment().format('YYYY-MM'),
      year: moment().format('YYYY'),
    },
  },
  mutations: {
    SET_LOADING(state, payload) {
      state.loading = payload
    },
    SET_USER(state, payload) {
      state.user = payload
    },
    SET_TOKEN(state, payload) {
      state.token = payload
    },

    SET_FILTER_TYPE(state, payload) {
      state.filter_type = payload
    },
    SET_FILTER(state, payload) {
      state.filter[payload.key] = payload.value
    },
  },
  actions: {
    async Login(context, payload) {
      context.commit("SET_LOADING", true)

      try {
        const result = await axiosInstance({
          url: `/login`,
          method: "POST",
          data: payload,
        })

        context.commit("SET_USER", result.data.data.user)
        localStorage.setItem("App-User", JSON.stringify(result.data.data.user))

        context.commit("SET_TOKEN", result.data.data.token)
        localStorage.setItem("App-Token", result.data.data.token)

        window.location.href = "/"

        return true
      } catch (error) {
        toast.error(error.response.data.message)
      } finally {
        context.commit("SET_LOADING", false)
      }
    },
    async Logout(context) {
      context.commit("SET_USER", "")
      localStorage.removeItem("App-User")

      context.commit("SET_TOKEN", "")
      localStorage.removeItem("App-Token")

      window.location.href = "/login"
    },

    async fetchProfile(context) {
      context.commit("SET_LOADING", true)

      try {
        const result = await axiosInstance({
          url: `/whoami`,
          method: "GET",
        })

        context.commit("SET_USER", result.data.data)
        localStorage.setItem("App-User", JSON.stringify(result.data.data))

        return true
      } catch (error) {
        toast.error(error.response.data.message)
      } finally {
        context.commit("SET_LOADING", false)
      }
    },
  },
}

export default app
