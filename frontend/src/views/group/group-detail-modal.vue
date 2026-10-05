<template>
  <VDialog
    :model-value="props.isOpen"
    max-width="1200"
    @click:outside="handleClose"
  >
    <DialogCloseBtn @click="handleClose" />
  
  
    <PerfectScrollbar :options="{ wheelPropagation: false }">
      <VForm @submit.prevent="handleSubmit">
        <VCard>
          <VCardText class="mt-5">
            <div class="text-center">
              <h3 class="text-h3 mb-3">
                {{ report?.name }}
              </h3>
              <p
                class="text-body-1 mx-auto"
                style="max-inline-size: 50rem;"
              >
                <!-- eslint-disable-next-line vue/no-v-html -->
                <span v-html="report?.note" />
              </p>
              <p class="">
                Total Pegawai : <strong>{{ report?.users?.length }}</strong>, 
                Total Unit : <strong>{{ report?.units?.length }}</strong>
              </p>
            </div>
          </VCardText>
          <VCardText>
            <VExpansionPanels
              v-model="panel"
              multiple
            >
              <AppExpansionPanel :title="`Total Pegawai (${report.users?.length})`">
                <div class="d-flex align-center justify-end flex-wrap gap-4 mb-5">
                  <div style="inline-size: 20rem;">
                    <AppTextField
                      v-model="searchPegawai"
                      density="compact"
                      placeholder="Search ..."
                      append-inner-icon="tabler-search"
                    />
                  </div>
                </div>
                <VDivider />
                <VDataTable
                  :headers="[
                    { title: 'NIP', value: 'user.nip' },
                    { title: 'Nama', value: 'user.nama' },
                    { title: 'Staff', value: 'user.staff' },
                    { title: 'Unit', value: 'user.unit' },
                  ]"
                  :items="report.users"
                  :loading="loading"
                  :search="searchPegawai"
                  :items-per-page="5"
                />
              </AppExpansionPanel>
              <AppExpansionPanel :title="`Total Unit (${report.units?.length})`">
                <div class="d-flex align-center justify-end flex-wrap gap-4 mb-5">
                  <div style="inline-size: 20rem;">
                    <AppTextField
                      v-model="searchUnit"
                      density="compact"
                      placeholder="Search ..."
                      append-inner-icon="tabler-search"
                    />
                  </div>
                </div>
                <VDivider />
                <VDataTable
                  :headers="[
                    { title: 'Unit', value: 'unit_name' },
                  ]"
                  :items="report.units"
                  :loading="loading"
                  :search="searchUnit"
                  :items-per-page="5"
                />
              </AppExpansionPanel>
            </VExpansionPanels>
          </VCardText>
        </VCard>
      </VForm>
    </PerfectScrollbar>
  </VDialog>
</template>

<script setup>
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['handleClose'])
const store = useVuex()
const panel = ref()

const searchPegawai = ref("")
const searchUnit = ref("")

const handleClose = () => {
  panel.value = []
  emit('handleClose', false)
}

const loading = computed(() => store.state.group.loading.report)
const report = computed(() => store.state.group.report)
</script>
