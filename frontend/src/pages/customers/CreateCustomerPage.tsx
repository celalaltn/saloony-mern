import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  FormControlLabel,
  Switch,
} from '@mui/material'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { customersApi } from '@/lib/api'

// Form validation schema
const schema = yup.object({
  firstName: yup.string().required('İsim zorunludur'),
  lastName: yup.string().required('Soyisim zorunludur'),
  email: yup.string().email('Geçerli bir e-posta adresi giriniz'),
  phone: yup.string().required('Telefon numarası zorunludur'),
  gender: yup.string().oneOf(['male', 'female', 'other', 'prefer_not_to_say'], 'Geçerli bir cinsiyet seçiniz'),
  birthDate: yup.date().nullable(),
  // Adres alanlarını ayrı ayrı tanımlıyoruz
  street: yup.string(),
  city: yup.string(),
  state: yup.string(),
  postalCode: yup.string(),
  country: yup.string(),
  notes: yup.string(),
  allowSMS: yup.boolean(),
  allowEmail: yup.boolean(),
  // address alanını kaldırıyoruz, artık ayrı alanlar kullanıyoruz
}).required()

// Form data type
type FormData = yup.InferType<typeof schema>

// Backend'e gönderilecek veri tipi
interface CustomerPayload {
  firstName: string
  lastName: string
  email?: string
  phone: string
  dateOfBirth?: string // ISO8601 format
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  address?: {
    street?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }
  notes?: string
  communicationPreference?: 'email' | 'sms' | 'both' | 'none'
}

const CreateCustomerPage: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  
  // Form setup
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      gender: '',
      birthDate: null,
      // Adres alanlarını ayrı ayrı tanımlıyoruz
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      notes: '',
      allowSMS: true,
      allowEmail: true,
    }
  })

  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: (data: FormData) => {
      // Form verilerini backend'in beklediği formata dönüştür
      const payload: CustomerPayload = {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email,
        // birthDate -> dateOfBirth olarak dönüştür ve ISO string formatına çevir
        dateOfBirth: data.birthDate ? new Date(data.birthDate).toISOString() : undefined,
        gender: data.gender as 'male' | 'female' | 'other' | 'prefer_not_to_say',
        // Adres alanlarını nesne yapısına dönüştür
        address: {
          street: data.street || '',
          city: data.city || '',
          state: data.state || '',
          postalCode: data.postalCode || '',
          country: data.country || ''
        },
        notes: data.notes,
        // İletişim tercihlerini ekle
        communicationPreference: data.allowEmail && data.allowSMS ? 'both' : 
                                data.allowEmail ? 'email' : 
                                data.allowSMS ? 'sms' : 'none'
      }
      
      // API'ye dönüştürülmüş veriyi gönder
      return customersApi.create(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      navigate('/customers')
    },
    onError: (error: any) => {
      setError(error.message || 'Müşteri oluşturulurken bir hata oluştu')
    }
  })

  // Form submission handler
  const onSubmit = (data: FormData) => {
    // address alanını temizle, bu alanı kullanmıyoruz
    const cleanedData = { ...data };
    // @ts-ignore - address alanını temizle
    delete cleanedData.address;
    
    console.log('Temizlenmiş form verileri:', cleanedData) // Hata ayıklama için form verilerini görüntüle
    createCustomerMutation.mutate(cleanedData)
  }

  const isLoading = createCustomerMutation.isPending

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Yeni Müşteri Ekle
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 3 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Controller
                name="firstName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="İsim"
                    fullWidth
                    error={!!errors.firstName}
                    helperText={errors.firstName?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="lastName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Soyisim"
                    fullWidth
                    error={!!errors.lastName}
                    helperText={errors.lastName?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Telefon"
                    fullWidth
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="E-posta"
                    fullWidth
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.gender}>
                    <InputLabel>Cinsiyet</InputLabel>
                    <Select
                      {...field}
                      label="Cinsiyet"
                    >
                      <MenuItem value="male">Erkek</MenuItem>
                      <MenuItem value="female">Kadın</MenuItem>
                      <MenuItem value="other">Diğer</MenuItem>
                      <MenuItem value="prefer_not_to_say">Belirtmek İstemiyorum</MenuItem>
                    </Select>
                    {errors.gender && (
                      <FormHelperText>{errors.gender.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="birthDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Doğum Tarihi"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.birthDate}
                    helperText={errors.birthDate?.message}
                    value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                  />
                )}
              />
            </Grid>
            
            {/* Adres alanlarını ayrı ayrı inputlar olarak ekliyoruz */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Adres Bilgileri
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Controller
                name="street"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Sokak/Cadde"
                    fullWidth
                    error={!!errors.street}
                    helperText={errors.street?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="city"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Şehir"
                    fullWidth
                    error={!!errors.city}
                    helperText={errors.city?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="state"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="İlçe/Bölge"
                    fullWidth
                    error={!!errors.state}
                    helperText={errors.state?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="postalCode"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Posta Kodu"
                    fullWidth
                    error={!!errors.postalCode}
                    helperText={errors.postalCode?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="country"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Ülke"
                    fullWidth
                    error={!!errors.country}
                    helperText={errors.country?.message}
                    defaultValue="Türkiye"
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Notlar"
                    fullWidth
                    multiline
                    rows={3}
                    error={!!errors.notes}
                    helperText={errors.notes?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="allowSMS"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    }
                    label="SMS bildirimleri gönder"
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="allowEmail"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    }
                    label="E-posta bildirimleri gönder"
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end" gap={2}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/customers')}
                  disabled={isLoading}
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isLoading}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Müşteri Ekle'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  )
}

export default CreateCustomerPage
