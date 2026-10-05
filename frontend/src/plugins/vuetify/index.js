import { deepMerge } from '@antfu/utils'
import { createVuetify } from 'vuetify'
import { VBtn } from 'vuetify/components/VBtn'
import defaults from './defaults'
import { icons } from './icons'
import { staticPrimaryColor, themes } from './theme'

import { VDataIterator } from 'vuetify/labs/VDataIterator'
import { VDataTable, VDataTableServer } from 'vuetify/labs/VDataTable'
import { VInfiniteScroll } from 'vuetify/labs/VInfiniteScroll'

// Styles
import { cookieRef } from '@/@layouts/stores/config'
import '@core/scss/template/libs/vuetify/index.scss'
import 'vuetify/styles'

export default function (app) {
  const cookieThemeValues = {
    defaultTheme: resolveVuetifyTheme(),
    themes: {
      light: {
        colors: {
          primary: cookieRef('lightThemePrimaryColor', staticPrimaryColor).value,
        },
      },
      dark: {
        colors: {
          primary: cookieRef('darkThemePrimaryColor', staticPrimaryColor).value,
        },
      },
    },
  }

  const optionTheme = deepMerge({ themes }, cookieThemeValues)

  const vuetify = createVuetify({
    aliases: {
      IconBtn: VBtn,
      VInfiniteScroll,
      VDataTable,
      VDataTableServer,
      VDataIterator,
    },
    defaults,
    icons,
    theme: optionTheme,
  })

  app.use(vuetify)
}
