
<template>
  <VBadge
    dot
    location="bottom right"
    offset-x="3"
    offset-y="3"
    bordered
    color="success"
  >
    <div class="d-flex align-items-center gap-3 cursor-pointer">
      <div class="text-end d-none d-lg-block">
        <p class="font-weight-semibold mb-0">
          {{ user?.nama?.toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) }}
        </p>
        <p class="text-body-2 mb-0">
          {{ user?.is_admin ? 'Admin' : 'Pegawai' }}
        </p>
      </div>

      <VAvatar
        class="cursor-pointer"
        color="primary"
        variant="tonal"
      >
        <VImg :src="user?.photo || `https://ui-avatars.com/api/?name=${user?.nama}`" />

        <!-- SECTION Menu -->
       
      <!-- !SECTION -->
      </VAvatar>

      <VMenu
        activator="parent"
        width="230"
        location="bottom end"
        offset="14px"
      >
        <VList>
          <!-- 👉 Logout -->
          <VListItem @click="() => handleLogout()">
            <template #prepend>
              <VIcon
                class="me-2"
                icon="tabler-logout"
                size="22"
              />
            </template>

            <VListItemTitle>Logout</VListItemTitle>
          </VListItem>
        </VList>
      </VMenu>
    </div>
  </VBadge>
</template>

<script setup>
const store = useVuex()

const handleLogout = () => store.dispatch('app/Logout')

const user = computed(() => store.state.app.user)
</script>
