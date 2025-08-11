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
import CustomersPage from '@/pages/customers/CustomersPage'
import ServicesPage from '@/pages/services/ServicesPage'
import PackagesPage from '@/pages/packages/PackagesPage'
import TransactionsPage from '@/pages/transactions/TransactionsPage'
import StaffPage from '@/pages/staff/StaffPage'
import SettingsPage from '@/pages/settings/SettingsPage'

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
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

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
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
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
