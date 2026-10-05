<template>
  <VForm
    validate-on="submit lazy"
    style="max-width: 1600px;"
    class="mx-auto"
    @submit.prevent="handleSubmit"
  >
    <div class="d-flex flex-wrap justify-start justify-sm-space-between gap-y-4 gap-x-6 bg-background sticky-header py-5">
      <div class="d-flex flex-column justify-center">
        <h4 class="text-h4 font-weight-medium">
          {{ groupId ? 'Edit' : 'Tambah' }} Group
          {{ groupId ? `${name}` : '' }}
        </h4>
        <span>
          Please fill the form below to {{ groupId ? 'edit' : 'Tambah' }} group
        </span>
      </div>

      <div class="d-flex gap-4 align-center flex-wrap">
        <VBtn
          variant="tonal"
          color="secondary"
          @click="handleBack"
        >
          <VIcon
            icon="tabler-chevron-left"
            start
          />
          Back
        </VBtn>

        <VBtn
          type="submit"
          :loading="loading"
        >
          {{ groupId ? 'Edit' : 'Add' }} Group
        </VBtn>
      </div>
    </div>

    <VDivider class="mt-3 mb-10" />

    <VRow>
      <VCol cols="12">
        <AppTextField
          v-model="name"
          label="Name"
          :rules="[requiredValidator]"
        />
      </VCol>
      <VCol cols="12">
        <p class="text-body-2 mb-2">
          Description
        </p>
        <TiptapEditor
          v-model="note"
          class="border rounded"
        />
      </VCol>

      <VCol cols="12">
        <VExpansionPanels
          v-model="panel"
          multiple
        >
          <AppExpansionPanel :title="`Pilih Pegawai (${users.length})`">
            <TableSelectUser v-model="users" />
          </AppExpansionPanel>
          <AppExpansionPanel :title="`Pilih Unit (${units.length})`">
            <TableSelectUnit v-model="units" />
          </AppExpansionPanel>
        </VExpansionPanels>
      </VCol>
    </VRow>
  </VForm>
</template>

<script setup>
const store = useVuex()
const route = useRoute()
const router = useRouter()

const groupId = ref(route.query.group_id)

const panel = ref(0)

const handleBack = () => {
  store.commit("group/RESET_FORM")
  
  router.push('/setup/group')
}

const handleSubmit = async e => {
  const { valid } = await e

  if(valid){
    if(is_update.value){ 
      store.dispatch('group/Update', is_update.value).then(res => {
        if(res) handleBack()
      })
    }else{
      store.dispatch('group/Create').then(res => {
        if(res) handleBack()
      })
    }
  }
}

onMounted(() => {
  if(groupId.value){
    store.dispatch('group/SetFormUpdate', groupId.value)
  }
})


const loading = computed(() => store.state.group.loading.form)
const is_update = computed(() => store.state.group.is_update)

const name = computed({
  get: () => store.state.group.form.name,
  set: value => store.commit('group/SET_FORM', {
    key: 'name',
    value,
  }),
})

const note = computed({
  get: () => store.state.group.form.note,
  set: value => store.commit('group/SET_FORM', {
    key: 'note',
    value,
  }),
})

const users = computed({
  get: () => store.state.group.form.users,
  set: value => store.commit('group/SET_FORM', {
    key: 'users',
    value,
  }),
})

const units = computed({
  get: () => store.state.group.form.units,
  set: value => store.commit('group/SET_FORM', {
    key: 'units',
    value,
  }),
})
</script>
