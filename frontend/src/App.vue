<script setup>
import ScrollToTop from "@core/components/ScrollToTop.vue";
import initCore from "@core/initCore";
import { initConfigStore, useConfigStore } from "@core/stores/config";
import { hexToRgb } from "@layouts/utils";
import { Toaster } from "vue-sonner";
import { useTheme } from "vuetify";

const { global } = useTheme();

// ℹ️ Sync current theme with initial loader theme
initCore();
initConfigStore();

const configStore = useConfigStore();

const store = useVuex();

onMounted(() => {
  const token = localStorage.getItem("App-Token");

  if (token) {
    store.commit("app/SET_TOKEN", token);
    store.dispatch("app/fetchProfile");
  }
});
</script>

<template>
  <VLocaleProvider :rtl="configStore.isAppRTL">
    <!-- ℹ️ This is required to set the background color of active nav link based on currently active global theme's primary -->
    <VApp
      :style="`--v-global-theme-primary: ${hexToRgb(
        global.current.value.colors.primary
      )}`"
    >
      <div>
        <RouterView />
      </div>

      <ScrollToTop />
      <Toaster rich-color />
    </VApp>
  </VLocaleProvider>
</template>

<style lang="scss">
.text-nowrap {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.items-center {
  align-items: center;
}

.justify-content-between {
  justify-content: space-between;
}

.sticky-header {
  position: sticky;
  z-index: 9;
  inset-block-end: 0;
  inset-block-start: 8rem;
  transition: all 0.3s ease-in-out;
}

.sticky-sidebar {
  position: sticky;
  z-index: 9;
  inset-block-end: 0;
  inset-block-start: 9rem;
  transition: all 0.3s ease-in-out;
}

@media screen and (max-width: 1264px) {
  .sticky-header {
    inset-block-start: 5rem !important;
  }

  .sticky-sidebar {
    inset-block-start: 6rem !important;
  }
}
</style>
