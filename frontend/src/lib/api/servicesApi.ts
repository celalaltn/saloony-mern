import api from './config'

// Service Types
export interface Service {
  id: string
  name: string
  description?: string
  price: number
  duration: number
  category: ServiceCategory | string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ServiceCategory {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface ServiceResponse {
  success: boolean
  message: string
  service: Service
}

export interface ServicesResponse {
  success: boolean
  message: string
  services: Service[]
  total: number
  page: number
  limit: number
}

export interface ServiceCategoriesResponse {
  success: boolean
  message: string
  categories: ServiceCategory[]
}

export interface ServiceCategoryResponse {
  success: boolean
  message: string
  category: ServiceCategory
}

// Service API Functions
export const servicesApi = {
  // Service CRUD
  getAll: async (params?: {
    page?: number
    limit?: number
    search?: string
    categoryId?: string
    isActive?: boolean
  }) => {
    const response = await api.get(`/services`, { params })
    return response.data
  },

  getById: async (id: string) => {
    const response = await api.get(`/services/${id}`)
    return response.data
  },

  create: async (data: {
    name: string
    description?: string
    price: number
    duration: number
    category: string
    isActive: boolean
  }) => {
    const response = await api.post(`/services`, data)
    return response.data
  },

  update: async (
    id: string,
    data: {
      name?: string
      description?: string
      price?: number
      duration?: number
      category?: string
      isActive?: boolean
    }
  ) => {
    const response = await api.put(`/services/${id}`, data)
    return response.data
  },

  delete: async (id: string) => {
    const response = await api.delete(`/services/${id}`)
    return response.data
  },

  toggleActive: async (id: string, isActive: boolean) => {
    const response = await api.patch(`/services/${id}/toggle-active`, { isActive })
    return response.data
  },

  // Category CRUD
  getCategories: async () => {
    const response = await api.get(`/service-categories`)
    return response.data
  },

  getCategoryById: async (id: string) => {
    const response = await api.get(`/service-categories/${id}`)
    return response.data
  },

  createCategory: async (data: { name: string; description?: string }) => {
    const response = await api.post(`/service-categories`, data)
    return response.data
  },

  updateCategory: async (id: string, data: { name?: string; description?: string }) => {
    const response = await api.put(`/service-categories/${id}`, data)
    return response.data
  },

  deleteCategory: async (id: string) => {
    const response = await api.delete(`/service-categories/${id}`)
    return response.data
  },
}

export default servicesApi
