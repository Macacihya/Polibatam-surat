<template>
  <VChip
    label
    :color="findStatus()?.color"
  >
    <VIcon
      :icon="findStatus()?.icon"
      size="16"
      start
    />

    {{ findStatus()?.display?.toUpperCase() }}
  </VChip>
</template>

<script setup>
const props = defineProps({
  status: String,
})

const statuses = [
  {
    icon: 'tabler-file-text',
    type: "DRAFT",
    display: 'Draf',
    color: 'primary',
  },
  {
    icon: 'tabler-file-text',
    type: "POSTED",
    display: 'Diposting',
    color: 'warning',
  },
  {
    icon: 'tabler-check',
    type: "APPROVED",
    display: 'Disetujui',
    color: 'success',
  },
  {
    icon: 'tabler-archive',
    type: "PUBLISHED",
    display: 'Diterbitkan',
    color: 'success',
  },
  {
    icon: 'tabler-x',
    type: "REJECTED",
    display: 'Ditolak',
    color: 'error',
  },
  {
    icon: 'tabler-list',
    type: "ALL",
    display: 'Semua',
    color: 'primary',
  },
]

const findStatus = () => {
  if (!props.status)
    return { icon: 'tabler-file-text', type: '', display: '-', color: 'secondary' }

  const found = statuses.find(status => status.type === props.status)
  if (found)
    return found

  const match = String(props.status).match(/^TAHAP_(\d+)_DISETUJUI$/i)
  if (match) {
    return {
      icon: 'tabler-check',
      type: props.status,
      display: `Tahap ${match[1]} Disetujui`,
      color: 'success',
    }
  }

  return {
    icon: 'tabler-info-circle',
    type: props.status,
    display: String(props.status).replace(/_/g, ' '),
    color: 'primary',
  }
}
</script>
