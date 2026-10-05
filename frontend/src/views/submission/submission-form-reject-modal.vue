<script setup>
const props = defineProps({
  isDialogVisible: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits([
  'update:isDialogVisible',
])

const store = useVuex()
const reject_remarks = ref("")
const is_update = computed(() => store.state.submission.is_update)

const handleUpdateStatus = async () => {
  store.dispatch("submission/UpdateStatus", { 
    id: is_update.value,
    status: "REJECTED",
    reject_remarks: reject_remarks.value,
  })

  emit('update:isDialogVisible', false)
}
</script>

<template>
  <VDialog
    max-width="600"
    :model-value="props.isDialogVisible"
    @update:model-value="(val) => $emit('update:isDialogVisible', val)"
  >
    <!-- Dialog close btn -->
    <DialogCloseBtn @click="$emit('update:isDialogVisible', false)" />

    <VCard class="px-2 py-5">
      <VCardText class="pt-3">
        <h6 class="text-lg font-weight-medium mb-2">
          Tolak Pengajuan SK
        </h6>

        <p class="mb-6">
          Masukkan alasan penolakan pengajuan SK. Catatan ini akan dikirimkan ke pemohon. 
        </p>

        <VForm @submit.prevent="() => {}">
          <AppTextarea
            v-model="reject_remarks"
            label="Catatan"
            class="mb-4"
          />

          <div class="d-flex justify-end flex-wrap gap-3">
            <VBtn
              color="secondary"
              variant="tonal"
              @click="$emit('update:isDialogVisible', false)"
            >
              Cancel
            </VBtn>

            <VBtn
              type="submit"
              @click="handleUpdateStatus"
            >
              Tolak
              <VIcon
                end
                icon="tabler-x"
                class="flip-in-rtl"
              />
            </VBtn>
          </div>
        </VForm>
      </VCardText>
    </VCard>
  </VDialog>
</template>
