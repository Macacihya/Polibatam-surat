<template>
  <VRow>
    <VCol
      cols="12"
      md="8"
      lg="9"
    >
      <VCard
        :loading="loading"
        class="overflow-visible"
      >
        <div class="sticky-header bg-background border-b">
          <VCardText>
            <VCardTitle class="text-center">
              {{ report?.type?.replace('_', " ") }} | {{ report?.code }}
            </VCardTitle>
            <VCardSubtitle class="text-center">
              {{ report?.name }}
            </VCardSubtitle>
          </VCardText>
        </div>

        <VCardText>
          <VRow>
            <VCol
              cols="12"
              md="6"
              lg="4"
            >
              <div
                v-for="(item, i) in [
                  { title: 'No', value: report?.code },
                  { title: 'Nama', value: report?.name },
                  { title: 'Tanggal', value: formatTanggal(report?.date) },
                  { title: 'Keterangan', value: report?.remarks },
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
            <VCol
              cols="12"
              md="6"
              lg="4"
            >
              <div
                v-for="(item, i) in [
                  { title: 'Dispublish Pada', value: formatCalendar(report?.created_at) },
                  { title: 'Terakhir Diubah Pada', value: formatCalendar(report?.updated_at) },
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
              <!--
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
                <VIcon
                icon="tabler-link"
                size="18"
                />
                <span class="">
                {{ report?.filepath?.split('/').pop() }}
                </span>
                </a>
                </div>
                </div> 
              -->
            </VCol>

            <VCol
              v-if="report?.submission_id"
              cols="12"
              md="6"
              lg="4"
            >
              <div class="mb-3">
                <p class="text-h6 mb-2">
                  Pengajuan SK
                </p>
                <p class="text-body-1">
                  <RouterLink :to="'/submission/' + report?.submission_id">
                    #{{ report?.submission_id?.toUpperCase() }}
                  </RouterLink>
                </p>
              </div>
              <div class="mb-3">
                <p class="text-h6 mb-2">
                  Pengajuan SK diajukan pada
                </p>
                <p class="text-body-1">
                  {{ formatCalendar(report?.submission?.created_at) }}
                </p>
              </div>
            </VCol>
          </VRow>
        </VCardText>

        <VCardText>
          <div class="d-flex justify-end gap-10 flex-wrap">
            <div>
              <p class="text-overline mb-0">
                Dipublish Oleh
              </p>
              <CardUser :user="report?.creator" />
            </div>
            <div v-if="report?.modifier">
              <p class="text-overline mb-0">
                Terakhir Diubah Oleh
              </p>
              <CardUser :user="report?.modifier" />
            </div>
          </div>
        </VCardText>

        <VTabs v-model="currentTab">
          <VTab>Semua Pegawai</VTab>
          <VTab>Pegawai</VTab>
          <VTab>Unit</VTab>
          <VTab>Tag Group</VTab>
        </VTabs>
        <VCardText class="">
          <VWindow v-model="currentTab">
            <VWindowItem>
              <div class="d-flex align-center justify-end flex-wrap gap-4 mb-5">
                <div style="inline-size: 20rem;">
                  <AppTextField
                    v-model="search"
                    density="compact"
                    placeholder="Search ..."
                    append-inner-icon="tabler-search"
                  />
                </div>
              </div>
              <VDataTable
                :headers="[
                  { title: 'NIP', key: 'nip' },
                  { title: 'Nama', key: 'nama' },
                  { title: 'Staff', key: 'staff' },
                  { title: 'Unit', key: 'unit' },
                ]"
                :items="report?.unique_users"
                :search="search"
                :items-per-page="5"
                class="text-no-wrap"
              />
            </VWindowItem>
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
                :items="report?.users"
                :search="search_user"
                :items-per-page="5"
                class="text-no-wrap"
              />
            </VWindowItem>
            <VWindowItem>
              <div class="d-flex align-center justify-end flex-wrap gap-4 mb-5">
                <div style="inline-size: 20rem;">
                  <AppTextField
                    v-model="search_unit"
                    density="compact"
                    placeholder="Search ..."
                    append-inner-icon="tabler-search"
                  />
                </div>
              </div>
              <VDataTable
                :headers="[
                  { title: 'Unit', key: 'unit.name' },
                ]"
                :items="report?.units"
                :search="search_unit"
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
                :items="report?.groups"
                :search="search_group"
                :items-per-page="5"
                class="text-no-wrap"
              />
            </VWindowItem>
          </VWindow>
        </VCardText>
      </VCard>
    </VCol>

    <VCol
      cols="12"
      md="4"
      lg="3"
    >
      <div class="sticky-sidebar">
        <VCard
          :loading="loading"
          :title="report?.type === 'SURAT_KEPUTUSAN' ? 'Surat Keputusan' : 'Surat Tugas'"
          subtitle="Detail Dokumen"
        >
          <template #prepend>
            <VAvatar
              variant="tonal"
              :color="report?.type === 'SURAT_KEPUTUSAN' ? 'warning' : 'primary'"
              rounded
            >
              <VIcon
                icon="tabler-notes"
                size="28"
              />
            </VAvatar>
          </template>
        </VCard>
        <br>
        <div class="d-flex flex-md-column-reverse gap-5 justify-end">
          <VBtn
            class="w-full"
            variant="tonal"
            @click="router.push(report?.type === 'SURAT_KEPUTUSAN' ? '/surat-keputusan' : '/surat-tugas')"
          >
            <VIcon
              icon="tabler-arrow-left"
              start
            />

            Kembali
          </VBtn>
          <VBtn
            class="w-full"
            :href="report?.filepath"
            target="_blank"
            rel="noopener noreferrer"
          >
            <VIcon
              icon="tabler-cloud-download"
              start
            />

            Download
          </VBtn>
        </div>
      </div>
    </VCol>
  </VRow>
</template>

<script setup>
const router = useRouter()
const route = useRoute()
const store = useVuex()

const document_id = ref(route.params.id)

const currentTab = ref('')
const search = ref('')
const search_user = ref('')
const search_unit = ref('')
const search_group = ref('')

const loading = computed(() => store.state.document.loading.report)
const report = computed(() => store.state.document.report)


onMounted(() => {
  // if (document_id.value) return router.push('/404')

  store.dispatch('document/GetReport', document_id.value).then(res => {
    if(!res) router.push('/404')
  })
})
</script>

<style lang="scss" scoped>
.sticky-header {
  position: sticky;
  z-index: 9;
  inset-block-end: 0;
  inset-block-start: 7.8rem;
  transition: all 0.3s ease-in-out;
}

.sticky-sidebar {
  position: sticky;
  z-index: 9;
  inset-block-end: 0;
  inset-block-start: 9rem;
  transition: all 0.3s ease-in-out;
}

@media screen and (max-width: 1264px) {
  .sticky-header {
    inset-block-start: 5rem !important;
  }

  .sticky-sidebar {
    inset-block-start: 6rem !important;
  }
}
</style>
