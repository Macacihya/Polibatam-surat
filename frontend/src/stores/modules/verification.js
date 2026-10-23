import axiosInstance from "@/utils/axios";
import { IS_VERIFICATION_MOCK } from "@/utils/utils";
import { mockApi } from "@/utils/verificationMock";
import { toast } from "vue-sonner";

// Satu pintu request: pakai mock kalau VITE_VERIFICATION_MOCK=true
const call = (config) => (IS_VERIFICATION_MOCK ? mockApi(config) : axiosInstance(config));

const errorMessage = (error) => error?.response?.data?.message || "Terjadi kesalahan";

const verification = {
  namespaced: true,
  state: {
    loading: {
      stages: false,
      approvals: false,
      tracking: false,
      candidates: false,
      action: false,
    },

    // Sisi admin: konfigurasi tahap & verifikatornya
    stages: [],
    candidates: [],
    candidates_options: { search: "", page: 1, page_size: 5, total_items: 0, total_pages: 0 },

    // Sisi verifikator: surat yang menunggu di tahap tertentu
    approvals: [],
    approvals_stage: null,
    approvals_options: { search: "", page: 1, page_size: 10, total_items: 0, total_pages: 0 },
    meta: { 1: 0, 2: 0, 3: 0 },

    // Sisi pemohon: progres satu surat
    tracking: null,
  },
  mutations: {
    SET_IS_LOADING(state, { key, value }) {
      state.loading[key] = value;
    },
    SET_STAGES(state, payload) {
      state.stages = payload;
    },
    SET_CANDIDATES(state, payload) {
      state.candidates = payload;
    },
    SET_CANDIDATES_OPTIONS(state, payload) {
      Object.assign(state.candidates_options, payload);
    },
    SET_APPROVALS(state, payload) {
      state.approvals = payload;
    },
    SET_APPROVALS_STAGE(state, payload) {
      state.approvals_stage = payload;
    },
    SET_APPROVALS_OPTIONS(state, payload) {
      Object.assign(state.approvals_options, payload);
    },
    SET_META(state, payload) {
      state.meta = { 1: 0, 2: 0, 3: 0, ...payload };
    },
    SET_TRACKING(state, payload) {
      state.tracking = payload;
    },
  },
  actions: {
    // ---------- ADMIN ----------
    GetStages: async (context) => {
      context.commit("SET_IS_LOADING", { key: "stages", value: true });

      try {
        const result = await call({ url: "/verification/stages", method: "GET" });
        context.commit("SET_STAGES", result.data.data);
      } catch (error) {
        toast.error(errorMessage(error));
      } finally {
        context.commit("SET_IS_LOADING", { key: "stages", value: false });
      }
    },
    GetCandidates: async (context) => {
      context.commit("SET_IS_LOADING", { key: "candidates", value: true });

      try {
        const { page, page_size, search } = context.state.candidates_options;
        const result = await call({ url: "/user", method: "GET", params: { page, page_size, search } });

        context.commit("SET_CANDIDATES", result.data.data);
        context.commit("SET_CANDIDATES_OPTIONS", {
          total_items: result.data.pagination.total_items,
          total_pages: result.data.pagination.total_pages,
        });
      } catch (error) {
        toast.error(errorMessage(error));
      } finally {
        context.commit("SET_IS_LOADING", { key: "candidates", value: false });
      }
    },
    AddVerifier: async (context, { stage, nip }) => {
      context.commit("SET_IS_LOADING", { key: "action", value: true });

      try {
        const result = await call({
          url: `/verification/stages/${stage}/verifiers`,
          method: "POST",
          data: { nip },
        });

        toast.success(result.data.message);
        await context.dispatch("GetStages");

        return true;
      } catch (error) {
        toast.error(errorMessage(error));
      } finally {
        context.commit("SET_IS_LOADING", { key: "action", value: false });
      }
    },
    RemoveVerifier: async (context, { stage, nip }) => {
      context.commit("SET_IS_LOADING", { key: "action", value: true });

      try {
        const result = await call({
          url: `/verification/stages/${stage}/verifiers/${nip}`,
          method: "DELETE",
        });

        toast.success(result.data.message);
        await context.dispatch("GetStages");

        return true;
      } catch (error) {
        toast.error(errorMessage(error));
      } finally {
        context.commit("SET_IS_LOADING", { key: "action", value: false });
      }
    },

    // ---------- VERIFIKATOR ----------
    GetApprovals: async (context, params) => {
      const stage = params?.stage ?? context.state.approvals_stage;
      context.commit("SET_APPROVALS_STAGE", stage);
      context.commit("SET_IS_LOADING", { key: "approvals", value: true });

      try {
        const { page, page_size, search } = context.state.approvals_options;
        const result = await call({
          url: "/verification/approvals",
          method: "GET",
          params: { page, page_size, search, stage },
        });

        context.commit("SET_APPROVALS", result.data.data);
        context.commit("SET_APPROVALS_OPTIONS", {
          total_items: result.data.pagination.total_items,
          total_pages: result.data.pagination.total_pages,
        });
        context.commit("SET_META", result.data.meta?.per_stage || {});
      } catch (error) {
        toast.error(errorMessage(error));
      } finally {
        context.commit("SET_IS_LOADING", { key: "approvals", value: false });
      }
    },
    Decide: async (context, { id, decision, remarks }) => {
      context.commit("SET_IS_LOADING", { key: "action", value: true });

      try {
        const result = await call({
          url: `/verification/approvals/${id}/${decision}`, // decision: "approve" | "reject"
          method: "PUT",
          data: { remarks },
        });

        toast.success(result.data.message);
        await context.dispatch("GetApprovals");

        return true;
      } catch (error) {
        toast.error(errorMessage(error));
      } finally {
        context.commit("SET_IS_LOADING", { key: "action", value: false });
      }
    },

    // ---------- PEMOHON ----------
    // Sengaja tanpa toast: kalau endpoint belum ada, stepper cukup tidak ditampilkan.
    GetTracking: async (context, submission_id) => {
      context.commit("SET_IS_LOADING", { key: "tracking", value: true });
      context.commit("SET_TRACKING", null);

      try {
        const result = await call({ url: `/submission/${submission_id}/verification`, method: "GET" });
        context.commit("SET_TRACKING", result.data.data);
      } catch (error) {
        console.log(error);
      } finally {
        context.commit("SET_IS_LOADING", { key: "tracking", value: false });
      }
    },
  },
};

export default verification;
