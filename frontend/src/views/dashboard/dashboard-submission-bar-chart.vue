<script setup>
import { getStackedBarChartConfig } from '@core/libs/chartjs/chartjsConfig'
import BarChart from '@core/libs/chartjs/components/BarChart'
import { useTheme } from 'vuetify'

const props = defineProps({
  refetch: Number,
})

const store = useVuex()
const vuetifyTheme = useTheme()

const data = computed(() => store.state.dashboard.submission_bar_chart)
const loading = computed(() => store.state.dashboard.loading.submission_bar_chart)
const chartConfig = computed(() => getStackedBarChartConfig(vuetifyTheme.current.value))

const fetch = () => store.dispatch('dashboard/GetSubmissionStatusBarChart')

watch(() => props.refetch, () => fetch())

onMounted(() => fetch())
</script>

<template>
  <VCard
    title="Pengajuan SK"
    subtitle="Chart Pengajuan SK status"
    :loading="loading"
  >
    <VCardText>
      <BarChart
        :chart-options="chartConfig"
        :height="248"
        :chart-data="data"
      />
    </VCardText>
  </VCard>
</template>
