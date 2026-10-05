<template>
  <div>
    <VCard flat>
      <!--
        <VCardTitle class="my-2">
        <span class="font-weight-regular text-h6">Select User</span>
        </VCardTitle>

        <VDivider /> 
      -->

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
        </div>
      </VCardText>

      <VDivider />

      <VCardText class="px-0 pt-0">
        <VDataTableServer
          v-model="selected"
          v-model:options="table_options"
          v-model:items-per-page="table_options.page_size"
          v-model:page="table_options.page"
          :items-length="table_options.total_items"
          :search="table_options.search"
          :headers="headers"
          :items="reports"
          :loading="loading"
          show-select
          class="text-no-wrap"
          @update:options="refetch"
        />
      </VCardText>
    </VCard>
  </div>
</template>


<script setup>
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => ([]),
  },
})

const emit = defineEmits(['update:modelValue'])

const headers = ref([
  { title: "NIP", value: "nip" },
  { title: "Nama", value: "nama" },
  { title: "Staff", value: "staff" },
  { title: "Unit", value: "unit" },
])

const store = useVuex()

const selected = ref([])

watch(() => props.modelValue, newValue => {
  selected.value = newValue
})

watch(() => selected.value, value => {
  emit('update:modelValue', value)
})

const refetch = () => store.dispatch('user/GetReports')

onMounted(() => refetch())

const table_options = computed({
  get: () => store.state.user.table_options,
  set: value => store.commit('user/SET_OPTIONS_TABLE', value),
})

const loading = computed(() => store.state.user.loading.reports)
const reports = computed(() => store.state.user.reports)
</script>
