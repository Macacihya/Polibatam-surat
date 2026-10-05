<template>
  <div
    v-if="user"
    class="d-flex items-center gap-2 text-no-wrap"
  >
    <VAvatar
      color="secondary"
      variant="tonal"
      size="40"
    >
      {{ avatarText(user.nama)?.slice(0,2) }}
    </VAvatar>

    <div>
      <div class="text-sm">
        {{ capitalizeName(user.nama) }}
      </div>
      <div
        class="text-grey-700"
        style="font-size: 0.7rem;"
      >
        {{ user.email || "-" }}
      </div>
    </div>
  </div>
  <span v-else>-</span>
</template>

<script setup> 
const props = defineProps({
  user: {
    type: Object,
    required: true,
  },
})

function capitalizeName(name) {
  return name.toLowerCase().split(' ').map(word => {
    return word.charAt(0).toUpperCase() + word.slice(1)
  }).join(' ')
}
</script>
