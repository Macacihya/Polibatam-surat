<template>
  <div
    v-if="submission?.status === 'REJECTED' && submission?.logs[0]?.reject_remarks"
    class="mb-5"
  >
    <VAlert
      border="start"
      border-color="error"
    >
      <small>Catatan :</small> <br>
      <span class="text-sm">{{ submission?.logs[0]?.reject_remarks }}</span>
    </VAlert>
  </div>
    
  <VRow>
    <VCol
      cols="12"
      md="8"
    >
      <VCard
        :loading="loading"
        class="overflow-visible"
      >
        <div class="sticky-header bg-background border-b">
          <VCardText class="d-flex justify-space-between items-center">
            <div>
              <VCardTitle>
                <strong :class="`text-${getStatus(submission?.status)?.color}`">[{{ submission?.status }}]</strong> Pengajuan SK | {{ submission?.title }}
              </VCardTitle>
              <VCardSubtitle>
                Pengajuan Surat Keputusan pada Politeknik Negeri Batam
              </VCardSubtitle>
            </div>
          </VCardText>
        </div>

        <VCardText>
          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <div
                v-for="(item, i) in [
                  {key: 'Type', value: submission?.type},
                  {key: 'Rencana Pengambilan', value: formatTanggal(submission?.pickup_plan)}, ]"
                :key="i"
              >
                <p class="text-h6 mb-2">
                  {{ item.key }}
                </p>
                <p class="text-body-1">
                  {{ item.value }}
                </p>
              </div>
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <div
                v-for="(item, i) in [
                  {key: 'Diajukan Pada', value: formatCalendar(submission?.created_at)},
                  {key: 'Terakhir Diubah Pada', value: formatCalendar(submission?.updated_at)},
                ]"
                :key="i"
              >
                <p class="text-h6 mb-2">
                  {{ item.key }}
                </p>
                <p class="text-body-1">
                  {{ item.value }}
                </p>
              </div>
            </VCol>
          </VRow>

          <div>
            <p class="text-h6 mb-2">
              Lampiran
            </p>
            <div v-if="submission?.is_attachment">
              <a
                :href="submission?.filepath_attachment"
                target="_blank"
                rel="noopener noreferrer"
                class="d-flex gap-2 items-center text-body-1"
              >
                <VIcon icon="tabler-cloud-download" />
                <span class="">Unduh Lampiran</span>
              </a>
            </div>

            <p
              v-else
              class="text-body-1"
            >
              Tidak Ada
            </p>
          </div>

          <div class="d-flex justify-end gap-10 flex-wrap mt-5">
            <div>
              <p class="text-overline mb-0">
                Diajukan Oleh
              </p>
              <CardUser :user="submission?.creator" />
            </div>
            <div v-if="submission?.modifier">
              <p class="text-overline mb-0">
                Diubah Oleh
              </p>
              <CardUser :user="submission?.modifier" />
            </div>
          </div>

          <VDivider class="my-5" />
      
          <div class="mb-5">
            <h6 class="text-h6 mb-2">
              Pertimbangan
            </h6>
            <ul class="ps-5">
              <li
                v-for="item in submission?.list_consider"
                :key="item"
                class="text-body-1"
              >
                {{ item }}
              </li>
            </ul>
          </div>
          <div class="mb-5">
            <h6 class="text-h6 mb-2">
              Pengamatan
            </h6>
            <ul class="ps-5">
              <li
                v-for="item in submission?.list_observe"
                :key="item"
                class="text-body-1"
              >
                {{ item }}
              </li>
            </ul>
          </div>
          <div class="mb-5">
            <h6 class="text-h6 mb-2">
              Keputusan
            </h6>
            <ul class="ps-5">
              <li
                v-for="item in submission?.list_decide"
                :key="item"
                class="text-body-1"
              >
                {{ item }}
              </li>
            </ul>
          </div>

          <VDivider class="my-5" />

          <VTabs v-model="currentTab">
            <VTab>Pegawai</VTab>
            <VTab>Unit</VTab>
            <VTab>Group</VTab>
          </VTabs>
          <VCardText class="">
            <VWindow v-model="currentTab">
              <VWindowItem>
                <div class="d-flex align-center justify-end flex-wrap gap-4 mb-5">
                  <div style="inline-size: 20rem;">
                    <AppTextField
                      v-model="search_user"
                      density="compact"
                      placeholder="Search ..."
                      append-inner-icon="tabler-search"
                    />
                  </div>
                </div>
                <VDataTable
                  :headers="[
                    { title: 'NIP', key: 'user.nip' },
                    { title: 'Nama', key: 'user.nama' },
                    { title: 'Staff', key: 'user.staff' },
                    { title: 'Unit', key: 'user.unit' },
                  ]"
                  :items="submission.users"
                  :search="search_user"
                  :items-per-page="5"
                  class="text-no-wrap"
                />
              </VWindowItem>
              <VWindowItem>
                <div class="d-flex align-center justify-end flex-wrap gap-4 mb-5">
                  <div style="inline-size: 20rem;">
                    <AppTextField
                      v-model="search_unit"
                      density="compact"
                      placeholder="Search ..."
                      append-inner-icon="tabler-search"
                    />
                  </div>
                </div>
                <VDataTable
                  :headers="[
                    { title: 'Unit', key: 'unit_name' },
                  ]"
                  :items="submission.units"
                  :search="search_unit"
                  :items-per-page="5"
                  class="text-no-wrap"
                />
              </VWindowItem>
              <VWindowItem>
                <div class="d-flex align-center justify-end flex-wrap gap-4 mb-5">
                  <div style="inline-size: 20rem;">
                    <AppTextField
                      v-model="search_group"
                      density="compact"
                      placeholder="Search ..."
                      append-inner-icon="tabler-search"
                    />
                  </div>
                </div>
                <VDataTable
                  :headers="[
                    { title: 'Name', key: 'group.name' },
                    { title: 'Created At', key: 'group.created_at' , value: (v) => formatCalendar(v.group.created_at) },
                  ]"
                  :items="submission.groups"
                  :search="search_group"
                  :items-per-page="5"
                  class="text-no-wrap"
                />
              </VWindowItem>
            </VWindow>
          </VCardText>
        </VCardText>
      </VCard>
    </VCol>
    <VCol
      cols="12"
      md="4"
    >
      <VCard
        :loading="loading"
        class="sticky-sidebar"
        title="Log Aktivitas"
        subtitle="Aktivitas Pengajuan"
      >
        <VCardText style="max-height: 500px; overflow-y: scroll;">
          <VTimeline
            side="end"
            align="start"
            line-inset="8"
            truncate-line="both"
            density="compact"
          >
            <VTimelineItem
              v-for="log in submission.logs"
              :key="log.id"
              :dot-color="getStatus(log.status).color"
              size="x-small"
            >
              <!-- 👉 Header -->
              <div class="d-flex justify-space-between align-center gap-2 flex-wrap mb-2">
                <span class="app-timeline-title">
                  {{ getStatus(log.status).display }}
                </span>
                <span class="app-timeline-meta">
                  {{ formatCalendar(log.created_at) }}
                </span>
              </div>
  
              <!-- 👉 Content -->
              <div class="app-timeline-text mb-3">
                {{ log.remarks }}
              </div>
  
              <CardUser :user="log.creator" />
            </VTimelineItem>
          </VTimeline>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<script setup>
