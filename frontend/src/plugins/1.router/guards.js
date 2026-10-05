
export const setupGuards = router => {
  // 👉 router.beforeEach
  // Docs: https://router.vuejs.org/guide/advanced/navigation-guards.html#global-before-guards
  router.beforeEach(to => {
    /*
         * If it's a public route, continue navigation. This kind of pages are allowed to visited by login & non-login users. Basically, without any restrictions.
         * Examples of public routes are, 404, under maintenance, etc.
         */
    if (to.meta.public)
      return

    const isLoggedIn = localStorage.getItem('App-Token')

    if (to.meta.unauthenticatedOnly) {
      if (isLoggedIn)
        return '/'
      else
        return undefined
    }

    /*
            * If user is not logged in, redirect to login page
            * else allow visiting the page
            * (WARN: Don't allow executing further by return statement because next code will check for permissions)
            */
           
    if (!isLoggedIn)
      return '/login'
    else
      return undefined
    

    // if (!canNavigate(to)) {
    //   /* eslint-disable indent */
    //         return isLoggedIn
    //             ? { name: 'not-authorized' }
    //             : {
    //                 name: 'login',
    //                 query: {
    //                     ...to.query,
    //                     to: to.fullPath !== '/' ? to.path : undefined,
    //                 },
    //             }
    //         /* eslint-enable indent */
    // }
  })
}
