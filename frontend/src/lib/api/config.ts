import axios from 'axios'
import { getToken } from '@/utils/auth'

// API temel URL'si
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api/v1'

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
