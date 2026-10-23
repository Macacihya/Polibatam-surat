<template>
  <div>
    <VCard
      title="Pengaturan Verifikasi"
      subtitle="Atur siapa saja yang memverifikasi surat pada setiap tahap"
      class="mb-6"
    >
      <VCardText>
        <VAlert
          variant="tonal"
          color="info"
          icon="tabler-info-circle"
        >
          Surat diproses berurutan dari Tahap 1 sampai Tahap {{ stages.length || 3 }}. Setiap tahap bisa memiliki lebih dari satu verifikator.
        </VAlert>
      </VCardText>
    </VCard>

    <VRow>
      <VCol
        v-for="stage in stages"
        :key="stage.stage"
        cols="12"
        md="4"
      >
        <VCard
          :loading="loading"
          class="h-100"
        >
          <VCardItem>
            <template #prepend>
              <VAvatar
                color="primary"
                variant="tonal"
                rounded
              >
                <span class="text-h6">{{ stage.stage }}</span>
              </VAvatar>
            </template>

            <VCardTitle>Tahap {{ stage.stage }}</VCardTitle>
            <VCardSubtitle>{{ stage.name }} · {{ stage.verifiers.length }} verifikator</VCardSubtitle>
          </VCardItem>

          <VDivider />

          <VCardText>
            <VAlert
              v-if="!stage.verifiers.length"
              variant="tonal"
              color="warning"
              density="compact"
              class="mb-4"
            >
              Belum ada verifikator. Surat akan tertahan di tahap ini.
            </VAlert>

            <VList
              v-else
              class="py-0 mb-4"
              lines="two"
            >
              <VListItem
                v-for="verifier in stage.verifiers"
                :key="verifier.nip"
                class="px-0"
              >
                <template #prepend>
                  <VAvatar
                    color="secondary"
                    variant="tonal"
                    size="38"
                  >
                    {{ avatarText(verifier.nama)?.slice(0, 2) }}
                  </VAvatar>
                </template>

                <VListItemTitle>{{ capitalizeName(verifier.nama) }}</VListItemTitle>
                <VListItemSubtitle>{{ verifier.unit || verifier.nip }}</VListItemSubtitle>

                <template #append>
                  <IconBtn
                    :disabled="saving"
                    :aria-label="`Hapus ${verifier.nama} dari Tahap ${stage.stage}`"
                    @click="handleRemove(stage, verifier)"
                  >
                    <VIcon
                      icon="tabler-trash"
                      color="error"
                    />
                  </IconBtn>
                </template>
              </VListItem>
            </VList>

            <VBtn
              block
              variant="tonal"
              @click="openPicker(stage)"
            >
              <VIcon
                start
                icon="tabler-user-plus"
              />
              Tambah Verifikator
            </VBtn>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VerifierPickerDialog
      v-model:isDialogVisible="isPickerVisible"
      :stage="pickerStage"
    />
  </div>
</template>

<script setup>
import VerifierPickerDialog from '@/views/verification/verifier-picker-dialog.vue'
import Swal from 'sweetalert2'

const store = useVuex()
const router = useRouter()

const isPickerVisible = ref(false)
const pickerStageNo = ref(null)

const stages = computed(() => store.state.verification.stages)
const loading = computed(() => store.state.verification.loading.stages)
const saving = computed(() => store.state.verification.loading.action)

// Ambil dari store agar daftar "Sudah terdaftar" di dialog ikut ter-update
const pickerStage = computed(() => stages.value.find(s => s.stage === pickerStageNo.value) || null)

const capitalizeName = name => (name || '')
  .toLowerCase()
  .split(' ')
  .map(w => w.charAt(0).toUpperCase() + w.slice(1))
  .join(' ')

const openPicker = stage => {
  pickerStageNo.value = stage.stage
  isPickerVisible.value = true
}

const handleRemove = async (stage, verifier) => {
  const result = await Swal.fire({
    title: 'Hapus verifikator?',
    text: `${capitalizeName(verifier.nama)} tidak lagi memverifikasi surat di Tahap ${stage.stage}.`,
    icon: 'warning',
    showCancelButton: true,
    customClass: {
      confirmButton: 'bg-primary text-background',
      cancelButton: 'bg-danger text-background',
    },
    confirmButtonText: 'Ya, hapus',
    cancelButtonText: 'Batal',
  })

  if (result.isConfirmed)
    store.dispatch('verification/RemoveVerifier', { stage: stage.stage, nip: verifier.nip })
}

onMounted(() => {
  // Halaman ini khusus admin
  if (!isAdmin()) return router.replace('/')
  store.dispatch('verification/GetStages')
})
</script>
