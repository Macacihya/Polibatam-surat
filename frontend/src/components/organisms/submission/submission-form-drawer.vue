<template>
  <VNavigationDrawer
    temporary
    location="end"
    class="scrollable-content w-100"
    style="max-width: 800px;"
    :model-value="props.isOpen"
    @update:model-value="handleClose"
    @click:outside="handleClose"
  >
    <AppDrawerHeaderSection
      title="Form Pengajuan SK"
      @cancel="handleClose"
    />

    <VCard
      class="border-0"
      style="overflow-y: scroll;"
      :loading="loading"
    >
      <VForm
        validate-on="submit lazy"
        @submit.prevent="handleSubmit"
      >
        <VCardText>
          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <AppTextField
                v-model="title"
                label="Judul Surat Keputusan/Peraturan*"
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
              <AppTextField
                v-model="filepath_attachment"
                label="Lampiran"
                :rules="[requiredValidator]"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <AppDateTimePicker
                v-model="pickup_plan"
                label="Rencana Pengambilan*"
                :rules="[requiredValidator]"
              />
            </VCol>
          </VRow>

          <section class="border-s-md ps-5 mt-10">
            <VRow
              v-for="(item, i) in list_consider"
              :key="i"
              align="end"
            >
              <VCol cols="11">
                <AppTextField
                  v-model="list_consider[i]"
                  placeholder="......."
                  :label="`${i + 1} . Pertimbangan*`"
                  :prefix="`${i + 1} .`"
                  :rules="[requiredValidator]"
                />
              </VCol>
              <VCol
                v-if="list_consider.length > 1"
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

              Tambah Pertimbangan
            </VBtn>
          </section>

          <section class="border-s-md ps-5 mt-10">
            <VRow
              v-for="(item, i) in list_observe"
              :key="i"
              align="end"
            >
              <VCol cols="11">
                <AppTextField
                  v-model="list_observe[i]"
                  placeholder="......."
                  :label="`${i + 1} . Pengamatan*`"
                  :prefix="`${i + 1} .`"
                  :rules="[requiredValidator]"
                />
              </VCol>
              <VCol
                v-if="list_observe.length > 1"
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

              Tambah Pengamatan
            </VBtn>
          </section>

          <section class="border-s-md ps-5 mt-10">
            <VRow
              v-for="(item, i) in list_decide"
              :key="i"
              align="end"
            >
              <VCol cols="11">
                <AppTextField
                  v-model="list_decide[i]"
                  placeholder="......."
                  :label="`${i + 1} . Keputusan*`"
                  :prefix="`${i + 1} .`"
                  :rules="[requiredValidator]"
                />
              </VCol>
              <VCol
                v-if="list_decide.length > 1"
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

              Tambah Keputusan
            </VBtn>
          </section>

          <br>
          <div class="d-flex flex-row-reverse gap-3">
            <VBtn
              type="submit"
              :loading="loading"
            >
              Submit
            </VBtn>
            <VBtn
              variant="tonal"
              @click="handleClose"
            >
              Cancel
            </VBtn>
          </div>
        </VCardText>
      </VForm>
    </VCard>
  </VNavigationDrawer>
</template>

<script setup>
const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['handleClose'])

const store = useVuex()

const handleClose = val => {
  store.commit('submission/RESET_FORM')
  store.commit('submission/SET_IS_UPDATE', false)
  
  emit('handleClose', val)
}

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

const handleSubmit = async e => {
  const { valid } = await e

  if(valid){
    if(is_update.value){
      store.dispatch('UpdateDocument', is_update.value).then(res => {
        if(res) handleClose()
      })
    }else{
      store.dispatch('CreateDocument').then(res => {
        if(res) handleClose()
      })
    }
  }
}

const loading = computed(() => store.state.submission.loading.form)
const is_update = computed(() => store.state.submission.is_update)

const title = computed({
  get: () => store.state.submission.form.title,
  set: value => store.commit('submission/SET_FORM', {
    key: 'title',
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

const users = computed({
  get: () => store.state.submission.form.users,
  set: value => store.commit('submission/SET_FORM', {
    key: 'users',
    value,
  }),
})
</script>
