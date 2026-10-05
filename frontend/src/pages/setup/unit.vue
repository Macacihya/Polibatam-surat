<template>
  <div>
    <VCard
      title="Units"
      subtitle="List Units Politeknik Negeri Batam"
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
              Generate Unit
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
        />
      </VCardText>
    </VCard>
  </div>
</template>

<script setup>
const store = useVuex()

const headers = ref([
  { sortable: false, title: "Unit", value: "name" },
])

const onGenerate = () => {
  store.dispatch('unit/Generate')
}

const loading = computed(() => store.state.unit.loading.reports)
const is_generate = computed(() => store.state.unit.loading.generate)

const reports = computed(() => store.state.unit.reports)

const table_options = computed({
  get: () => store.state.unit.table_options,
  set: value => store.commit('unit/SET_OPTIONS_TABLE', value),
})

const refetch = () => store.dispatch('unit/GetReports')

onMounted(() => refetch())
</script>
