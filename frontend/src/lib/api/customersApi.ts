import axios from 'axios'
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
    const response = await axios.get(`${API_URL}/api/v1/customers`, { params })
    return response.data
  },

  getById: async (id: string) => {
    const response = await axios.get(`${API_URL}/api/v1/customers/${id}`)
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
    const response = await axios.post(`${API_URL}/api/v1/customers`, data)
    return response.data
  },

  update: async (
    id: string,
    data: {
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
    const response = await axios.put(`${API_URL}/api/v1/customers/${id}`, data)
    return response.data
  },

  delete: async (id: string) => {
    const response = await axios.delete(`${API_URL}/api/v1/customers/${id}`)
    return response.data
  },

  toggleActive: async (id: string, isActive: boolean) => {
    const response = await axios.patch(`${API_URL}/api/v1/customers/${id}/toggle-active`, {
      isActive,
    })
    return response.data
  },

  // Customer statistics
  getStats: async () => {
    const response = await axios.get(`${API_URL}/api/v1/customers/stats`)
    return response.data
  },
}

export default customersApi
