<template>
  <div>
    <VCard
      title="Tag Groups"
      subtitle="List tag groups Politeknik Negeri Batam"
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
            />
          </div>

          <VBtn
            v-if="isAdmin()"
            to="/setup/group/form"
          >
            <VIcon
              start
              icon="tabler-plus"
            />
            <span class="">
              Tambah
            </span>
          </VBtn>
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
          <template #[`item.note`]="{ item }">
            <!-- eslint-disable-next-line vue/no-v-html -->
            <span v-html="item.note?.length > 50 ? item.note.slice(0, 50) + '...' : item.note" />
          </template>
          
          <template #[`item.created_at`]="{ item }">
            {{ formatCalendar(item.created_at) }}
          </template>

          <!-- Actions -->
          <template #item.actions="{ item }">
            <div class="d-flex justify-end align-center">
              <IconBtn @click="handleModalDetail(item.id)">
                <VIcon icon="tabler-eye" />
              </IconBtn>
              
              <MoreBtn
                :menu-list="computedMoreList(item)"
                item-props
                color="undefined"
              />
            </div>
          </template>
        </VDataTableServer>
      </VCardText>
    </VCard>

    <GroupDetailModal
      :is-open="modalDetail"
      @handle-close="handleModalDetail"
    />
  </div>
</template>

<script setup>
import GroupDetailModal from '@/views/group/group-detail-modal.vue'

const store = useVuex()

const modalDetail = ref(false)

const headers = ref([
  { sortable: false, title: "Name", value: "name" },
  { sortable: false, title: "Note", value: "note" },
  { sortable: false, title: "Created At", value: "created_at" },
  { sortable: false, title: "Aksi", value: "actions", align: "end", sortable: false },
])

const computedMoreList = computed(() => {
  return item => [
    {
      title: 'Detail Group',
      prependIcon: 'tabler-eye',
      onClick: () => handleModalDetail(item.id),
    },
    {
      title: 'Edit Group',
      prependIcon: 'tabler-pencil',
      to: `/setup/group/form?group_id=${item.id}`,
      hidden: !isAdmin(),
    },
    {
      title: 'Delete Group',
      prependIcon: 'tabler-trash',
      onClick: () => handleDelete(item.id),
      hidden: !isAdmin(),
    },
  ].filter(item => {
    if(item.hidden) return !item.hidden
    
    return true
  })
})

const handleModalDetail = value => {
  if(value) store.dispatch("group/GetReport", value)
  modalDetail.value = value
}

const handleDelete = async value => {
  const confirm = await SwalDelete()

  if(confirm) {
    store.dispatch("group/Delete", value)
  }
}

const loading = computed(() => store.state.group.loading.reports)
const reports = computed(() => store.state.group.reports)

const table_options = computed({
  get: () => store.state.document.table_options,
  set: value => store.commit('document/SET_OPTIONS_TABLE', value),
})

const refetch = () => store.dispatch('group/GetReports')

onMounted(() => refetch())
</script>
