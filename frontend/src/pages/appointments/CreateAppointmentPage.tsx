import React, { useState, useEffect } from 'react'
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
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Autocomplete,
  Chip,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { tr } from 'date-fns/locale'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { appointmentsApi, customersApi, servicesApi, usersApi } from '@/lib/api'

// Form validation schema
const schema = yup.object({
  customerId: yup.string().required('Müşteri seçimi zorunludur'),
  staffId: yup.string().required('Personel seçimi zorunludur'),
  services: yup.array().min(1, 'En az bir hizmet seçmelisiniz').required('Hizmet seçimi zorunludur'),
  startTime: yup.date().required('Başlangıç zamanı zorunludur'),
  notes: yup.string(),
}).required()

// Form data type
type FormData = yup.InferType<typeof schema>

const CreateAppointmentPage: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  
  // Form setup
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      services: [],
      startTime: new Date(),
      notes: '',
    }
  })

  // Get customers data
  const { data: customersData, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.getAll(),
  })

  // Get staff data
  const { data: staffData, isLoading: isLoadingStaff } = useQuery({
    queryKey: ['staff'],
    queryFn: () => usersApi.getAll(),
  })

  // Get services data
  const { data: servicesData, isLoading: isLoadingServices } = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesApi.getAll(),
  })

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: (data: any) => appointmentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      navigate('/appointments')
    },
    onError: (error: any) => {
      setError(error.message || 'Randevu oluşturulurken bir hata oluştu')
    }
  })

  // Form submission handler
  const onSubmit = (data: FormData) => {
    // Calculate end time based on selected services duration
    const selectedServices = data.services.map(serviceId => 
      servicesData?.data?.services.find(s => s.id === serviceId)
    )
    
    const totalDuration = selectedServices.reduce((total, service) => 
      total + (service?.duration || 0), 0
    )
    
    const startTime = new Date(data.startTime)
    const endTime = new Date(startTime.getTime() + totalDuration * 60000) // convert minutes to milliseconds
    
    const appointmentData = {
      customer: data.customerId,
      staff: data.staffId,
      services: data.services.map(serviceId => ({ service: serviceId })), // Format services as expected by backend
      dateTime: startTime.toISOString(), // Use dateTime as expected by backend
      notes: data.notes,
      status: 'scheduled',
    }
    
    createAppointmentMutation.mutate(appointmentData)
  }

  const isLoading = isLoadingCustomers || isLoadingStaff || isLoadingServices || createAppointmentMutation.isPending

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Yeni Randevu Oluştur
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
                name="customerId"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    options={customersData?.data?.customers || []}
                    getOptionLabel={(option) => 
                      typeof option === 'string' 
                        ? option 
                        : `${option.firstName} ${option.lastName} (${option.phone})`
                    }
                    loading={isLoadingCustomers}
                    onChange={(_, newValue) => setValue('customerId', newValue?.id || '')}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Müşteri"
                        error={!!errors.customerId}
                        helperText={errors.customerId?.message}
                        fullWidth
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {isLoadingCustomers ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="staffId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.staffId}>
                    <InputLabel>Personel</InputLabel>
                    <Select
                      {...field}
                      label="Personel"
                    >
                      {staffData?.data?.users?.map((staff) => (
                        <MenuItem key={staff.id} value={staff.id}>
                          {staff.firstName} {staff.lastName}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.staffId && (
                      <FormHelperText>{errors.staffId.message}</FormHelperText>
                    )}
                  </FormControl>
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
                          : `${option.name} (${option.duration} dk - ${option.price} ₺)`
                      }
                      loading={isLoadingServices}
                      onChange={(_, newValue) => setValue('services', newValue.map(v => v.id))}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            label={`${option.name} (${option.duration} dk - ${option.price} ₺)`}
                            {...getTagProps({ index })}
                          />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Hizmetler"
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
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
                <Controller
                  name="startTime"
                  control={control}
                  render={({ field }) => (
                    <DateTimePicker
                      label="Başlangıç Zamanı"
                      value={field.value}
                      onChange={(newValue) => field.onChange(newValue)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.startTime,
                          helperText: errors.startTime?.message,
                        },
                      }}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12}>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Notlar"
                    multiline
                    rows={4}
                    fullWidth
                    error={!!errors.notes}
                    helperText={errors.notes?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end" gap={2}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/appointments')}
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
                  {isLoading ? <CircularProgress size={24} /> : 'Randevu Oluştur'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  )
}

export default CreateAppointmentPage
