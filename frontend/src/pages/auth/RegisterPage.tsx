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
  MenuItem,
  Grid,
} from '@mui/material'
import { Visibility, VisibilityOff, Business, Person, Email, Lock, Phone } from '@mui/icons-material'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useAuth, RegisterData } from '@/contexts/AuthContext'

const schema = yup.object({
  companyName: yup
    .string()
    .min(2, 'Şirket adı en az 2 karakter olmalı')
    .max(100, 'Şirket adı en fazla 100 karakter olabilir')
    .required('Şirket adı gerekli'),
  businessType: yup
    .string()
    .oneOf(['salon', 'barbershop', 'spa', 'clinic'], 'Geçerli bir işletme türü seçin')
    .required('İşletme türü gerekli'),
  firstName: yup
    .string()
    .min(2, 'Ad en az 2 karakter olmalı')
    .max(50, 'Ad en fazla 50 karakter olabilir')
    .required('Ad gerekli'),
  lastName: yup
    .string()
    .min(2, 'Soyad en az 2 karakter olmalı')
    .max(50, 'Soyad en fazla 50 karakter olabilir')
    .required('Soyad gerekli'),
  email: yup
    .string()
    .email('Geçerli bir e-posta adresi girin')
    .required('E-posta adresi gerekli'),
  password: yup
    .string()
    .min(6, 'Şifre en az 6 karakter olmalı')
    .required('Şifre gerekli'),
  phone: yup
    .string()
    .matches(/^[\+]?[1-9][\d]{0,15}$/, 'Geçerli bir telefon numarası girin')
    .required('Telefon numarası gerekli'),
})

type FormData = yup.InferType<typeof schema>

const businessTypes = [
  { value: 'salon', label: 'Güzellik Salonu' },
  { value: 'barbershop', label: 'Kuaför' },
  { value: 'spa', label: 'SPA' },
  { value: 'clinic', label: 'Klinik' },
]

const RegisterPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { register: registerUser } = useAuth()
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
      await registerUser(data as RegisterData)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Kayıt olurken bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Typography variant="h4" fontWeight="bold" textAlign="center" mb={3}>
        Kayıt Ol
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            {...register('companyName')}
            fullWidth
            label="Şirket Adı"
            error={!!errors.companyName}
            helperText={errors.companyName?.message}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Business />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            {...register('businessType')}
            select
            fullWidth
            label="İşletme Türü"
            error={!!errors.businessType}
            helperText={errors.businessType?.message}
          >
            {businessTypes.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={6}>
          <TextField
            {...register('firstName')}
            fullWidth
            label="Ad"
            error={!!errors.firstName}
            helperText={errors.firstName?.message}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid item xs={6}>
          <TextField
            {...register('lastName')}
            fullWidth
            label="Soyad"
            error={!!errors.lastName}
            helperText={errors.lastName?.message}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            {...register('email')}
            fullWidth
            label="E-posta Adresi"
            type="email"
            error={!!errors.email}
            helperText={errors.email?.message}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            {...register('phone')}
            fullWidth
            label="Telefon Numarası"
            error={!!errors.phone}
            helperText={errors.phone?.message}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Phone />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            {...register('password')}
            fullWidth
            label="Şifre"
            type={showPassword ? 'text' : 'password'}
            error={!!errors.password}
            helperText={errors.password?.message}
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
        </Grid>
      </Grid>

      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        disabled={isLoading}
        sx={{ mt: 3, mb: 2, py: 1.5 }}
      >
        {isLoading ? 'Kayıt oluşturuluyor...' : 'Kayıt Ol'}
      </Button>

      <Box textAlign="center">
        <Typography variant="body2">
          Zaten hesabınız var mı?{' '}
          <Link component={RouterLink} to="/login" underline="hover">
            Giriş Yap
          </Link>
        </Typography>
      </Box>
    </Box>
  )
}

export default RegisterPage
