import moment from 'moment'

export const isAdmin = () => {
  const user = JSON.parse(localStorage.getItem('App-User'))
  
  return user.is_admin
}

export const formatCalendar = date => {
  return date ? moment(date).calendar() : '-'
}

export const formatTanggal = date => {
  return date ? moment(date).format("DD/MM/YYYY") : '-'
}
