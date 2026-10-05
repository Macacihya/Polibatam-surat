import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('App-Token'),
  },
})

axiosInstance.interceptors.response.use(
  response => {
    return response
  },
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('App-Token')
      localStorage.removeItem('App-User')
      
      window.location.href = '/'
    }
      
    return Promise.reject(error)
  },
)
export default axiosInstance
