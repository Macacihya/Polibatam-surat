<template>
  <div>
    <VCard
      :title="DOCUMENT_TYPE[documentType]"
      :subtitle="`List ${DOCUMENT_TYPE[documentType]} Politeknik Negeri Batam`"
    >
      <template #prepend>
        <VAvatar
          variant="tonal"
          :color="documentType === 'SURAT_KEPUTUSAN' ? 'warning' : 'primary'"
          rounded
        >
          <VIcon
            icon="tabler-notes"
            size="28"
          />
        </VAvatar>
      </template>

      <VDivider />

      <VCardText>
        <div class="d-flex align-center justify-end flex-wrap gap-4">
          <div>
            <AppDateRangePicker
              v-model="range"
              @update:model-value="refetch"
            />
          </div>
          <div style="inline-size: 20rem;">
            <AppTextField
              v-model="table_options.search"
              density="compact"
              placeholder="Search ..."
              append-inner-icon="tabler-search"
            />
          </div>
          <VBtn
            variant="tonal"
            @click="onExport"
          >
            <VIcon
              start
              icon="tabler-file"
            />
            <span class="">
              Export Excel
            </span>
          </VBtn>
        </div>
      </VCardText>

      <VDivider />

      <VCardText>
        <div class="d-flex align-center justify-end flex-wrap gap-4">
          <VBtn
            v-if="isAdmin()"
            @click="handleModalForm(true)"
          >
            <VIcon
              start
              icon="tabler-plus"
            />
            <span class="">
              Tambah
            </span>
          </VBtn>
        </div>
      </VCardText>

      <VDivider />

      <VCardText class="px-0 pt-0">
        <VDataTableServer
          v-model:options="table_options"
          v-model:items-per-page="table_options.page_size"
          v-model:page="table_options.page"
          :items-length="table_options.total_items"
          :headers="headers"
          :items="reports"
          :loading="loading"
          :search="table_options.search"
          @update:options="refetch"
        >
          <!-- Actions -->
          <template #item.code="{ item }">
            <RouterLink
              to="#"
              @click="handleDetail(item.id)"
            >
              {{ item.code }}
            </RouterLink>
          </template>
          <template #item.filepath="{ item }">
            <AppDownloadButton v-model="item.filepath" />
          </template>

          <template #item.actions="{ item }">
            <div class="d-flex justify-end align-center">
              <IconBtn @click="handleDetail(item.id)">
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

    <DocumentDetailModal
      :is-open="modalDetail"
      @handle-close="handleDetail"
    />

    <DocumentFormModal
      :is-open="modalForm"
      :document-type="documentType"
      @handle-close="handleModalForm"
    />
  </div>
</template>

<script setup>
import xlsx from "json-as-xlsx"
import Swal from 'sweetalert2'

const props = defineProps({
  documentType: {
    type: String,
    default: "SURAT_KEPUTUSAN",
  },
})

const DOCUMENT_TYPE = {
  SURAT_KEPUTUSAN: "Surat Keputusan",
  SURAT_TUGAS: "Surat Tugas",
}

const router = useRouter()
const store = useVuex()

const range = ref('')
const modalDetail = ref(false)
const modalForm = ref(false)

const headers = ref([
  { sortable: false, title: "No", key: "code" },
  { sortable: false, title: "Name", key: "name" },
  { sortable: false, title: "Tanggal", key: "date", value: item => formatDate(item.date) },
  { sortable: false, title: "Dokumen", key: "filepath" },
  { sortable: false, title: "Dibuat Pada", key: "created_at", value: item => formatCalendar(item.created_at) },
  { sortable: false, title: "Aksi", key: "actions", align: "end", sortable: false },
])

const computedMoreList = computed(() => {
  return item => [
    {
      title: 'Detail',
      prependIcon: 'tabler-eye',
      onClick: () => handleDetail(item.id),
    },
    {
      title: 'Edit',
      prependIcon: 'tabler-pencil',
      onClick: () => handleEdit(item.id),
      hidden: !isAdmin(),
    },
    {
      title: 'Delete Document',
      prependIcon: 'tabler-trash',
      onClick: () => handleDelete(item.id),
      hidden: !isAdmin(),
    },
  ].filter(item => {
    if(item.hidden) return !item.hidden
    
    return true
  })
})

const handleDetail = id => router.push(`/document/${id}`)

const handleModalForm = value => {
  if(value) store.commit('document/SET_FORM', {
    key: 'type',
    value: props.documentType,
  })
  
  modalForm.value = value
}

const handleEdit = value => {
  store.dispatch("document/SetFormUpdate", value)
  handleModalForm(true)
}

const handleDelete = value => {
  Swal.fire({
    title: 'Apakah Kamu Yakin?',
    text: "Kamu tidak akan bisa mengembalikan data ini!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!',
  }).then(async result => {
    if (result.isConfirmed) {
      await store.dispatch("document/Delete", value)
      await refetch()
    }
  })
}

const onExport = () => {
  const data = [
    {
      columns: [
        { label: "No", value: 'code' },
        { label: "Name", value: 'name' },
        { label: "Tanggal", value: 'date' },
        { label: "Catatan", value: 'remarks' },
        { label: "Dibuat Pada", value: 'created_at' },
      ],
      content: reports.value,
    },
  ]

  console.log('data', data)
  

  let settings = {
    fileName: `${props.documentType} Politeknik Negeri Batam ${range.value}`, 
    extraLength: 3,
    writeMode: "writeFile",
  }

  xlsx(data, settings)
}

const loading = computed(() => store.state.document.loading.reports)
const reports = computed(() => store.state.document.reports)

const table_options = computed({
  get: () => store.state.document.table_options,
  set: value => store.commit('document/SET_OPTIONS_TABLE', value),
})

const refetch = () => store.dispatch('document/GetReports', {
  type: props.documentType,

  start_date: range.value?.split(' to ')[0] || '',
  end_date: range.value?.split(' to ')[1] || '',
})

onMounted(() => refetch())
</script>
