<script setup>
const props = defineProps({
  isDialogVisible: { type: Boolean, required: true },
  stage: { type: Object, default: null }, // { stage, name, verifiers }
})

const emit = defineEmits(['update:isDialogVisible'])

const store = useVuex()

const headers = [
  { sortable: false, title: 'NIP', key: 'nip' },
  { sortable: false, title: 'Nama', key: 'nama' },
  { sortable: false, title: 'Unit', key: 'unit' },
  { sortable: false, title: 'Aksi', key: 'actions', align: 'end' },
]

const candidates = computed(() => store.state.verification.candidates)
const loading = computed(() => store.state.verification.loading.candidates)
const saving = computed(() => store.state.verification.loading.action)

const options = computed({
  get: () => store.state.verification.candidates_options,
  set: value => store.commit('verification/SET_CANDIDATES_OPTIONS', value),
})

const registeredNips = computed(() => (props.stage?.verifiers || []).map(v => v.nip))
const isRegistered = nip => registeredNips.value.includes(nip)

const refetch = () => store.dispatch('verification/GetCandidates')

// Cari dengan jeda 400ms supaya tidak menembak API tiap ketukan
watchDebounced(() => options.value.search, () => {
  options.value = { page: 1 }
  refetch()
}, { debounce: 400 })

watch(() => props.isDialogVisible, visible => {
  if (!visible) return
  options.value = { search: '', page: 1 }
  refetch()
})

const handlePick = async user => {
  const done = await store.dispatch('verification/AddVerifier', { stage: props.stage.stage, nip: user.nip })
  if (done) emit('update:isDialogVisible', false)
}
</script>

<template>
  <VDialog
    max-width="800"
    :model-value="props.isDialogVisible"
    @update:model-value="val => emit('update:isDialogVisible', val)"
  >
    <DialogCloseBtn @click="emit('update:isDialogVisible', false)" />

    <VCard class="px-2 py-5">
      <VCardText class="pt-3">
        <h6 class="text-lg font-weight-medium mb-1">
          Tambah Verifikator
        </h6>
        <p class="mb-5">
          Pilih pegawai yang akan memverifikasi surat pada Tahap {{ stage?.stage }}
          <strong v-if="stage?.name">({{ stage.name }})</strong>.
        </p>

        <div
          class="mb-4"
          style="inline-size: 20rem; max-inline-size: 100%;"
        >
          <AppTextField
            v-model="options.search"
            density="compact"
            placeholder="Cari nama atau NIP ..."
            append-inner-icon="tabler-search"
          />
        </div>

        <VDataTableServer
          v-model:options="options"
          v-model:items-per-page="options.page_size"
          v-model:page="options.page"
          :items-length="options.total_items"
          :headers="headers"
          :items="candidates"
          :loading="loading"
          class="text-no-wrap"
          @update:options="refetch"
        >
          <template #item.nama="{ item }">
            <span>{{ item.nama }}</span>
            <span> {{ item.gelar_blk }}</span>
          </template>

          <template #item.actions="{ item }">
            <VChip
              v-if="isRegistered(item.nip)"
              size="small"
              color="success"
              label
            >
              Sudah terdaftar
            </VChip>
            <VBtn
              v-else
              size="small"
              variant="tonal"
              :loading="saving"
              @click="handlePick(item)"
            >
              <VIcon
                start
                icon="tabler-user-plus"
              />
              Pilih
            </VBtn>
          </template>
        </VDataTableServer>
      </VCardText>
    </VCard>
  </VDialog>
</template>
