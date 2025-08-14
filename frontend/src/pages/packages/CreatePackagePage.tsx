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
  Alert,
  CircularProgress,
  Autocomplete,
  Chip,
  InputAdornment,
} from '@mui/material'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { packagesApi, servicesApi } from '@/lib/api'

// Form validation schema
const schema = yup.object({
  name: yup.string().required('Paket adı zorunludur'),
  description: yup.string(),
  price: yup.number().positive('Fiyat pozitif olmalıdır').required('Fiyat zorunludur'),
  sessionCount: yup.number().integer('Seans sayısı tam sayı olmalıdır').positive('Seans sayısı pozitif olmalıdır').required('Seans sayısı zorunludur'),
  validityPeriod: yup.number().integer('Geçerlilik süresi tam sayı olmalıdır').positive('Geçerlilik süresi pozitif olmalıdır').required('Geçerlilik süresi zorunludur'),
  services: yup.array().min(1, 'En az bir hizmet seçmelisiniz').required('Hizmet seçimi zorunludur'),
  isActive: yup.boolean(),
}).required()

// Form data type
type FormData = yup.InferType<typeof schema>

const CreatePackagePage: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  
  // Form setup
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      sessionCount: 1,
      validityPeriod: 30, // 30 gün
      services: [],
      isActive: true,
    }
  })

  // Get services data
  const { data: servicesData, isLoading: isLoadingServices } = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesApi.getAll(),
  })

  // Create package mutation
  const createPackageMutation = useMutation({
    mutationFn: (data: any) => packagesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] })
      navigate('/packages')
    },
    onError: (error: any) => {
      setError(error.message || 'Paket oluşturulurken bir hata oluştu')
    }
  })

  // Form submission handler
  const onSubmit = (data: FormData) => {
    // Calculate total value based on selected services
    const selectedServices = data.services.map(serviceId => 
      servicesData?.data?.services.find((s: any) => s.id === serviceId)
    )
    
    const totalValue = selectedServices.reduce((total, service) => 
      total + (service?.price || 0), 0
    ) * data.sessionCount
    
    const packageData = {
      ...data,
      totalValue,
    }
    
    createPackageMutation.mutate(packageData)
  }

  const isLoading = isLoadingServices || createPackageMutation.isPending

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Yeni Paket Oluştur
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
            <Grid item xs={12}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Paket Adı"
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
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
                    rows={3}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Controller
                name="price"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Paket Fiyatı"
                    type="number"
                    fullWidth
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₺</InputAdornment>,
                    }}
                    error={!!errors.price}
                    helperText={errors.price?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Controller
                name="sessionCount"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Seans Sayısı"
                    type="number"
                    fullWidth
                    error={!!errors.sessionCount}
                    helperText={errors.sessionCount?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Controller
                name="validityPeriod"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Geçerlilik Süresi (Gün)"
                    type="number"
                    fullWidth
                    error={!!errors.validityPeriod}
                    helperText={errors.validityPeriod?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Controller
                name="services"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.services}>
                    <Autocomplete
                      {...field}
                      multiple
                      options={servicesData?.data?.services || []}
                      getOptionLabel={(option) => 
                        typeof option === 'string' 
                          ? option 
                          : `${option.name} (${option.price} ₺)`
                      }
                      loading={isLoadingServices}
                      onChange={(_, newValue) => setValue('services', newValue.map((v: any) => v.id))}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            label={`${option.name} (${option.price} ₺)`}
                            {...getTagProps({ index })}
                          />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Paket Hizmetleri"
                          error={!!errors.services}
                          helperText={errors.services?.message}
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {isLoadingServices ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                    />
                  </FormControl>
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end" gap={2}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/packages')}
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
                  {isLoading ? <CircularProgress size={24} /> : 'Paket Oluştur'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  )
}

export default CreatePackagePage
