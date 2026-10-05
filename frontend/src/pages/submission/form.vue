<template>
  <VForm
    ref="ref_form"
    validate-on="submit lazy"
    @submit.prevent="() => {}"
  >
    <VCard
      :loading="loading"
      class="overflow-visible"
      flat
    >
      <div class="sticky-header bg-background border-b">
        <VCardText class="d-flex justify-space-between items-center">
          <div>
            <VCardTitle>
              Form Pengajuan SK
            </VCardTitle>
            <VCardSubtitle>
              Pengajuan Surat Menetapkan pada Politeknik Negeri Batam
            </VCardSubtitle>
          </div>
          <div class="d-flex flex-row-reverse gap-3">
            <VBtn
              :loading="loading"
              @click="onPosted"
            >
              <VIcon
                icon="tabler-send"
                start
              />           
              Ajukan
            </VBtn>
            <VBtn
              type="submit"
              :loading="loading"
              @click="handleSubmit"
            >
              <VIcon
                icon="tabler-device-floppy"
                start
              />           
              {{ submission_id ? 'Edit Pengajuan' : 'Simpan Sebagai Draft' }}
            </VBtn>
            <VBtn
              variant="tonal"
              @click="handleClose"
            >
              <VIcon
                icon="tabler-x"
                start
              />

              Kembali
            </VBtn>
          </div>
        </VCardText>
      </div>

      <VCardText>
        <VRow>
          <VCol
            cols="12"
            md="6"
          >
            <AppTextField
              v-model="title"
              label="Judul Surat Menetapkan/Peraturan*"
              :rules="[requiredValidator]"
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <AppSelect
              v-model="type"
              label="Jenis Surat*"
              :items="['SK Honor', 'SK Non-Honor', 'Perdir']"
              :rules="[requiredValidator]"
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <AppDateTimePicker
              v-model="pickup_plan"
              label="Tanggal Terbit SK*"
              :rules="[requiredValidator]"
            />
          </VCol>
          <VCol cols="12">
            <VSwitch
              v-model="is_attachment"
              :label="`Apakah ada lampiran? (${is_attachment ? 'Ya' : 'Tidak'})`"
              messages="Upload lampiran jika ada"
            />
          </VCol>
          <VCol
            v-if="is_attachment"
            cols="12"
            md="6"
          >
            <VFileInput
              v-if="submission_id"
              v-model="filepath_attachment"
              label="Lampiran"
              messages="Upload lampiran jika ingin mengganti"
            />
            <VFileInput
              v-else
              v-model="filepath_attachment"
              label="Lampiran"
              :rules="[requiredValidator]"
            />
          </VCol>
        </VRow>

        <section class="border-s-md ps-5 mt-10">
          <VRow
            v-for="(item, i) in list_consider"
            :key="i"
          >
            <VCol cols="11">
              <VTextarea
                v-model="list_consider[i]"
                rows="2"
                placeholder="......."
                :label="`${i + 1} . Menimbang*`"
                :prefix="`${i + 1} .`"
                :rules="[requiredValidator]"
              />
            </VCol>
            <VCol
              v-if="list_consider?.length > 1"
              cols="1"
            >
              <div class="d-flex">
                <IconBtn
                  icon="tabler-trash"
                  color="error"
                  @click="handleSlice('consider', i)"
                />
              </div>
            </VCol>
          </VRow>
             
          <VBtn
            class="mt-5"
            variant="tonal"
            size="small"
            @click="handleAdd('consider')"
          >
            <VIcon
              start
              icon="tabler-plus"
            />

            Tambah Menimbang
          </VBtn>
        </section>

        <section class="border-s-md ps-5 mt-10">
          <VRow
            v-for="(item, i) in list_observe"
            :key="i"
          >
            <VCol cols="11">
              <VCombobox
                v-model="list_observe[i]"
                :items="regulations"
                item-text="title"
                placeholder="......."
                :label="`${i + 1} . Mengingat*`"
                :prefix="`${i + 1} .`"
                :rules="[requiredValidator]"
                :return-object="false"
                @update:model-value="refetchRegulation"
              />
            </VCol>
            <VCol
              v-if="list_observe?.length > 1"
              cols="1"
            >
              <div class="d-flex">
                <IconBtn
                  icon="tabler-trash"
                  color="error"
                  @click="handleSlice('observe', i)"
                />
              </div>
            </VCol>
          </VRow>
             
          <VBtn
            class="mt-5"
            variant="tonal"
            size="small"
            @click="handleAdd('observe')"
          >
            <VIcon
              start
              icon="tabler-plus"
            />

            Tambah Mengingat
          </VBtn>
        </section>

        <section class="border-s-md ps-5 mt-10">
          <VRow
            v-for="(item, i) in list_decide"
            :key="i"
          >
            <VCol cols="11">
              <VTextarea
                v-model="list_decide[i]"
                rows="2"
                placeholder="......."
                :label="`${i + 1} . Menetapkan*`"
                :prefix="`${i + 1} .`"
                :rules="[requiredValidator]"
              />
            </VCol>
            <VCol
              v-if="list_decide?.length > 1"
              cols="1"
            >
              <div class="d-flex">
                <IconBtn
                  icon="tabler-trash"
                  color="error"
                  @click="handleSlice('decide', i)"
                />
              </div>
            </VCol>
          </VRow>
             
          <VBtn
            class="mt-5"
            variant="tonal"
            size="small"
            @click="handleAdd('decide')"
          >
            <VIcon
              start
              icon="tabler-plus"
            />

            Tambah Menetapkan
          </VBtn>
        </section>

        <br>
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

