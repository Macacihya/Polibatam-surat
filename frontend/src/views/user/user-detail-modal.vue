<template>
  <VDialog
    :model-value="props.isOpen"
    max-width="800"
  >
    <DialogCloseBtn @click="handleClose" />
  
  
    <VCard :loading="loading">
      <VCardText>
        <VCardItem class="text-center py-2">
          <VCardTitle class="text-h3">
            Detail Pegawai
          </VCardTitle>
          <p class="mb-0">
            Lihat detail pegawai
          </p>
        </VCardItem>

        <VDivider class="my-4" />

        <table class="table table-striped">
          <tr
            v-for="(item, i) in report"
            :key="i"
            class=""
          >
            <td style="min-width: 200px">
              {{ item.key }}
            </td>
            <td style="min-width: 20px">
              :
            </td>
            <td>{{ item.value }}</td>
          </tr>
        </table>
      </VCardText>
    </VCard>
  </VDialog>
</template>

<script setup>
import { useStore } from 'vuex'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['handleClose'])

const store = useStore()

const handleClose = () => {
  emit('handleClose', false)
}

const loading = computed(() => store.state.user.loading.report)
const report = computed(() => store.state.user.report)
</script>
