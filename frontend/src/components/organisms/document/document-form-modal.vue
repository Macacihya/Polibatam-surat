<template>
  <VDialog
    :model-value="props.isOpen"
    max-width="1200"
    persistent
  >
    <DialogCloseBtn @click="handleClose" />
  
  
    <PerfectScrollbar :options="{ wheelPropagation: false }">
      <VForm @submit.prevent="handleSubmit">
        <VCard :loading="loading">
          <VCardTitle class="text-center my-3">
            Form Surat Keputusan
          </VCardTitle>

          <VDivider />

          <VCardText>
            <VRow>
              <VCol cols="12">
                <VFileInput
                  v-if="!is_update"
                  v-model="filepath"
                  show-size
                  chips
                  label="Dokumen"
                  :rules="[requiredValidator]"
                />

                <VFileInput
                  v-else
                  v-model="filepath"
                  show-size
                  chips
                  label="Dokumen"
                  hint="Kosongkan jika tidak ingin mengganti dokumen"
                  messages="Kosongkan jika tidak ingin mengganti dokumen"
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
                  v-model="name"
                  label="Nama Surat"
                  :rules="[requiredValidator]"
                />
              </VCol>
            </VRow>
          </VCardText>

          <VTabs v-model="currentTab">
            <VTab value="pegawai">
              Pegawai
            </VTab>
            <VTab value="unit">
              Unit
            </VTab>
            <VTab value="group">
              Tag Group
            </VTab>
          </VTabs>
          <VCardText class="">
            <VWindow v-model="currentTab">
              <VWindowItem value="pegawai">
                <TableSelectUser v-model="users" />
              </VWindowItem>
              <VWindowItem value="unit">
                <TableSelectUnit v-model="units" />
              </VWindowItem>
              <VWindowItem value="group">
                <TableSelectGroup v-model="groups" />
              </VWindowItem>
            </VWindow>
          </VCardText>

          <VDivider />
          <VCardText class="d-flex justify-end gap-5">
            <VBtn
              color="error"
              variant="tonal"
              :loading="loading"
              @click="handleClose"
            >
              <VIcon
                icon="tabler-x"
                start
              />

              Cancel
            </VBtn>
            <VBtn
              variant="flat"
              type="submit"
              :loading="loading"
            >
              <VIcon
                icon="tabler-check"
                start
              />

              Save
            </VBtn>
          </VCardText>
        </VCard>
      </VForm>
    </PerfectScrollbar>
  </VDialog>
</template>

<script setup>
import { toast } from 'vue-sonner'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  documentType: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['handleClose'])
const store = useVuex()

const currentTab = ref('pegawai')

const handleClose = () => {
  store.commit("document/RESET_FORM")
  store.commit("document/SET_IS_UPDATE", false)

  emit('handleClose', false)
}

const handleSubmit = async e => {
  const { valid } = await e

  if(users.value.length === 0 && groups.value.length === 0){
    toast.error('Pegawai atau Group harus diisi')
    
    return
  }

  if(valid){
    if(is_update.value){ 
      store.dispatch('document/Update', {
        id: is_update.value,
        type: props.documentType,
      }).then(res => {
        if(res) handleClose()
      })
    }else{
      store.dispatch('document/Create', {
        type: props.documentType,
      }).then(res => {
        if(res) handleClose()
      })
    }
  }
}

const loading = computed(() => store.state.document.loading.form)
const is_update = computed(() => store.state.document.is_update)

const date = computed({
  get: () => store.state.document.form.date,
  set: value => store.commit('document/SET_FORM', {
    key: 'date',
    value,
  }),
})

const filepath = computed({
  get: () => store.state.document.form.filepath,
  set: value => store.commit('document/SET_FORM', {
    key: 'filepath',
    value,
  }),
})

const code = computed({
  get: () => store.state.document.form.code,
  set: value => store.commit('document/SET_FORM', {
    key: 'code',
    value,
  }),
})

const name = computed({
  get: () => store.state.document.form.name,
  set: value => store.commit('document/SET_FORM', {
    key: 'name',
    value,
  }),
})

const remarks = computed({
  get: () => store.state.document.form.remarks,
  set: value => store.commit('document/SET_FORM', {
    key: 'remarks',
    value,
  }),
})

const groups = computed({
  get: () => store.state.document.form.groups,
  set: value => store.commit('document/SET_FORM', {
    key: 'groups',
    value,
  }),
})

const users = computed({
  get: () => store.state.document.form.users,
  set: value => store.commit('document/SET_FORM', {
    key: 'users',
    value,
  }),
})

const units = computed({
  get: () => store.state.document.form.units,
  set: value => store.commit('document/SET_FORM', {
    key: 'units',
    value,
  }),
})
</script>
