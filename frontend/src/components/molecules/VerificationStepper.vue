<template>
  <div
    class="verification-stepper"
    role="list"
  >
    <div
      v-for="step in steps"
      :key="step.stage"
      class="vs-step"
      :class="`is-${step.state.toLowerCase()}`"
      role="listitem"
    >
      <div class="vs-marker">
        <VAvatar
          :color="meta(step.state).color"
          :variant="step.state === 'PENDING' ? 'tonal' : 'flat'"
          size="40"
        >
          <VIcon
            :icon="meta(step.state).icon"
            size="22"
          />
        </VAvatar>
      </div>

      <div class="vs-body">
        <div class="text-overline">
          Tahap {{ step.stage }}
        </div>
        <div class="text-body-1 font-weight-medium">
          {{ step.name }}
        </div>

        <VChip
          size="small"
          label
          class="mt-1"
          :color="meta(step.state).color"
        >
          {{ meta(step.state).label }}
        </VChip>

        <div class="text-caption mt-2 text-medium-emphasis">
          <template v-if="step.state === 'DONE' || step.state === 'REJECTED'">
            {{ step.state === 'DONE' ? 'Disetujui' : 'Ditolak' }} oleh {{ capitalize(step.acted_by?.nama) }}
            <br>
            {{ formatCalendar(step.acted_at) }}
          </template>
          <template v-else-if="step.state === 'CURRENT'">
            Menunggu: {{ names(step.verifiers) }}
          </template>
          <template v-else>
            Belum diproses
          </template>
        </div>

        <div
          v-if="step.state === 'REJECTED' && step.remarks"
          class="text-caption text-error mt-1"
        >
          Catatan: {{ step.remarks }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  // [{ stage, name, state: DONE|CURRENT|PENDING|REJECTED, verifiers[], acted_by, acted_at, remarks }]
  steps: {
    type: Array,
    default: () => [],
  },
})

const STATE_META = {
  DONE: { color: 'success', icon: 'tabler-check', label: 'Selesai' },
  CURRENT: { color: 'warning', icon: 'tabler-clock', label: 'Sedang diproses' },
  PENDING: { color: 'secondary', icon: 'tabler-circle-dashed', label: 'Menunggu giliran' },
  REJECTED: { color: 'error', icon: 'tabler-x', label: 'Ditolak' },
}

const meta = state => STATE_META[state] || STATE_META.PENDING

const capitalize = name => (name || '-')
  .toLowerCase()
  .split(' ')
  .map(w => w.charAt(0).toUpperCase() + w.slice(1))
  .join(' ')

const names = (verifiers = []) => verifiers.length
  ? verifiers.map(v => capitalize(v.nama)).join(', ')
  : 'Belum ada verifikator'
</script>

<style lang="scss" scoped>
.verification-stepper {
  display: flex;
  gap: 0;
}

.vs-step {
  position: relative;
  flex: 1 1 0;
  padding-inline: 0.5rem;
  text-align: center;

  // garis penghubung ke tahap berikutnya
  &:not(:last-child)::after {
    position: absolute;
    block-size: 2px;
    content: "";
    inset-block-start: 20px;
    inset-inline: calc(50% + 28px) calc(-50% + 28px);
    background: rgba(var(--v-border-color), var(--v-border-opacity));
  }

  &.is-done:not(:last-child)::after {
    background: rgb(var(--v-theme-success));
  }
}

.vs-marker {
  display: flex;
  justify-content: center;
  margin-block-end: 0.75rem;
}

@media (max-width: 599px) {
  .verification-stepper {
    flex-direction: column;
  }

  .vs-step {
    display: flex;
    gap: 1rem;
    padding-block-end: 1.5rem;
    padding-inline: 0;
    text-align: start;

    &:not(:last-child)::after {
      block-size: auto;
      inline-size: 2px;
      inset-block: 48px -4px;
      inset-inline: 19px auto;
    }
  }

  .vs-marker {
    margin-block-end: 0;
  }
}
</style>
