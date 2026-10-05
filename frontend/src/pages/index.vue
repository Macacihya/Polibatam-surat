
<template>
  <div class="d-flex justify-end">
    <AppDateRangePicker v-model="range" />
  </div>
  <VRow>
    <VCol
      v-for="(data, index) in [
        {
          icon: 'tabler-file',
          color: 'primary',
          title: 'Surat Tugas',
          value: report.surat_tugas_count,
        },
        {
          icon: 'tabler-notes',
          color: 'warning',
          title: 'Surat Keputusan',
          value: report.surat_keputusan_count,
        },
      ]"
      :key="index"
      cols="12"
      md="3"
      sm="6"
    >
      <div>
        <VCard
          class="logistics-card-statistics cursor-pointer"
          :style="{ 'border-block-end': `2px solid rgba(var(--v-theme-${data.color}), var(--v-disabled-opacity))` }"
        >
          <VCardText>
            <div class="d-flex align-center gap-x-4 mb-2">
              <VAvatar
                variant="tonal"
                :color="data.color"
                rounded
              >
                <VIcon
                  :icon="data.icon"
                  size="28"
                />
              </VAvatar>
              <h5 class="text-h5 font-weight-medium">
                {{ data.value }}
              </h5>
            </div>
            <div class="text-body-1">
              {{ data.title }}
            </div>
          </VCardText>
        </VCard>
      </div>
    </VCol>

    <VCol
      v-if="isAdmin()"
      cols="12"
      md="8"
    >
      <DashboardSubmissionBarChart :refetch="refetch_year_only" />
    </VCol>
    <VCol
      v-if="isAdmin()"
      cols="12"
      md="4"
    >
      <DashboardSubmissionDonutChart :refetch="refetch" />
    </VCol>

    <VCol cols="12">
      <VCard
        title="Riwayat Dokumen"
        subtitle="10 List Dokument Terakhir Politeknik Negeri Batam"
      >
        <VDivider />

        <VCardText>
          <VDataTable
            :headers="[
              { title: 'No', key: 'code' },
              { title: 'Name', key: 'name' },
              { title: 'Tanggal', key: 'date', value: item => formatTanggal(item.date) },
              { title: 'Dokumen', key: 'filepath' },
              { title: 'Dibuat Pada', key: 'created_at', value: item => formatCalendar(item.created_at) },
            ]"
            :items="report.histories"
            :loading="loading"
            :search="search"
          >
            <template #item.filepath="{ item }">
              <AppDownloadButton v-model="item.filepath" />
            </template>
            <template #bottom />
          </VDataTable>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<script setup>
import DashboardSubmissionBarChart from '@/views/dashboard/dashboard-submission-bar-chart.vue'
import DashboardSubmissionDonutChart from '@/views/dashboard/dashboard-submission-donut-chart.vue'

const store = useVuex()

const range = ref('')

watch(range, () => {
  console.log('range', range.value)

  onRefetch()
})

const report = computed(() => store.state.dashboard.data)

const refetch_year_only = ref(0)
const refetch = ref(0)

const filter_type = computed(() => store.state.app.filter_type)
const filter = computed(() => store.state.app.filter)

const onRefetch = async () => {
  try {
    console.log('onRefetch called')
    await store.dispatch('dashboard/GetReports', {
      start_date: range.value?.split(' to ')[0] || '',
      end_date: range.value?.split(' to ')[1] || '',
    })
  } catch (error) {
    console.error('Error in onRefetch', error)
  }
}

const handleRefetch = () => {
  if(filter_type.value === 'YEAR') {
    refetch_year_only.value++
  } 
  
  refetch.value++
  onRefetch()
}

watch(filter, () => handleRefetch(), { deep: true })
watch(filter_type, () => handleRefetch(), { deep: true })

onMounted(async () =>  await onRefetch())
</script>
