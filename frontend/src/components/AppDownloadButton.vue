<template>
  <a
    v-if="props.modelValue"
    :href="props.modelValue"
    target="_blank"
    rel="noopener noreferrer"
    class="d-flex flex-nowrap items-center"
  >
    <VAvatar
      size="30"
      variant="tonal"
      class="me-2"
    >
      <VIcon
        icon="tabler-cloud-download"
        size="18"
      />
    </VAvatar>
    <span class="text-body-1 font-weight-medium">
      Download
    </span>
  </a>

  <div v-else>
    Tidak Ada
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: String,
})
</script>
