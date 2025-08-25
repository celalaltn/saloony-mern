import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { useAuth } from '@/contexts/AuthContext'

// Layout components
import DashboardLayout from '@/components/layout/DashboardLayout'
import AuthLayout from '@/components/layout/AuthLayout'

// Auth pages
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'

// Dashboard pages
import DashboardPage from '@/pages/dashboard/DashboardPage'
import AppointmentsPage from '@/pages/appointments/AppointmentsPage'

// Customer pages
import CustomersPage from '@/pages/customers/CustomersPage'
import CreateCustomerPage from '@/pages/customers/CreateCustomerPage'
import EditCustomerPage from '@/pages/customers/EditCustomerPage'

// Services pages
import ServicesPage from '@/pages/services/ServicesPage'
import CreateServicePage from '@/pages/services/CreateServicePage'
import EditServicePage from '@/pages/services/EditServicePage'
import CategoriesPage from '@/pages/services/CategoriesPage'

// Finance pages
import FinancePage from '@/pages/finance/FinancePage'
import CreateIncomePage from '@/pages/finance/CreateIncomePage'
import EditIncomePage from '@/pages/finance/EditIncomePage'
import CreateExpensePage from '@/pages/finance/CreateExpensePage'
import EditExpensePage from '@/pages/finance/EditExpensePage'

// Package pages
import PackagesPage from '@/pages/packages/PackagesPage'
import TransactionsPage from '@/pages/transactions/TransactionsPage'

// Staff pages
import StaffPage from '@/pages/staff/StaffPage'
import CreateStaffPage from '@/pages/staff/CreateStaffPage'
import EditStaffPage from '@/pages/staff/EditStaffPage'

import SettingsPage from '@/pages/settings/SettingsPage'

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()

  console.log('ProtectedRoute - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated)

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        sx={{ backgroundColor: '#f5f5f5' }}
      >
        <Box textAlign="center">
          <CircularProgress />
          <Box mt={2}>Yükleniyor...</Box>
        </Box>
      </Box>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Public Route component (redirect if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()

  console.log('PublicRoute - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated)

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        sx={{ backgroundColor: '#f5f5f5' }}
      >
        <Box textAlign="center">
          <CircularProgress />
          <Box mt={2}>Yükleniyor...</Box>
        </Box>
      </Box>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

const App: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <AuthLayout>
              <RegisterPage />
            </AuthLayout>
          </PublicRoute>
        }
      />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <DashboardPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/appointments"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <AppointmentsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <CustomersPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers/create"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <CreateCustomerPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers/edit/:id"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <EditCustomerPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/services"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ServicesPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/services/create"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <CreateServicePage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/services/edit/:id"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <EditServicePage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/services/categories"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <CategoriesPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/packages"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <PackagesPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/transactions"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <TransactionsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      {/* Finance Routes */}
      <Route
        path="/finance"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <FinancePage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance/income/create"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <CreateIncomePage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance/income/edit/:id"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <EditIncomePage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance/expense/create"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <CreateExpensePage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance/expense/edit/:id"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <EditExpensePage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <StaffPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/create"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <CreateStaffPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/edit/:id"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <EditStaffPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <SettingsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
