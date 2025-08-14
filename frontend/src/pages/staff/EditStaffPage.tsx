import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
  Divider,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
} from '@mui/material'
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { staffApi } from '@/lib/api/staffApi'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`staff-tabpanel-${index}`}
      aria-labelledby={`staff-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

// Form validation schema for basic info
const basicInfoSchema = yup.object({
  name: yup.string().required('İsim zorunludur'),
  email: yup.string().email('Geçerli bir e-posta adresi giriniz').required('E-posta zorunludur'),
  phone: yup.string().required('Telefon numarası zorunludur'),
  role: yup.string().required('Rol seçimi zorunludur'),
  specialization: yup.string(),
  isActive: yup.boolean(),
}).required()

// Form validation schema for password change
const passwordSchema = yup.object({
  password: yup.string().min(6, 'Şifre en az 6 karakter olmalıdır').required('Şifre zorunludur'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Şifreler eşleşmiyor')
    .required('Şifre tekrarı zorunludur'),
}).required()

// Form data types
type BasicInfoFormData = {
  name: string;
  email: string;
  phone: string;
  role: string;
  specialization?: string;
  isActive: boolean;
}

type PasswordFormData = {
  password: string;
  confirmPassword: string;
}

const EditStaffPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [tabValue, setTabValue] = useState(0)
  
  // Basic info form setup
  const {
    control: basicInfoControl,
    handleSubmit: handleBasicInfoSubmit,
    formState: { errors: basicInfoErrors },
    reset: resetBasicInfo,
  } = useForm<BasicInfoFormData>({
    resolver: yupResolver(basicInfoSchema) as any,
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      role: 'staff',
      specialization: '',
      isActive: true,
    }
  })

  // Password form setup
  const {
    control: passwordControl,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormData>({
    resolver: yupResolver(passwordSchema) as any,
    defaultValues: {
      password: '',
      confirmPassword: '',
    }
  })

  // Get staff data
  const { 
    data: staffData, 
    isLoading: isLoadingStaff,
    error: staffError
  } = useQuery({
    queryKey: ['staff', id],
    queryFn: () => staffApi.getStaffById(id || ''),
    enabled: !!id,
  })

  // Update form when staff data is loaded
  useEffect(() => {
    if (staffData?.data?.staff) {
      const staff = staffData.data.staff
      resetBasicInfo({
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        role: staff.role,
        specialization: staff.specialization || '',
        isActive: staff.isActive,
      })
    }
  }, [staffData, resetBasicInfo])

  // Update staff basic info mutation
  const updateStaffMutation = useMutation({
    mutationFn: (data: any) => staffApi.updateStaff(id || '', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      queryClient.invalidateQueries({ queryKey: ['staff', id] })
      setError(null)
    },
    onError: (error: any) => {
      setError(error.message || 'Personel bilgileri güncellenirken bir hata oluştu')
    }
  })

  // Update staff password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: (data: any) => {
      const { confirmPassword, ...passwordData } = data
      return staffApi.updateStaff(id || '', { password: passwordData.password })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', id] })
      resetPassword({
        password: '',
        confirmPassword: '',
      })
      setError(null)
    },
    onError: (error: any) => {
      setError(error.message || 'Şifre güncellenirken bir hata oluştu')
    }
  })

  // Form submission handlers
  const onBasicInfoSubmit = (data: any) => {
    updateStaffMutation.mutate(data)
  }

  const onPasswordSubmit = (data: PasswordFormData) => {
    updatePasswordMutation.mutate(data)
  }

  // Tab change handler
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const isLoading = isLoadingStaff || updateStaffMutation.isPending || updatePasswordMutation.isPending

  if (isLoadingStaff) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    )
  }

  if (staffError || !staffData?.data?.staff) {
    return (
      <Alert severity="error">
        Personel bilgileri bulunamadı. <Button onClick={() => navigate('/staff')}>Personel Listesine Dön</Button>
      </Alert>
    )
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/staff')}
          sx={{ mr: 2 }}
        >
          Geri
        </Button>
        <Typography variant="h4" component="h1">
          Personel Düzenle
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="staff edit tabs">
          <Tab label="Temel Bilgiler" />
          <Tab label="Şifre Değiştir" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <form onSubmit={handleBasicInfoSubmit(onBasicInfoSubmit)}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="name"
                  control={basicInfoControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="İsim Soyisim"
                      fullWidth
                      error={!!basicInfoErrors.name}
                      helperText={basicInfoErrors.name?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="email"
                  control={basicInfoControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="E-posta"
                      type="email"
                      fullWidth
                      error={!!basicInfoErrors.email}
                      helperText={basicInfoErrors.email?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="phone"
                  control={basicInfoControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Telefon"
                      fullWidth
                      error={!!basicInfoErrors.phone}
                      helperText={basicInfoErrors.phone?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="role"
                  control={basicInfoControl}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!basicInfoErrors.role}>
                      <InputLabel>Rol</InputLabel>
                      <Select
                        {...field}
                        label="Rol"
                      >
                        <MenuItem value="admin">Yönetici</MenuItem>
                        <MenuItem value="manager">Müdür</MenuItem>
                        <MenuItem value="stylist">Stilist</MenuItem>
                        <MenuItem value="hairdresser">Kuaför</MenuItem>
                        <MenuItem value="esthetician">Estetisyen</MenuItem>
                        <MenuItem value="masseur">Masör</MenuItem>
                        <MenuItem value="masseuse">Masöz</MenuItem>
                        <MenuItem value="nailArtist">Tırnak Sanatçısı</MenuItem>
                        <MenuItem value="receptionist">Resepsiyonist</MenuItem>
                        <MenuItem value="staff">Personel</MenuItem>
                      </Select>
                      {basicInfoErrors.role && (
                        <FormHelperText>{basicInfoErrors.role.message}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Controller
                  name="specialization"
                  control={basicInfoControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Uzmanlık Alanı"
                      fullWidth
                      error={!!basicInfoErrors.specialization}
                      helperText={basicInfoErrors.specialization?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Controller
                  name="isActive"
                  control={basicInfoControl}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      }
                      label="Aktif Personel"
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Box display="flex" justifyContent="flex-end" gap={2}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/staff')}
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
                    {updateStaffMutation.isPending ? (
                      <>
                        <CircularProgress size={24} sx={{ mr: 1 }} />
                        Güncelleniyor...
                      </>
                    ) : (
                      'Güncelle'
                    )}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="password"
                  control={passwordControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Yeni Şifre"
                      type="password"
                      fullWidth
                      error={!!passwordErrors.password}
                      helperText={passwordErrors.password?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="confirmPassword"
                  control={passwordControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Şifre Tekrarı"
                      type="password"
                      fullWidth
                      error={!!passwordErrors.confirmPassword}
                      helperText={passwordErrors.confirmPassword?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Box display="flex" justifyContent="flex-end" gap={2}>
                  <Button
                    variant="outlined"
                    onClick={() => resetPassword()}
                    disabled={updatePasswordMutation.isPending}
                  >
                    Temizle
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={updatePasswordMutation.isPending}
                  >
                    {updatePasswordMutation.isPending ? (
                      <>
                        <CircularProgress size={24} sx={{ mr: 1 }} />
                        Güncelleniyor...
                      </>
                    ) : (
                      'Şifre Güncelle'
                    )}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </TabPanel>
      </Paper>
    </Box>
  )
}

export default EditStaffPage
