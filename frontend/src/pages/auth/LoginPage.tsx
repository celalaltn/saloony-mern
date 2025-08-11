import React, { useState } from 'react'
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material'
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

const schema = yup.object({
  email: yup
    .string()
    .email('Geçerli bir e-posta adresi girin')
    .required('E-posta adresi gerekli'),
  password: yup
    .string()
    .min(6, 'Şifre en az 6 karakter olmalı')
    .required('Şifre gerekli'),
})

type FormData = yup.InferType<typeof schema>

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true)
      setError('')
      await login(data)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Giriş yapılırken bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Typography variant="h4" fontWeight="bold" textAlign="center" mb={3}>
        Giriş Yap
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        {...register('email')}
        fullWidth
        label="E-posta Adresi"
        type="email"
        error={!!errors.email}
        helperText={errors.email?.message}
        margin="normal"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Email />
            </InputAdornment>
          ),
        }}
      />

      <TextField
        {...register('password')}
        fullWidth
        label="Şifre"
        type={showPassword ? 'text' : 'password'}
        error={!!errors.password}
        helperText={errors.password?.message}
        margin="normal"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Lock />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        disabled={isLoading}
        sx={{ mt: 3, mb: 2, py: 1.5 }}
      >
        {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
      </Button>

      <Box textAlign="center">
        <Typography variant="body2">
          Hesabınız yok mu?{' '}
          <Link component={RouterLink} to="/register" underline="hover">
            Kayıt Ol
          </Link>
        </Typography>
      </Box>
    </Box>
  )
}

export default LoginPage
