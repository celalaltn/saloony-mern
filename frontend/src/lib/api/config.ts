import axios from 'axios'

// API temel URL'si
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

// Token'ı localStorage'dan al
const getToken = () => localStorage.getItem('accessToken')

// Axios instance oluştur
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - her istekte token ekle
api.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - hata işleme
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Token süresi dolmuşsa veya geçersizse
    if (error.response?.status === 401) {
      // Kullanıcıyı login sayfasına yönlendir
      window.location.href = '/login'
    }
    
    // Hata mesajını düzenle
    const errorMessage = error.response?.data?.message || error.message || 'Bir hata oluştu'
    return Promise.reject(new Error(errorMessage))
  }
)

export default api
