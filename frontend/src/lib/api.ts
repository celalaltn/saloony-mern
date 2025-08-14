import axios, { AxiosResponse, AxiosError } from 'axios'

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Token management
let accessToken: string | null = localStorage.getItem('accessToken')
let refreshToken: string | null = localStorage.getItem('refreshToken')

export const setTokens = (tokens: { accessToken: string; refreshToken: string }) => {
  accessToken = tokens.accessToken
  refreshToken = tokens.refreshToken
  localStorage.setItem('accessToken', tokens.accessToken)
  localStorage.setItem('refreshToken', tokens.refreshToken)
}

export const clearTokens = () => {
  accessToken = null
  refreshToken = null
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
}

export const getAccessToken = () => accessToken

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          })

          const { tokens } = response.data.data
          setTokens(tokens)

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`
          return api(originalRequest)
        } catch (refreshError) {
          // Refresh failed, redirect to login
          clearTokens()
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      } else {
        // No refresh token, redirect to login
        clearTokens()
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

// API response types
export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  errors?: any[]
}

export interface PaginatedResponse<T> {
  success: boolean
  data: {
    items: T[]
    pagination: {
      current: number
      pages: number
      total: number
      limit: number
    }
  }
}

// Generic API methods
export const apiClient = {
  get: <T = any>(url: string, params?: any): Promise<ApiResponse<T>> =>
    api.get(url, { params }).then((res) => res.data),

  post: <T = any>(url: string, data?: any): Promise<ApiResponse<T>> =>
    api.post(url, data).then((res) => res.data),

  put: <T = any>(url: string, data?: any): Promise<ApiResponse<T>> =>
    api.put(url, data).then((res) => res.data),

  patch: <T = any>(url: string, data?: any): Promise<ApiResponse<T>> =>
    api.patch(url, data).then((res) => res.data),

  delete: <T>(url: string, data?: any): Promise<ApiResponse<T>> =>
    api.delete(url, { data }).then((res) => res.data),
}

// Auth API
export const authApi = {
  login: (credentials: { identifier: string; password: string }) =>
    apiClient.post('/auth/login', credentials),

  register: (data: {
    email: string
    password: string
    phone: string
  }) => apiClient.post('/auth/register', data),

  refresh: (refreshToken: string) =>
    apiClient.post('/auth/refresh', { refreshToken }),

  logout: (refreshToken: string) =>
    apiClient.post('/auth/logout', { refreshToken }),

  getMe: () => apiClient.get('/auth/me'),
}

// Appointments API
export const appointmentsApi = {
  getAll: (params?: any) => apiClient.get('/appointments', params),
  getById: (id: string) => apiClient.get(`/appointments/${id}`),
  create: (data: any) => apiClient.post('/appointments', data),
  update: (id: string, data: any) => apiClient.put(`/appointments/${id}`, data),
  cancel: (id: string, reason?: string) =>
    apiClient.delete(`/appointments/${id}`, { reason }),
  getCalendar: (params: { start: string; end: string; staff?: string }) =>
    apiClient.get('/appointments/calendar', params),
}

// Customers API
export const customersApi = {
  getAll: (params?: any) => apiClient.get('/customers', params),
  getById: (id: string) => apiClient.get(`/customers/${id}`),
  create: (data: any) => apiClient.post('/customers', data),
  update: (id: string, data: any) => apiClient.put(`/customers/${id}`, data),
  delete: (id: string) => apiClient.delete(`/customers/${id}`),
  getAppointments: (id: string, params?: any) =>
    apiClient.get(`/customers/${id}/appointments`, params),
  getPackages: (id: string) => apiClient.get(`/customers/${id}/packages`),
  addNote: (id: string, note: string) =>
    apiClient.post(`/customers/${id}/notes`, { note }),
}

// Services API
export const servicesApi = {
  getAll: (params?: any) => apiClient.get('/services', params),
  getById: (id: string) => apiClient.get(`/services/${id}`),
  create: (data: any) => apiClient.post('/services', data),
  update: (id: string, data: any) => apiClient.put(`/services/${id}`, data),
  delete: (id: string) => apiClient.delete(`/services/${id}`),
}

// Users API
export const usersApi = {
  getAll: () => apiClient.get('/users'),
  create: (data: any) => apiClient.post('/users', data),
  update: (id: string, data: any) => apiClient.put(`/users/${id}`, data),
  delete: (id: string) => apiClient.delete(`/users/${id}`),
}

// Dashboard API
export const dashboardApi = {
  getStats: () => apiClient.get('/dashboard/stats'),
}

// Transactions API
export const transactionsApi = {
  getAll: (params?: any) => apiClient.get('/transactions', params),
  create: (data: any) => apiClient.post('/transactions', data),
  update: (id: string, data: any) => apiClient.put(`/transactions/${id}`, data),
  delete: (id: string) => apiClient.delete(`/transactions/${id}`),
}

// Packages API
export const packagesApi = {
  getAll: (params?: any) => apiClient.get('/packages', params),
  getById: (id: string) => apiClient.get(`/packages/${id}`),
  create: (data: any) => apiClient.post('/packages', data),
  update: (id: string, data: any) => apiClient.put(`/packages/${id}`, data),
  delete: (id: string) => apiClient.delete(`/packages/${id}`),
  assignToCustomer: (packageId: string, customerId: string, data: any) =>
    apiClient.post(`/packages/${packageId}/assign/${customerId}`, data),
  getCustomerPackages: (customerId: string) =>
    apiClient.get(`/customers/${customerId}/packages`),
  trackSession: (customerPackageId: string) =>
    apiClient.post(`/customer-packages/${customerPackageId}/track-session`),
}

// Products API
export const productsApi = {
  getAll: (params?: any) => apiClient.get('/products', params),
  getById: (id: string) => apiClient.get(`/products/${id}`),
  create: (data: any) => apiClient.post('/products', data),
  update: (id: string, data: any) => apiClient.put(`/products/${id}`, data),
  delete: (id: string) => apiClient.delete(`/products/${id}`),
  getCategories: () => apiClient.get('/product-categories'),
  createCategory: (data: any) => apiClient.post('/product-categories', data),
  updateCategory: (id: string, data: any) => apiClient.put(`/product-categories/${id}`, data),
  deleteCategory: (id: string) => apiClient.delete(`/product-categories/${id}`),
  updateStock: (id: string, quantity: number) => 
    apiClient.post(`/products/${id}/stock`, { quantity }),
}

export default api
