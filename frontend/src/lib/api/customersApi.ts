import { api } from '../api'
import { API_URL } from '../config'

// Customer Types
export interface Customer {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone: string
  birthDate?: string
  gender?: 'male' | 'female' | 'other'
  address?: string
  notes?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CustomerResponse {
  success: boolean
  message: string
  customer: Customer
}

export interface CustomersResponse {
  success: boolean
  message: string
  customers: Customer[]
  total: number
  page: number
  limit: number
}

// Customer API Functions
export const customersApi = {
  getAll: async (params?: {
    page?: number
    limit?: number
    search?: string
    isActive?: boolean
  }) => {
    // Convert boolean isActive to string if present
    const queryParams = params ? { 
      ...params,
      isActive: params.isActive !== undefined ? String(params.isActive) : undefined 
    } : undefined;
    
    const response = await api.get('/customers', { params: queryParams })
    return response.data
  },

  getById: async (id: string) => {
    const response = await api.get(`${API_URL}/api/v1/customers/${id}`)
    return response.data
  },

  create: async (data: {
    firstName: string
    lastName: string
    email?: string
    phone: string
    birthDate?: string
    gender?: 'male' | 'female' | 'other'
    address?: string
    notes?: string
    isActive?: boolean
  }) => {
    const response = await api.post(`${API_URL}/api/v1/customers`, data)
    return response.data
  },

  update: async (
    id: string,
    customerData: {
      firstName?: string
      lastName?: string
      email?: string
      phone?: string
      birthDate?: string
      gender?: 'male' | 'female' | 'other'
      address?: string
      notes?: string
      isActive?: boolean
    }
  ) => {
    const response = await api.put(`${API_URL}/api/v1/customers/${id}`, customerData)
    return response.data
  },

  delete: async (id: string) => {
    const response = await api.delete(`${API_URL}/api/v1/customers/${id}`)
    return response.data
  },

  toggleActive: async (id: string, isActive: boolean) => {
    const response = await api.patch(`${API_URL}/api/v1/customers/${id}/toggle-active`, {
      isActive,
    })
    return response.data
  },

  // Customer statistics
  getStats: async () => {
    const response = await api.get(`${API_URL}/api/v1/customers/stats`)
    return response.data
  },
}

export default customersApi
