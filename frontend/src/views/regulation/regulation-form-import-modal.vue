<template>
  <VDialog
    :model-value="props.open"
    max-width="600"
    @click:outside="handleClose"
  >
    <DialogCloseBtn @click="handleClose" />
  
  
    <VCard
      title="Import Regulation"
      subtitle="Import Regulation from excel file"
    >
      <VDivider class="mt-3" />

      <VCardText>
        <input
          ref="file"
          type="file"
          class="mb-3"
          accept=".xlsx, .xls"
          required
          @change="onImport"
        >

        <p class="text-body-2 mb-0">
          *Please upload the excel file with the following the <strong>Excel Header</strong>
        </p>
      </VCardText>
      <VDivider class="mb-2" />
      <VCardActions class="d-flex justify-space-between">
        <VBtn
          variant="text"
          class="px-3"
          size="small"
          :loading="loading"
          @click="onDownloadTemplate"
        >
          <VIcon
            icon="tabler-download"
            start
          />
  
          Download Excel Header
        </VBtn>
        <div class="d-flex justify-end">
          <VBtn
            variant="text"
            class="px-3"
            size="small"
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
            class="px-3"
            size="small"
            :loading="loading"
            @click="onSubmit"
          >
            <VIcon
              icon="tabler-file-plus"
              start
            />
  
            Import
          </VBtn>
        </div>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script setup>
import xlsx from "json-as-xlsx"
import * as XLSX from "xlsx"

const props = defineProps({
  open: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['handleClose'])
const store = useVuex()

const handleClose = () => {
  emit('handleClose', false)
}

const loading = computed(() => store.state.regulation.loading.form)

const onDownloadTemplate = () => {
  const data = [
    {
      columns: [
        { label: "Regulation" },
      ],
      content: [],
    },
  ]

  let settings = {
    fileName: `Import Format regulation`, 
    extraLength: 3,
    writeMode: "writeFile",
  }

  xlsx(data, settings)
}

const onImport = async e => {
  var files = e.target.files,
    f = files[0]
  var reader = new FileReader()

  const commit = store.commit

  reader.onload = function (e) {
    var data = new Uint8Array(e.target.result)
    var workbook = XLSX.read(data, { type: "array" })
    let sheetName = workbook.SheetNames[0]

    /* DO SOMETHING WITH workbook HERE */
    let worksheet = workbook.Sheets[sheetName]
    let json = XLSX.utils.sheet_to_json(worksheet)

    let formatted_json = []
    for (const iterator of json) {
      formatted_json.push({
        title: iterator["Regulation"],
      })
    }

    commit("regulation/SET_FORM_IMPORT", formatted_json)

    // console.log("json", json)
    console.log("formatted_json", formatted_json)
  }
  reader.readAsArrayBuffer(f)
}

const onSubmit = async () => { 
  await store.dispatch('regulation/BulkCreate').then(res => {
    if(res) handleClose()
  })
}
</script>
