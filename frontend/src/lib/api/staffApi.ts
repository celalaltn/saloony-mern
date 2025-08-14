import api from './config'

export interface Staff {
  _id: string
  name: string
  email: string
  phone: string
  role: string
  specialization?: string
  password?: string // Şifre alanını ekledik
  workingHours?: {
    monday?: { start: string; end: string }
    tuesday?: { start: string; end: string }
    wednesday?: { start: string; end: string }
    thursday?: { start: string; end: string }
    friday?: { start: string; end: string }
    saturday?: { start: string; end: string }
    sunday?: { start: string; end: string }
  }
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface StaffResponse {
  success: boolean
  data: {
    staff: Staff
  }
}

export interface StaffListResponse {
  success: boolean
  data: {
    items: Staff[]
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export const staffApi = {
  // Get all staff with pagination
  getStaff: async (page = 1, limit = 10, search = '') => {
    const response = await api.get(`/staff?page=${page}&limit=${limit}&search=${search}`)
    return response.data as StaffListResponse
  },

  // Get staff by ID
  getStaffById: async (id: string) => {
    const response = await api.get(`/staff/${id}`)
    return response.data as StaffResponse
  },

  // Create new staff
  createStaff: async (staffData: Partial<Staff>) => {
    const response = await api.post('/staff', staffData)
    return response.data
  },

  // Update staff
  updateStaff: async (id: string, staffData: Partial<Staff>) => {
    const response = await api.put(`/staff/${id}`, staffData)
    return response.data
  },

  // Delete staff
  deleteStaff: async (id: string) => {
    const response = await api.delete(`/staff/${id}`)
    return response.data
  },

  // Update staff working hours
  updateWorkingHours: async (id: string, workingHours: Staff['workingHours']) => {
    const response = await api.put(`/staff/${id}/working-hours`, { workingHours })
    return response.data
  },

  // Toggle staff active status
  toggleActiveStatus: async (id: string, isActive: boolean) => {
    const response = await api.patch(`/staff/${id}/status`, { isActive })
    return response.data
  }
}
