<template>
  <div>
    <VCard
      title="Pegawai"
      subtitle="List pegawai Politeknik Negeri Batam"
    >
      <VDivider />

      <VCardText>
        <div class="d-flex align-center justify-end flex-wrap gap-4">
          <div style="inline-size: 20rem;">
            <AppTextField
              v-model="table_options.search"
              density="compact"
              placeholder="Search ..."
              append-inner-icon="tabler-search"
              @update:model-value="() => refetch()"
            />
          </div>
          <div>
            <VBtn
              color="primary"
              :loading="is_generate"
              @click="onGenerate"
            >
              <VIcon
                icon="tabler-user-plus"
                start
              />
              Generate Pegawai
            </VBtn>
          </div>
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
          <template #[`item.nama`]="{ item }">
            <!-- <span> {{ item.GELAR_DPN }} </span> -->
            <span> {{ item.nama }}</span>
            <span> {{ item.gelar_blk }}</span>
          </template>
          <template #[`item.is_admin`]="{ item }">
            <VChip
              :color="item.is_admin ? 'success' : 'error'"
              :text-color="item.is_admin ? 'white' : 'white'"
              small
            >
              <span v-if="item.is_admin">Admin</span>
              <span v-else>Pegawai</span>
            </VChip>
          </template>

          <!-- Actions -->
          <template #item.actions="{ item }">
            <div class="d-flex justify-end align-center">
              <IconBtn @click="handleModalDetail(item.nip)">
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

    <DetailModal
      :is-open="modalDetail"
      @handle-close="handleModalDetail"
    />
  </div>
</template>

<script setup>
import DetailModal from '@/views/user/user-detail-modal.vue'
import Swal from 'sweetalert2'

const store = useVuex()
const modalDetail = ref(false)

const headers = ref([
  { sortable: false, title: "NIP", value: "nip" },
  { sortable: false, title: "Nama", value: "nama" },
  { sortable: false, title: "Staff", value: "staff" },
  { sortable: false, title: "Unit", value: "unit" },
  { sortable: false, title: "Role", value: "is_admin" },
  { sortable: false, title: "Aksi", value: "actions", align: "end" },
])

const computedMoreList = computed(() => {
  return item => [
    {
      title: 'Pegawai Detail',
      prependIcon: 'tabler-eye',
      onClick: () => handleModalDetail(item.nip),
    },
    {
      title: 'Ubah Sebagai Admin',
      prependIcon: 'tabler-arrow-up',
      onClick: () => handleSetAdmin(item.nip),
      hidden: item.is_admin || !isAdmin(),
    },
    {
      title: 'Ubah Sebagai Pegawai',
      prependIcon: 'tabler-arrow-down',
      onClick: () => handleSetNonAdmin(item.nip),
      hidden: !item.is_admin || !isAdmin(),
    },
  ].filter(item => {
    if(item.hidden) return !item.hidden
    
    return true
  })
})

const handleModalDetail = value => {
  if(value) store.dispatch('user/GetReport', value)
  modalDetail.value = value
}

const onGenerate = () => {
  store.dispatch('user/Generate')
}

const handleSetAdmin = nip =>  {
  Swal.fire({
    title: 'Ubah Sebagai Admin',
    text: 'Apakah anda yakin ingin mengubah pegawai ini sebagai admin?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Ya',
    cancelButtonText: 'Tidak',
  }).then(result => {
    if(result.isConfirmed) {
      store.dispatch('user/ToggleRole', nip)
    }
  })
}

const handleSetNonAdmin = nip => {
  Swal.fire({
    title: 'Ubah Sebagai Pegawai',
    text: 'Apakah anda yakin ingin mengubah pegawai ini sebagai pegawai?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Ya',
    cancelButtonText: 'Tidak',
  }).then(result => {
    if(result.isConfirmed) {
      store.dispatch('user/ToggleRole', nip)
    }
  })
}


const loading = computed(() => store.state.user.loading.reports)
const is_generate = computed(() => store.state.user.loading.generate)

const reports = computed(() => store.state.user.reports)

const table_options = computed({
  get: () => store.state.user.table_options,
  set: value => store.commit('user/SET_OPTIONS_TABLE', value),
})

const refetch = () => store.dispatch('user/GetReports')

onMounted(() => refetch())
</script>
