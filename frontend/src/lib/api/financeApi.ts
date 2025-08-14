import axios from 'axios'
import { API_URL } from './config'

// Finans işlemleri için API fonksiyonları
export const financeApi = {
  // Gelir işlemleri
  getIncomes: async (params?: any) => {
    const response = await axios.get(`${API_URL}/finances/incomes`, { params })
    return response.data
  },

  getIncomeById: async (id: string) => {
    const response = await axios.get(`${API_URL}/finances/incomes/${id}`)
    return response.data
  },

  createIncome: async (data: any) => {
    const response = await axios.post(`${API_URL}/finances/incomes`, data)
    return response.data
  },

  updateIncome: async (id: string, data: any) => {
    const response = await axios.put(`${API_URL}/finances/incomes/${id}`, data)
    return response.data
  },

  deleteIncome: async (id: string) => {
    const response = await axios.delete(`${API_URL}/finances/incomes/${id}`)
    return response.data
  },

  // Gider işlemleri
  getExpenses: async (params?: any) => {
    const response = await axios.get(`${API_URL}/finances/expenses`, { params })
    return response.data
  },

  getExpenseById: async (id: string) => {
    const response = await axios.get(`${API_URL}/finances/expenses/${id}`)
    return response.data
  },

  createExpense: async (data: any) => {
    const response = await axios.post(`${API_URL}/finances/expenses`, data)
    return response.data
  },

  updateExpense: async (id: string, data: any) => {
    const response = await axios.put(`${API_URL}/finances/expenses/${id}`, data)
    return response.data
  },

  deleteExpense: async (id: string) => {
    const response = await axios.delete(`${API_URL}/finances/expenses/${id}`)
    return response.data
  },

  // Finans özeti
  getSummary: async (params?: any) => {
    const response = await axios.get(`${API_URL}/finances/summary`, { params })
    return response.data
  },

  // Kategori işlemleri
  getCategories: async (type?: 'income' | 'expense') => {
    const params = type ? { type } : {}
    const response = await axios.get(`${API_URL}/finances/categories`, { params })
    return response.data
  },

  getCategoryById: async (id: string) => {
    const response = await axios.get(`${API_URL}/finances/categories/${id}`)
    return response.data
  },

  createCategory: async (data: any) => {
    const response = await axios.post(`${API_URL}/finances/categories`, data)
    return response.data
  },

  updateCategory: async (id: string, data: any) => {
    const response = await axios.put(`${API_URL}/finances/categories/${id}`, data)
    return response.data
  },

  deleteCategory: async (id: string) => {
    const response = await axios.delete(`${API_URL}/finances/categories/${id}`)
    return response.data
  }
}
