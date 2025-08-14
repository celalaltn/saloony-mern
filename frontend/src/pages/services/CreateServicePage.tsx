import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  InputAdornment,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Divider,
  Paper,
} from '@mui/material'
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material'
import { servicesApi } from '../../lib/api'

// Form validation schema
const validationSchema = yup.object({
  name: yup.string().required('Hizmet adı zorunludur'),
  description: yup.string().optional(),
  price: yup
    .number()
    .typeError('Fiyat sayı olmalıdır')
    .positive('Fiyat pozitif olmalıdır')
    .required('Fiyat zorunludur'),
  duration: yup
    .number()
    .typeError('Süre sayı olmalıdır')
    .positive('Süre pozitif olmalıdır')
    .integer('Süre tam sayı olmalıdır')
    .required('Süre zorunludur'),
  categoryId: yup.string().required('Kategori seçimi zorunludur'),
  isActive: yup.boolean().required(),
})

// Form data type
interface FormData {
  name: string
  description: string
  price: number
  duration: number
  categoryId: string
  isActive: boolean
}

const CreateServicePage: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  // Form setup
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      duration: 30,
      categoryId: '',
      isActive: true,
    },
  })

  // Get categories
  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['serviceCategories'],
    queryFn: () => servicesApi.getCategories(),
  })

  // Create service mutation
  const createServiceMutation = useMutation({
    mutationFn: (data: FormData) => {
      const serviceData = {
        name: data.name,
        description: data.description,
        price: data.price,
        duration: data.duration,
        category: data.categoryId,
        isActive: data.isActive,
      }
      return servicesApi.create(serviceData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      navigate('/services')
    },
    onError: (error: any) => {
      setError(error.message || 'Hizmet oluşturulurken bir hata oluştu')
    },
  })

  // Form submission handler
  const onSubmit = (data: FormData) => {
    setError(null)
    createServiceMutation.mutate(data)
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/services')}
          sx={{ mr: 2 }}
        >
          Geri
        </Button>
        <Typography variant="h4" component="h1">
          Yeni Hizmet Ekle
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Hizmet Adı"
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.categoryId}>
                    <InputLabel>Kategori</InputLabel>
                    <Select
                      {...field}
                      label="Kategori"
                      disabled={isLoadingCategories}
                    >
                      {categoriesData?.data?.categories?.map((category: any) => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.categoryId && (
                      <FormHelperText>{errors.categoryId.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="price"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Fiyat"
                    fullWidth
                    type="number"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">₺</InputAdornment>,
                    }}
                    error={!!errors.price}
                    helperText={errors.price?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="duration"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Süre (dakika)"
                    fullWidth
                    type="number"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">dk</InputAdornment>,
                    }}
                    error={!!errors.duration}
                    helperText={errors.duration?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Açıklama"
                    fullWidth
                    multiline
                    rows={4}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="isActive"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={value}
                        onChange={(e) => onChange(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Aktif"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box display="flex" justifyContent="flex-end" gap={2}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/services')}
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting || createServiceMutation.isPending}
                >
                  {(isSubmitting || createServiceMutation.isPending) ? (
                    <>
                      <CircularProgress size={24} sx={{ mr: 1 }} />
                      Kaydediliyor...
                    </>
                  ) : (
                    'Kaydet'
                  )}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  )
}

export default CreateServicePage
