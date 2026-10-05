<script setup>
import navItems from '@/navigation/horizontal'
import { themeConfig } from '@themeConfig'

// Components
import Footer from '@/layouts/components/Footer.vue'
import UserProfile from '@/layouts/components/UserProfile.vue'
import NavBarI18n from '@core/components/I18n.vue'
import { HorizontalNavLayout } from '@layouts'

// SECTION: Loading Indicator
const isFallbackStateActive = ref(false)
const refLoadingIndicator = ref(null)

watch([
  isFallbackStateActive,
  refLoadingIndicator,
], () => {
  if (isFallbackStateActive.value && refLoadingIndicator.value)
    refLoadingIndicator.value.fallbackHandle()
  if (!isFallbackStateActive.value && refLoadingIndicator.value)
    refLoadingIndicator.value.resolveHandle()
}, { immediate: true })
// !SECTION
</script>

<template>
  <HorizontalNavLayout :nav-items="navItems">
    <!-- 👉 navbar -->
    <template #navbar>
      <RouterLink
        to="/"
        class="app-logo d-flex align-center gap-x-3"
      >
        <!-- <VNodeRenderer :nodes="themeConfig.app.logo" /> -->
        <img
          src="/logo.svg"
          alt="Logo"
          srcset="/logo.svg"
          width="70"
        >

        <div>
          <h1
            class="app-title leading-normal"
            style="font-size: 1.2rem; font-weight: 600;"
          >
            <!-- {{ themeConfig.app.title }} -->
            Polibatam
          </h1>

          <p
            class="mb-0 text-grey-600"
            style="font-size: 0.9rem;"
          >
            Aplikasi Pengajuan dan Distribusi SK
          </p>
        </div>
      </RouterLink>
      <VSpacer />

      <NavBarI18n
        v-if="themeConfig.app.i18n.enable && themeConfig.app.i18n.langConfig?.length"
        :languages="themeConfig.app.i18n.langConfig"
      />

      <!-- <NavbarThemeSwitcher class="me-2" /> -->
      <UserProfile />
    </template>

    <AppLoadingIndicator ref="refLoadingIndicator" />

    <!-- 👉 Pages -->
    <RouterView v-slot="{ Component }">
      <Suspense
        :timeout="0"
        @fallback="isFallbackStateActive = true"
        @resolve="isFallbackStateActive = false"
      >
        <Component :is="Component" />
      </Suspense>
    </RouterView>

    <!-- 👉 Footer -->
    <template #footer>
      <Footer />
    </template>

    <!-- 👉 Customizer -->
    <!-- <TheCustomizer /> -->
  </HorizontalNavLayout>
</template>
