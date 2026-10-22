<script setup>
const props = defineProps({
  isDialogVisible: { type: Boolean, required: true },
  mode: { type: String, default: 'approve' }, // 'approve' | 'reject'
  submission: { type: Object, default: null },
})

const emit = defineEmits(['update:isDialogVisible'])

const store = useVuex()
const remarks = ref('')
const loading = computed(() => store.state.verification.loading.action)
const isReject = computed(() => props.mode === 'reject')

// Alasan wajib saat menolak, opsional saat menyetujui
const remarksRules = computed(() => isReject.value
  ? [v => !!v?.trim() || 'Alasan penolakan wajib diisi']
  : [])

const formRef = ref(null)

watch(() => props.isDialogVisible, visible => {
  if (visible) remarks.value = ''
})

const handleSubmit = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  const done = await store.dispatch('verification/Decide', {
    id: props.submission.id,
    decision: props.mode,
    remarks: remarks.value.trim(),
  })

  if (done) emit('update:isDialogVisible', false)
}
</script>

<template>
  <VDialog
    max-width="560"
    :model-value="props.isDialogVisible"
    @update:model-value="val => emit('update:isDialogVisible', val)"
  >
    <DialogCloseBtn @click="emit('update:isDialogVisible', false)" />

    <VCard class="px-2 py-5">
      <VCardText class="pt-3">
        <h6 class="text-lg font-weight-medium mb-2">
          {{ isReject ? 'Tolak Surat' : 'Setujui Surat' }}
        </h6>

        <p class="mb-1 text-medium-emphasis">
          {{ submission?.title }}
        </p>
        <p class="mb-5">
          <template v-if="isReject">
            Surat akan dikembalikan ke pemohon beserta catatan di bawah.
          </template>
          <template v-else>
            Surat akan diteruskan ke tahap berikutnya (atau selesai jika ini tahap terakhir).
          </template>
        </p>

        <VForm
          ref="formRef"
          validate-on="submit lazy"
          @submit.prevent="handleSubmit"
        >
          <AppTextarea
            v-model="remarks"
            :label="isReject ? 'Alasan penolakan' : 'Catatan (opsional)'"
            :rules="remarksRules"
            class="mb-4"
          />

          <div class="d-flex justify-end flex-wrap gap-3">
            <VBtn
              color="secondary"
              variant="tonal"
              @click="emit('update:isDialogVisible', false)"
            >
              Batal
            </VBtn>

            <VBtn
              type="submit"
              :color="isReject ? 'error' : 'success'"
              :loading="loading"
            >
              {{ isReject ? 'Tolak' : 'Setujui' }}
              <VIcon
                end
                :icon="isReject ? 'tabler-x' : 'tabler-check'"
              />
            </VBtn>
          </div>
        </VForm>
      </VCardText>
    </VCard>
  </VDialog>
</template>
