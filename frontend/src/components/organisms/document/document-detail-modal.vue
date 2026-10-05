<template>
  <VDialog
    :model-value="props.isOpen"
    max-width="1200"
    @click:outside="handleClose"
  >
    <DialogCloseBtn @click="handleClose" />
  
  
    <PerfectScrollbar :options="{ wheelPropagation: false }">
      <VCard :loading="loading">
        <VCardTitle class="text-center my-3">
          Detail Dokumen | {{ report.name }}
        </VCardTitle>

        <VDivider />

        <VCardText>
          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <div
                v-for="(item, i) in [
                  { title: 'Tanggal', value: formatTanggal(report.date) },
                  { title: 'Keterangan', value: report.remarks },
                ]"
                :key="i"
              >
                <p class="text-h6 mb-2">
                  {{ item.title }}
                </p>
                <p class="text-body-1">
                  {{ item.value || "-" }}
                </p>
              </div>
              <div>
                <p class="text-h6 mb-2">
                  Dokumen
                </p>
                <div>
                  <a
                    :href="report?.filepath"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="d-flex gap-2 items-center text-body-1"
                  >
                    <VIcon icon="tabler-cloud-download" />
                    <span class="">Unduh Dokumen</span>
                  </a>
                </div>
              </div>
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <div
                v-for="(item, i) in [
                  { title: 'Dibuat Pada', value: formatCalendar(report.created_at) },
                ]"
                :key="i"
              >
                <p class="text-h6 mb-2">
                  {{ item.title }}
                </p>
                <p class="text-body-1">
                  {{ item.value || "-" }}
                </p>
              </div>
            </VCol>
          </VRow>
        </VCardText>

        <VTabs v-model="currentTab">
          <VTab>Pegawai</VTab>
          <VTab>Tag Group</VTab>
        </VTabs>
        <VCardText class="">
          <VWindow v-model="currentTab">
            <VWindowItem>
              <div class="d-flex align-center justify-end flex-wrap gap-4 mb-5">
                <div style="inline-size: 20rem;">
                  <AppTextField
                    v-model="search_user"
                    density="compact"
                    placeholder="Search ..."
                    append-inner-icon="tabler-search"
                  />
                </div>
              </div>
              <VDataTable
                :headers="[
                  { title: 'NIP', key: 'user.nip' },
                  { title: 'Nama', key: 'user.nama' },
                  { title: 'Staff', key: 'user.staff' },
                  { title: 'Unit', key: 'user.unit' },
                ]"
                :items="report.users"
                :search="search_user"
                :items-per-page="5"
                class="text-no-wrap"
              />
            </VWindowItem>
            <VWindowItem>
              <div class="d-flex align-center justify-end flex-wrap gap-4 mb-5">
                <div style="inline-size: 20rem;">
                  <AppTextField
                    v-model="search_group"
                    density="compact"
                    placeholder="Search ..."
                    append-inner-icon="tabler-search"
                  />
                </div>
              </div>
              <VDataTable
                :headers="[
                  { title: 'Name', key: 'group.name' },
                  { title: 'Created At', key: 'group.created_at' , value: (v) => formatCalendar(v.group.created_at) },
                ]"
                :items="report.groups"
                :search="search_group"
                :items-per-page="5"
                class="text-no-wrap"
              />
            </VWindowItem>
          </VWindow>
        </VCardText>
      </VCard>
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

const currentTab = ref('tab-1')

const handleClose = () => {
  emit('handleClose', false)
}

const search_user = ref('')
const search_group = ref('')

const loading = computed(() => store.state.document.loading.report)
const report = computed(() => store.state.document.report)
</script>