const store = useVuex()
const route = useRoute()
const router = useRouter()
const submission_id = ref(route.params.id)
const currentTab = ref('tab-1')

const search_user = ref('')
const search_unit = ref('')
const search_group = ref('')

const statuses = [
  {
    icon: 'tabler-file-text',
    type: "DRAFT",
    display: 'Draf',
    color: 'primary',
  },
  {
    icon: 'tabler-file-text',
    type: "POSTED",
    display: 'Diposting',
    color: 'warning',
  },
  {
    icon: 'tabler-check',
    type: "APPROVED",
    display: 'Disetujui',
    color: 'success',
  },
  {
    icon: 'tabler-archive',
    type: "PUBLISHED",
    display: 'Diterbitkan',
    color: 'success',
  },
  {
    icon: 'tabler-x',
    type: "REJECTED",
    display: 'Ditolak',
    color: 'error',
  },
  {
    icon: 'tabler-list',
    type: "ALL",
    display: 'Semua',
    color: 'primary',
  },
]

const getStatus = type => statuses.find(status => status.type === type)

const submission = computed(() => store.state.submission.report)
const loading = computed(() => store.state.submission.loading.report)

onMounted(() => {
  store.dispatch('submission/GetReport', submission_id.value)
})
</script>

<style lang="scss" scoped>
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
