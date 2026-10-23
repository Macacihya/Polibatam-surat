<template>
  <div>
    <VCard
      title="Daftar Persetujuan"
      subtitle="Surat yang menunggu verifikasi Anda"
    >
      <VCardText v-if="myStages.length > 1">
        <VTabs v-model="activeStage">
          <VTab
            v-for="stage in myStages"
            :key="stage"
            :value="stage"
            @click="onChangeStage(stage)"
          >
            <VIcon
              start
              icon="tabler-list-check"
            />
            Tahap {{ stage }} ({{ meta[stage] ?? 0 }})
          </VTab>
        </VTabs>
      </VCardText>

      <VDivider />

      <VCardText>
        <div class="d-flex align-center justify-end flex-wrap gap-4">
          <div style="inline-size: 20rem; max-inline-size: 100%;">
            <AppTextField
              v-model="table_options.search"
              density="compact"
              placeholder="Cari judul surat ..."
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
          :items="approvals"
          :loading="loading"
          :search="table_options.search"
          class="text-nowrap"
          @update:options="refetch"
        >
          <template #item.title="{ item }">
            <div style="min-width: 24rem; text-wrap: pretty;">
              <RouterLink :to="`/submission/${item.id}`">
                {{ item.title }}
              </RouterLink>
            </div>
          </template>

          <template #item.creator="{ item }">
            <CardUser :user="item.creator" />
          </template>

          <template #item.actions="{ item }">
            <div class="d-flex justify-end align-center gap-2">
              <IconBtn
                :to="`/submission/${item.id}`"
                aria-label="Lihat detail"
              >
                <VIcon icon="tabler-eye" />
              </IconBtn>

              <VBtn
                size="small"
                color="success"
                variant="tonal"
                @click="openDecision(item, 'approve')"
              >
                <VIcon
                  start
                  icon="tabler-check"
                />
                Setujui
              </VBtn>

              <VBtn
                size="small"
                color="error"
                variant="tonal"
                @click="openDecision(item, 'reject')"
              >
                <VIcon
                  start
                  icon="tabler-x"
                />
                Tolak
              </VBtn>
            </div>
          </template>

          <template #no-data>
            <div class="py-8 text-center text-medium-emphasis">
              <VIcon
                icon="tabler-circle-check"
                size="40"
                class="mb-2"
              />
              <div>Tidak ada surat yang menunggu persetujuan Anda.</div>
            </div>
          </template>
        </VDataTableServer>
      </VCardText>
    </VCard>

    <VerificationDecisionDialog
      v-model:isDialogVisible="isDecisionVisible"
      :mode="decisionMode"
      :submission="decisionTarget"
    />
  </div>
</template>

<script setup>
import VerificationDecisionDialog from '@/views/verification/verification-decision-dialog.vue'

const store = useVuex()
const router = useRouter()
const route = useRoute()

const myStages = getVerifierStages()
const initialStage = Number(route.query.stage)

const activeStage = ref(myStages.includes(initialStage) ? initialStage : myStages[0])

const isDecisionVisible = ref(false)
const decisionMode = ref('approve')
const decisionTarget = ref(null)

const headers = [
  { sortable: false, title: 'Judul', key: 'title' },
  { sortable: false, title: 'Type', key: 'type' },
  { sortable: false, title: 'Diajukan Oleh', key: 'creator' },
  { sortable: false, title: 'Diajukan Pada', key: 'created_at', value: val => formatCalendar(val.created_at) },
  { sortable: false, title: 'Masuk Tahap Ini', key: 'stage_entered_at', value: val => formatCalendar(val.stage_entered_at) },
  { sortable: false, title: 'Aksi', key: 'actions', align: 'end' },
]

const loading = computed(() => store.state.verification.loading.approvals)
const approvals = computed(() => store.state.verification.approvals)
const meta = computed(() => store.state.verification.meta)

const table_options = computed({
  get: () => store.state.verification.approvals_options,
  set: value => store.commit('verification/SET_APPROVALS_OPTIONS', value),
})

const refetch = () => store.dispatch('verification/GetApprovals', { stage: activeStage.value })

const onChangeStage = stage => {
  router.push({ query: { stage } })
  table_options.value = { page: 1 }
  refetch()
}

const openDecision = (item, mode) => {
  decisionTarget.value = item
  decisionMode.value = mode
  isDecisionVisible.value = true
}

onMounted(() => {
  // Menu ini hanya untuk akun yang terdaftar sebagai verifikator aktif
  if (!isVerifier()) return router.replace('/')
  table_options.value = { search: '', page: 1 }
  refetch()
})
</script>