const ref_form = ref()
const submission_id = ref(route.query.submission_id)
const panel = ref()


const handleClose = () => router.push('/submission')

const handleAdd = params => {
  switch (params) {
  case "consider":
    list_consider.value.push("")
    break
  case "observe":
    list_observe.value.push("")
    break
  case "decide":
    list_decide.value.push("")
    break
  default:
    break
  }
}

const handleSlice = (params, index) => {
  switch (params) {
  case "consider":
    list_consider.value.splice(index, 1)
    break
  case "observe":
    list_observe.value.splice(index, 1)
    break
  case "decide":
    list_decide.value.splice(index, 1)
    break
  default:
    break
  }
}

const onPosted = async () => {
  const { valid } = await ref_form.value.validate()

  if(valid){
    store.commit('submission/SET_FORM', {
      key: 'status',
      value: 'POSTED',
    })

    handleSubmit()
  }
}

const handleSubmit = async () => {
  const { valid } = await ref_form.value.validate()
  
  if(valid){
    if(submission_id.value){
      store.dispatch('submission/Update', submission_id.value).then(res => {
        if(res) handleClose()
      })
    }else{
      store.dispatch('submission/Create').then(res => {
        if(res) handleClose()
      })
    }
  }
}

const loading = computed(() => store.state.submission.loading.form)

const title = computed({
  get: () => store.state.submission.form.title,
  set: value => store.commit('submission/SET_FORM', {
    key: 'title',
    value,
  }),
})

const status = computed({
  get: () => store.state.submission.form.status,
  set: value => store.commit('submission/SET_FORM', {
    key: 'status',
    value,
  }),
})

const type = computed({
  get: () => store.state.submission.form.type,
  set: value => store.commit('submission/SET_FORM', {
    key: 'type',
    value,
  }),
})

const is_attachment = computed({
  get: () => store.state.submission.form.is_attachment,
  set: value => store.commit('submission/SET_FORM', {
    key: 'is_attachment',
    value,
  }),
})

const filepath_attachment = computed({
  get: () => store.state.submission.form.filepath_attachment,
  set: value => store.commit('submission/SET_FORM', {
    key: 'filepath_attachment',
    value,
  }),
})

const pickup_plan = computed({
  get: () => store.state.submission.form.pickup_plan,
  set: value => store.commit('submission/SET_FORM', {
    key: 'pickup_plan',
    value,
  }),
})

const list_consider = computed({
  get: () => store.state.submission.form.list_consider,
  set: value => store.commit('submission/SET_FORM', {
    key: 'list_consider',
    value,
  }),
})

const list_observe = computed({
  get: () => store.state.submission.form.list_observe,
  set: value => store.commit('submission/SET_FORM', {
    key: 'list_observe',
    value,
  }),
})

const list_decide = computed({
  get: () => store.state.submission.form.list_decide,
  set: value => store.commit('submission/SET_FORM', {
    key: 'list_decide',
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

const units = computed({
  get: () => store.state.submission.form.units,
  set: value => store.commit('submission/SET_FORM', {
    key: 'units',
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

const searchRegulation = ref('')
const regulations = computed(() => store.state.regulation.reports)

const refetchRegulation = () => store.dispatch('regulation/GetReports', {
  search: searchRegulation.value,
})

onMounted(() => {
  if(submission_id.value){
    store.dispatch('submission/SetFormUpdate', submission_id.value)
  }

  refetchRegulation()
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
