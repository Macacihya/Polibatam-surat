<script setup>
const props = defineProps({
  refetch: Number,
})

const headingColor = 'rgba(var(--v-theme-on-background), var(--v-high-emphasis-opacity))'
const labelColor = 'rgba(var(--v-theme-on-background), var(--v-medium-emphasis-opacity))'

const store = useVuex()
const data = computed(() => store.state.dashboard.submission_donut_chart)
const loading = computed(() => store.state.dashboard.loading.submission_donut_chart)

const fetch = () => store.dispatch('dashboard/GetSubmissionStatusDonutChart')

watch(() => props.refetch, () => fetch())

onMounted(() => fetch())

const deliveryExceptionsChartConfig = computed(() => ({
  labels: data.value.labels,
  colors: [
    '#7367F0',
    '#28C76F',
    '#FF9F43',
    '#FF6C44',
    '#FF5252',
  ],
  stroke: { width: 0 },
  dataLabels: {
    enabled: false,
    formatter(val) {
      return `${ Number.parseInt(val) }%`
    },
  },
  legend: {
    show: true,
    position: 'bottom',
    offsetY: 10,
    markers: {
      width: 8,
      height: 8,
      offsetX: -3,
    },
    itemMargin: {
      horizontal: 15,
      vertical: 5,
    },
    fontSize: '13px',
    fontWeight: 400,
    labels: {
      colors: headingColor,
      useSeriesColors: false,
    },
  },
  tooltip: { theme: false },
  grid: { padding: { top: 15 } },
  plotOptions: {
    pie: {
      donut: {
        size: '75%',
        labels: {
          show: true,
          value: {
            fontSize: '26px',
            color: headingColor,
            fontWeight: 500,
            offsetY: -15,
            formatter(val) {
              return `${ Number.parseInt(val) }`
            },
          },
          name: { offsetY: 30 },
          total: {
            show: true,
            fontSize: '0.75rem',
            fontWeight: 400,
            label: 'Total Pengajuan',
            color: labelColor,
            formatter() {
              return data?.value?.datasets?.reduce((a, b) => a + b, 0)
            },
          },
        },
      },
    },
  },
  responsive: [{
    breakpoint: 420,
    options: { chart: { height: 400 } },
  }],
}))
</script>

<template>
  <VCard
    title="Status Pengajuan SK"
    :loading="loading"
  >
    <VCardText v-if="data?.datasets?.length">
      <VueApexCharts
        type="donut"
        height="300"
        :options="deliveryExceptionsChartConfig"
        :series="data.datasets"
      />
    </VCardText>
    <VCardText v-else>
      <div>No data available</div>
    </VCardText>
  </VCard>
</template>

