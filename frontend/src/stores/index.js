import { Store } from 'vuex'

import app from './modules/app'

import dashboard from './modules/dashboard'
import document from './modules/document'
import submission from './modules/submission'

import regulation from './modules/regulation'

import group from './modules/group'
import unit from './modules/unit'
import user from './modules/user'

const store = new Store({
  modules: {
    app,

    dashboard,
    document,
    submission,

    regulation,
    
    group,
    unit,
    user,
  },
})

export default store
