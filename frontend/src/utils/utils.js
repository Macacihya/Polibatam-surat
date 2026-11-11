import moment from 'moment'

export const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('App-User'))
  } catch (error) {
    return null
  }
}

export const isAdmin = () => {
  try {
    const user = JSON.parse(localStorage.getItem('App-User'))

    return !!user?.is_admin
  } catch (error) {
    return false
  }
}

export const formatCalendar = date => {
  return date ? moment(date).calendar() : '-'
}

export const formatTanggal = date => {
  return date ? moment(date).format("DD/MM/YYYY") : '-'
}

// ---- Verifikator ----
export const IS_VERIFICATION_MOCK = import.meta.env.VITE_VERIFICATION_MOCK === 'true'

export const getVerifierStages = () => {
  if (IS_VERIFICATION_MOCK) return [1, 2, 3]

  try {
    const user = JSON.parse(localStorage.getItem('App-User'))

    return Array.isArray(user?.verifier_stages) ? user.verifier_stages : []
  } catch (error) {
    return []
  }
}

export const isVerifier = () => getVerifierStages().length > 0