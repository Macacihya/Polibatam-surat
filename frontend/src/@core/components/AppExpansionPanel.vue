<template>
  <VExpansionPanel :class="`border-0 mb-3 ${props.class}`">
    <VExpansionPanelTitle
      class="bg-app-expansion-panel"
      :class="[{ 'border-error text-error': error }]"
      :collapse-icon="error ? 'tabler-alert-triangle' : 'tabler-chevron-up'"
      :expand-icon="error ? 'tabler-alert-triangle' : 'tabler-chevron-down'"
      disable-icon-rotate
    >
      {{ title }}
    </VExpansionPanelTitle>
    <VExpansionPanelText
      class="pt-5 mb-8"
      eager
    >
      <VForm ref="refInitialForm">
        <slot />
      </VForm>
    </VExpansionPanelText>
  </VExpansionPanel>
</template>

<script setup>
const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  error: {
    type: Boolean,
    required: true,
  },
  onValidate: {
    type: Number,
    required: true,
  },
  class: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:error'])
const refInitialForm = ref(null)

watch(() => props.onValidate, async () => {
  const { valid } = await refInitialForm.value.validate()

  emit('update:error', !valid)
})
</script>

<style lang="scss">
.bg-app-expansion-panel {
  background-color: #f5f5f5;
}

.border-error {
  border-color: #FF5252 !important;
}

.text-error {
  color: #FF5252 !important;
}
</style>
