<script setup>
definePage({ meta: { layout: 'blank', unauthenticatedOnly: true } })

const store = useVuex()

const loading = computed(() => store.state.app.loading)

const form = ref({
  username: '',
  password: '',
  remember: false,
})

const isPasswordVisible = ref(false)

const handleSubmit = async e => {
  const { valid } = await e

  if(valid){
    store.dispatch('app/Login', form.value)
  }
}
</script>

<template>
  <VRow
    no-gutters
    class="auth-wrapper"
    style="background-image: url('/bg-login.jpeg');"
  >
    <VCol class="d-flex align-center justify-center">
      <div style="width: 100%; max-width: 450px;">
        <VCard
          flat
          class="mt-12 mt-sm-0 pa-4"
        >
          <div class="mt-6 d-flex justify-center items-center gap-3">
            <img
              src="/logo.svg"
              alt="Logo"
              width="100"
            >
            <h4 class="text-h3 mb-0">
              Polibatam
            </h4>
          </div>

          <VCardText>
            <h5
              class="mb-0 text-center"
              style="font-size: 1.1rem; font-weight: 400;"
            >
              Aplikasi Pengajuan dan Distribusi SK 
            </h5>
          </VCardText>
          <VCardText>
            <VForm @submit.prevent="handleSubmit">
              <VRow>
                <!-- email -->
                <VCol cols="12">
                  <AppTextField
                    v-model="form.username"
                    autofocus
                    label="Username DokPol"
                    :rules="[requiredValidator]"
                  />
                </VCol>

                <!-- password -->
                <VCol cols="12">
                  <AppTextField
                    v-model="form.password"
                    label="Password"
                    :type="isPasswordVisible ? 'text' : 'password'"
                    :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                    :rules="[requiredValidator]"
                    @click:append-inner="isPasswordVisible = !isPasswordVisible"
                  />
                </VCol>

                <VCol cols="12">
                  <VBtn
                    block
                    type="submit"
                    :loading="loading"
                  >
                    Login
                  </VBtn>
                </VCol>
              </VRow>

              <div class="mt-5 mb-0 text-body-1">
                *Gunakan Login <strong>DokPol</strong> Anda
              </div>
            </VForm>
          </VCardText>
        </VCard>
      </div>
    </VCol>
  </VRow>
</template>



<style lang="scss">
@use "@core/scss/template/pages/page-auth.scss";

.auth-wrapper {
  background-position: center;
  background-size: cover;
}
</style>
