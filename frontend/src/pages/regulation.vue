<template>
  <div>
    <VCard
      title="Regulation"
      subtitle="List Regulation Republik Indonesia"
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
              v-if="is_admin"
              @click="handleFormImportModal(true)"
            >
              <VIcon
                icon="tabler-file-plus"
                start
              />
              Import Regulation
            </VBtn>
          </div>
          <div>
            <VBtn
              v-if="is_admin"
              @click="handleFormDrawer(true)"
            >
              <VIcon
                icon="tabler-user-plus"
                start
              />
              Add Regulation
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
        >
          <template #item.actions="{ item }">
            <div class="d-flex justify-end align-center">
              <MoreBtn
                v-if="is_admin"
                :menu-list="computedMoreList(item)"
                item-props
                color="undefined"
              />
            </div>
          </template>
        </VDataTableServer>
      </VCardText>
    </VCard>
  </div>

  <FormDrawer
    :open="formDrawer"
    @handle-close="handleFormDrawer"
  />

  <FormImportModal
    :open="formImportModal"
    @handle-close="handleFormImportModal"
  />
</template>

<script setup>
import FormDrawer from '@/views/regulation/regulation-form-drawer.vue'
import FormImportModal from '@/views/regulation/regulation-form-import-modal.vue'

const headers = ref([
  { title: "Regulation", value: "title" },
  { title: "Action", value: "actions", align: "end", sortable: false },
])

const computedMoreList = computed(() => {
  return item => [
    {
      title: 'Edit',
      prependIcon: 'tabler-pencil',
      onClick: () => onUpdate(item.id),
    },
    {
      title: 'Delete',
      prependIcon: 'tabler-trash',
      onClick: () => onDelete(item.id),
      color: 'error',
    },
  ].filter(item => {
    if(item.hidden) return !item.hidden
    
    return true
  })
})

const store = useVuex()
const formDrawer = ref(false)
const formImportModal = ref(false)

const handleFormDrawer = value => formDrawer.value = value
const handleFormImportModal = value => formImportModal.value = value

const onUpdate = id => {
  store.dispatch('regulation/SetFormUpdate', id)
  handleFormDrawer(true)
}

const onDelete = async id => {
  const confirm = await SwalDelete()

  if(confirm) store.dispatch('regulation/Delete', id)

}

const is_admin = computed(() => store.state.app.user.is_admin)
const loading = computed(() => store.state.regulation.loading.reports)
const reports = computed(() => store.state.regulation.reports)

const table_options = computed({
  get: () => store.state.regulation.table_options,
  set: value => store.commit('regulation/SET_OPTIONS_TABLE', value),
})

const refetch = () => store.dispatch('regulation/GetReports')

onMounted(() => refetch())
</script>
