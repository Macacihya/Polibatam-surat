<template>
  <VForm
    validate-on="submit lazy"
    @submit.prevent="handleSubmit"
  >
    <VCard
      :loading="loading"
      class="overflow-visible"
    >
      <div class="sticky-header bg-background border-b">
        <VCardText class="d-flex justify-space-between items-center">
          <div>
            <VCardTitle>
              Form Penerbitan Dokumen SK
            </VCardTitle>
            <VCardSubtitle>
              Pengajuan Surat Keputusan pada Politeknik Negeri Batam
            </VCardSubtitle>
          </div>
          <div class="d-flex flex-row-reverse gap-3">
            <VBtn
              type="submit"
              :loading="loading"
            >
              Terbitkan
            </VBtn>
            <VBtn
              variant="tonal"
              @click="handleClose"
            >
              Cancel
            </VBtn>
          </div>
        </VCardText>
      </div>

      <VCardText>
        <VRow>
          <VCol cols="12">
            <VFileInput
              v-model="filepath"
              show-size
              chips
              label="Dokumen"
              :rules="[requiredValidator]"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <AppDateTimePicker
              v-model="date"
              label="Tanggal Surat"
              :rules="[requiredValidator]"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <AppTextField
              v-model="code"
              label="No Surat"
              :rules="[requiredValidator]"
            />
          </VCol>
            
          <VCol
            cols="12"
            md="6"
          >
            <AppTextField
              v-model="title"
              label="Nama Surat"
              :rules="[requiredValidator]"
            />
          </VCol>
        </VRow>
      </VCardText>

      <VCardText>
        <VExpansionPanels
          v-model="panel"
          multiple
        >
          <AppExpansionPanel
            :title="`Pilih Pegawai (${users?.length})`"
            class="px-0"
          >
            <TableSelectUser v-model="users" />
          </AppExpansionPanel>
          
          <AppExpansionPanel
            :title="`Pilih Unit (${units?.length})`"
            class="px-0"
          >
            <TableSelectUnit v-model="units" />
          </AppExpansionPanel> 
         
          <AppExpansionPanel
            :title="`Pilih Group (${groups?.length})`"
            class="px-0"
          >
            <TableSelectGroup v-model="groups" />
          </AppExpansionPanel>
        </VExpansionPanels>
      </VCardText>
    </VCard>
  </VForm>
</template>

<script setup>
const store = useVuex()
const router = useRouter()
const route= useRoute()
const panel = ref()
const submission_id = ref(route.query.submission_id)

const handleClose = () => router.push('/submission')

const handleSubmit = async e => {
  const { valid } = await e

  if(valid && submission_id.value){
    store.dispatch('submission/Publish', submission_id.value).then(res => {
      if(res) handleClose()
    })
  }
}

const loading = computed(() => store.state.submission.loading.form)

const filepath = computed({
  get: () => store.state.submission.form.filepath,
  set: value => store.commit('submission/SET_FORM', {
    key: 'filepath',
    value,
  }),
})

const title = computed({
  get: () => store.state.submission.form.title,
  set: value => store.commit('submission/SET_FORM', {
    key: 'title',
    value,
  }),
})

const code = computed({
  get: () => store.state.submission.form.code,
  set: value => store.commit('submission/SET_FORM', {
    key: 'code',
    value,
  }),
})

const date = computed({
  get: () => store.state.submission.form.date,
  set: value => store.commit('submission/SET_FORM', {
    key: 'date',
    value,
  }),
})

const groups = computed({
  get: () => store.state.submission.form.groups,
  set: value => store.commit('submission/SET_FORM', {
    key: 'groups',
    value,
  }),
})

const users = computed({
  get: () => store.state.submission.form.users,
  set: value => store.commit('submission/SET_FORM', {
    key: 'users',
    value,
  }),
})

const units = computed({
  get: () => store.state.submission.form.units,
  set: value => store.commit('submission/SET_FORM', {
    key: 'units',
    value,
  }),
})

onMounted(() => {
  if(submission_id.value){
    store.dispatch('submission/SetFormUpdate', submission_id.value)
    store.dispatch('submission/GetReport', submission_id.value)
  } else {
    window.location.href = '/404'
  }
})
</script>

<style lang="scss" scoped>
.sticky-header {
  position: sticky;
  z-index: 9;
  inset-block-end: 0;
  inset-block-start: 125px;
  transition: all 0.3s ease-in-out;
}
</style>
