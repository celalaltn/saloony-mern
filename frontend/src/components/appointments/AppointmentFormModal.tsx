import React, { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import {
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Autocomplete,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { tr } from 'date-fns/locale'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customersApi, servicesApi } from '@/lib/api'
import { staffApi } from '@/lib/api/staffApi'

// Geçici appointmentsApi tanımı
const appointmentsApi = {
  create: async (data: any) => {
    // API endpoint henüz hazır olmadığından konsola yazdırıyoruz
    console.log('Creating appointment with data:', data)
    // Başarılı bir yanıt simüle ediyoruz
    return Promise.resolve({ success: true, data })
  }
}

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

interface AppointmentFormModalProps {
  open: boolean
  onClose: () => void
}

const AppointmentFormModal: React.FC<AppointmentFormModalProps> = ({ open, onClose }) => {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  
  // Form setup
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      customerId: '',
      staffId: '',
      services: [],
      startTime: new Date(),
      notes: '',
    }
  })

  // Get customers data
  const { data: customersData, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      try {
        const response = await customersApi.getAll({ page: 1, limit: 100 })
        // API yanıtını güvenli bir şekilde işliyoruz
        return { customers: response && 'customers' in response ? response.customers : [] }
      } catch (error) {
        console.error('Error fetching customers:', error)
        return { customers: [] }
      }
    },
  }) as { data: { customers: any[] } | undefined, isLoading: boolean }

  // Get staff data
  const { data: staffData, isLoading: isLoadingStaff } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      try {
        const response = await staffApi.getStaff(1, 100, '')
        return response
      } catch (error) {
        console.error('Error fetching staff:', error)
        return { data: { items: [] } }
      }
    },
  })

  // Get services data
  const { data: servicesData, isLoading: isLoadingServices } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      try {
        const response = await servicesApi.getAll()
        // API yanıtını güvenli bir şekilde işliyoruz
        return { services: response && 'services' in response ? response.services : [] }
      } catch (error) {
        console.error('Error fetching services:', error)
        return { services: [] }
      }
    },
  }) as { data: { services: any[] } | undefined, isLoading: boolean }

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: (data: any) => appointmentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      reset() // Reset form
      onClose() // Close modal
    },
    onError: (error: any) => {
      setError(error.message || 'Randevu oluşturulurken bir hata oluştu')
    }
  })

  // Form submission handler
  const onSubmit = (data: FormData) => {
    // Note: We could calculate service duration here if needed in the future
    // const selectedServices = data.services.map(serviceId => 
    //   servicesData?.data?.services.find((s: any) => s.id === serviceId)
    // )
    // const totalDuration = selectedServices.reduce((total, service) => 
    //   total + (service?.duration || 0), 0
    // )
    
    const startTime = new Date(data.startTime)
    
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

  const handleCancel = () => {
    reset() // Reset form
    onClose() // Close modal
  }

  const isLoading = isLoadingCustomers || isLoadingStaff || isLoadingServices || createAppointmentMutation.isPending

  return (
    <Dialog 
      open={open} 
      onClose={handleCancel}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        <Typography variant="subtitle1">Yeni Randevu Oluştur</Typography>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 3, mt: 2 }}>
            {error}
          </Alert>
        )}

        <form id="appointment-form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <Controller
                name="customerId"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    options={customersData?.customers || []}
                    getOptionLabel={(option: any) => 
                      typeof option === 'string' 
                        ? option 
                        : `${option.firstName} ${option.lastName} (${option.phone})`
                    }
                    loading={isLoadingCustomers}
                    onChange={(_, newValue: any) => setValue('customerId', newValue?.id || '')}
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
                      {staffData?.data?.items?.map((staff: any) => (
                        <MenuItem key={staff._id} value={staff._id}>
                          {staff.name}
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
                      options={servicesData?.services || []}
                      getOptionLabel={(option) => option?.name || ''}
                      loading={isLoadingServices}
                      onChange={(_, newValue: any[]) => setValue('services', newValue.map((v: any) => v.id))}
                      renderTags={(value: any[], getTagProps) =>
                        value.map((option: any, index: number) => (
                          <Chip
                            label={`${option.name} (${option.duration} dk - ${option.price} ₺)`}
                            {...getTagProps({ index })}
                          />
                        ))
                      }
                      renderInput={(params: any) => (
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
          </Grid>
        </form>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          variant="outlined"
          onClick={handleCancel}
          disabled={isLoading}
        >
          İptal
        </Button>
        <Button
          type="submit"
          form="appointment-form"
          variant="contained"
          color="primary"
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Randevu Oluştur'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AppointmentFormModal
