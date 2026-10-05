<template>
  <div class="d-flex justify-end flex-column flex-sm-row gap-3 rounded">
    <div class="bg-grey-100 rounded border">
      <VTabs
        v-model="filter_type"
        class="v-tabs-pill"
        @update:model-value="onUpdate"
      >
        <VTab
          v-for="(item) in filters"
          :key="item.value"
          class="pa-0 shadow-none"
          :value="item.value"
        >
          {{ item.title }}
        </VTab>
      </VTabs>
    </div>
    <div class="filter-container">
      <AppDateTimePicker
        v-if="filter_type === 'RANGE'"
        v-model="localRange"
        placeholder="Date Range"
        prepend-inner-icon="tabler-calendar"
        :config="{
          mode: 'range',
          dateFormat: 'Y-m-d',
        }"
        @update:model-value="onUpdate"
      />
      <AppDateTimePicker
        v-if="filter_type === 'MONTH'"
        v-model="localMonth"
        prepend-inner-icon="tabler-calendar"
        placeholder="Month"
        :config="monthSelect"
        @update:model-value="onUpdate"
      />
      <AppSelect 
        v-if="filter_type === 'YEAR'"
        v-model="localYear"
        prepend-inner-icon="tabler-calendar"
        placeholder="Year"
        :items="years"
        @update:model-value="onUpdate"
      />
    </div>
  </div>
</template>

<script setup>
// eslint-disable-next-line import/extensions
import monthSelectPlugin from 'flatpickr/dist/plugins/monthSelect/index.js'
import 'flatpickr/dist/plugins/monthSelect/style.css'
import moment from 'moment'

// Props
const props = defineProps({
  modelValue: {
    type: String,
    default: () => `${moment().startOf('month').format('YYYY-MM-DD')} to ${moment().endOf('month').format('YYYY-MM-DD')}`,
  },
  range: {
    type: String,
    default: () => `${moment().startOf('month').format('YYYY-MM-DD')} to ${moment().endOf('month').format('YYYY-MM-DD')}`,
  },
  month: {
    type: String,
    default: () => moment().format('YYYY-MM'),
  },
  year: {
    type: Number,
    default: () => new Date().getFullYear(),
  },
})

// Emits
const emit = defineEmits(['update:modelValue', 'update:range', 'update:month', 'update:year'])

// Reactive Variables for Props
const localRange = ref(props.range)
const localMonth = ref(props.month)
const localYear = ref(props.year)

// Watchers to Update Parent Component
watch(localRange, newValue => {
  emit('update:range', newValue)
})

watch(localMonth, newValue => {
  emit('update:month', newValue)
})

watch(localYear, newValue => {
  emit('update:year', newValue)
})

const onUpdate = () => {
  switch (filter_type.value) {
  case 'YEAR':
    const startOfYear = moment().year(localYear.value).startOf('year').format('YYYY-MM-DD')
    const endOfYear = moment().year(localYear.value).endOf('year').format('YYYY-MM-DD')

    emit('update:modelValue', `${startOfYear} to ${endOfYear}`)
    break
  case 'MONTH':
    const startOfMonth = moment(localMonth.value).startOf('month').format('YYYY-MM-DD')
    const endOfMonth = moment(localMonth.value).endOf('month').format('YYYY-MM-DD')

    emit('update:modelValue', `${startOfMonth} to ${endOfMonth}`)
    break
  
  default:
    emit('update:modelValue', localRange.value)
    break
  }
}

// Filters
const filter_type = ref('YEAR')

const filters = [
  { title: 'Range', value: 'RANGE' },
  { title: 'Month', value: 'MONTH' },
  { title: 'Year', value: 'YEAR' },
]

// Years Array
const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i)

// Month Select Configuration
const monthSelect = {
  plugins: [
    new monthSelectPlugin({
      shorthand: true,
      dateFormat: "Y-m",
    }),
  ],
}

onMounted(() => onUpdate())
</script>

<style scoped>
.filter-container {
  inline-size: 17rem;
}
</style>
