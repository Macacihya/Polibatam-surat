<template>
  <div>
    <VCard
      title="Pengajuan Surat"
      subtitle="List Pengajuan Surat Politeknik Negeri Batam"
    >
      <VCardText>
        <VBtn to="/submission/form">
          <VIcon
            start
            icon="tabler-plus"
          />
          <span class="">
            Ajukan
          </span>
        </VBtn>
      </VCardText>

      <VDivider />

      <VCardText v-if="isAdmin()">
        <VTabs v-model="activeTab">
          <VTab
            v-for="(tab, index) in tabs"
            :key="`tab-${index}`"
            :color="tab.color"
            :value="tab.type"
            @click="() => onChangeTab(tab.type)"
          >
            <VIcon
              v-if="tab.icon"
              start
              :icon="tab.icon"
            />

            {{ tab.display }} ({{ tab.length }})
          </VTab>
        </VTabs>
      </VCardText>

      
      <VCardText>
        <div class="d-flex align-center justify-end flex-wrap gap-4">
          <div style="inline-size: 20rem;">
            <AppTextField
              v-model="table_options.search"
              density="compact"
              placeholder="Search ..."
              append-inner-icon="tabler-search"
            />
          </div>
        </div>
        <VDivider class="my-5" />
        <VDataTableServer 
          v-model:options="table_options"
          v-model:items-per-page="table_options.page_size"
          v-model:page="table_options.page"
          :items-length="table_options.total_items"
          :headers="headers"
          :items="reports"
          :loading="loading"
          :search="table_options.search"
          class="text-nowrap"
          @update:options="refetch"
        >
          <!-- Actions -->
          <template #item.title="{ item }">
            <div style="min-width: 30rem; text-wrap: pretty;">
              <RouterLink :to="`/submission/${item.id}`">
                {{ item.title }}
              </RouterLink>
            </div>
          </template>
          <template #item.status="{ item }">
            <ChipSubmissionStatus :status="item.status" />
          </template>
          <template #item.filepath_attachment="{ item }">
            <AppDownloadButton v-model="item.filepath_attachment" />
          </template>
          <template #item.filepath="{ item }">
            <AppDownloadButton v-model="item.filepath" />
          </template>

          <template #item.creator="{ item }">
            <CardUser :user="item.creator" />
          </template>

          <template #item.actions="{ item }">
            <div class="d-flex justify-end align-center">
              <IconBtn :to="`/submission/${item.id}`">
                <VIcon icon="tabler-eye" />
              </IconBtn>
              
              <MoreBtn
                :menu-list="computedMoreList(item)"
                item-props
                color="undefined"
              />
            </div>
          </template>
        </VDataTableServer>
      </VCardText>
    </VCard>
  </div>

  <SubmissionFormRejectModal v-model:isDialogVisible="isDialogFormRejectVisible" />
</template>

<script setup>
import SubmissionFormRejectModal from '@/views/submission/submission-form-reject-modal.vue'

const router = useRouter()
const route = useRoute()

const activeTab = ref(route.query.tab || "ALL")
const isDialogFormRejectVisible = ref(false)

const onChangeTab = tab => {
  router.push({ query: { tab } })
  refetch()
}

const tabs = computed(() => ([
  // {
  //   icon: 'tabler-file-text',
  //   type: "DRAFT",
  //   display: 'Draf',
  //   color: 'primary',
  //   length: report_meta.value.DRAFT,
  // },
  {
    icon: 'tabler-file-text',
    type: "POSTED",
    display: 'Diposting',
    color: 'warning',
    length: report_meta.value.POSTED,
  },
  {
    icon: 'tabler-check',
    type: "APPROVED",
    display: 'Disetujui',
    color: 'success',
    length: report_meta.value.APPROVED,
  },
  {
    icon: 'tabler-archive',
    type: "PUBLISHED",
    display: 'Diterbitkan',
    color: 'success',
    length: report_meta.value.PUBLISHED,
  },
  {
    icon: 'tabler-x',
    type: "REJECTED",
    display: 'Ditolak',
    color: 'error',
    length: report_meta.value.REJECTED,
  },
  {
    icon: 'tabler-list',
    type: "ALL",
    display: 'Semua',
    color: 'primary',
    length: report_meta.value.ALL,
  },
]))

const store = useVuex()

const headers = ref([
  { sortable: false, title: "Judul", key: "title" },
  { sortable: false, title: "Type", key: "type" },
  { sortable: false, title: "Status", key: "status" },
  { sortable: false, title: "Diajukan Oleh", key: "creator" },
  { sortable: false, title: "Lampiran", key: "filepath_attachment" },
  { sortable: false, title: "Dokumen", key: "filepath" },
  { sortable: false, title: "Diajukan Pada", key: "created_at", value: val => formatCalendar(val.created_at) },
  { sortable: false, title: "Aksi", key: "actions", align: "end", sortable: false },
])

const computedMoreList = computed(() => {
  return item => [
    {
      title: 'Detail',
      prependIcon: 'tabler-eye',
      to: `/submission/${item.id}`,
    },
    {
      title: 'Edit',
      prependIcon: 'tabler-pencil',
      to: `/submission/form?submission_id=${item.id}`,
      hidden: !['DRAFT', 'REJECTED'].includes(item.status),
    },
    {
      title: 'Posting Pengajuan',
      prependIcon: 'tabler-upload',
      onClick: () => handleUpdateStatus(item.id, 'POSTED'),
      hidden: item.status !== 'DRAFT',
    },
    {
      title: 'Setujui Pengajuan',
      prependIcon: 'tabler-check',
      onClick: () => handleUpdateStatus(item.id, 'APPROVED'),
      hidden: item.status !== 'POSTED' || !isAdmin(),
    },
    {
      title: 'Terbitkan Dokumen',
      prependIcon: 'tabler-archive',
      to: `/submission/form-publish?submission_id=${item.id}`,
      hidden: item.status !== 'APPROVED' || !isAdmin(),
    },
    {
      title: 'Tolak Pengajuan',
      prependIcon: 'tabler-x',
      onClick: () => handleReject(item.id),
      hidden: ['PUBLISHED', 'REJECTED'].includes(item.status) || !isAdmin(),
    },
    {
      title: 'Delete Document',
      prependIcon: 'tabler-trash',
      onClick: () => handleDelete(item.id),
      hidden: item.status !== 'DRAFT' || !isAdmin(),
    },
  ].filter(item => {
    if(item.hidden) return !item.hidden
    
    return true
  })
})

const handleDelete = async submission_id => {
  const confirm = await SwalDelete()
  if (confirm) store.dispatch("submission/Delete", submission_id)
}

const handleUpdateStatus = async (submission_id, status) => {
  const confirm = await SwalUpdateStatus(status)
  if (confirm) {
    store.dispatch("submission/UpdateStatus", { id: submission_id, status })
    onChangeTab(status)
  }
}

const handleReject = async submission_id => {
  store.commit('submission/SET_IS_UPDATE', submission_id)
  isDialogFormRejectVisible.value = true
}

const loading = computed(() => store.state.submission.loading.reports)
const reports = computed(() => store.state.submission.reports)
const report_meta = computed(() => store.state.submission.meta)

const table_options = computed({
  get: () => store.state.submission.table_options,
  set: value => store.commit('submission/SET_OPTIONS_TABLE', value),
})

const refetch = () => store.dispatch('submission/GetReports', {
  status: activeTab.value === 'ALL' ? undefined : activeTab.value,
})

onMounted(() => refetch())
</script>
