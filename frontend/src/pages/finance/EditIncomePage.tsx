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
  InputAdornment,
  Divider,
} from '@mui/material'
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { financeApi } from '@/lib/api/financeApi'

// Form validation schema
const schema = yup.object({
  amount: yup.number().required('Tutar zorunludur').positive('Tutar pozitif olmalıdır'),
  date: yup.string().required('Tarih zorunludur'),
  categoryId: yup.string().required('Kategori seçimi zorunludur'),
  description: yup.string().required('Açıklama zorunludur'),
  paymentMethod: yup.string().required('Ödeme yöntemi zorunludur'),
  notes: yup.string(),
}).required()

// Form data type
type FormData = {
  amount: number;
  date: string;
  categoryId: string;
  description: string;
  paymentMethod: string;
  notes?: string;
}

const EditIncomePage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  
  // Form setup
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      categoryId: '',
      description: '',
      paymentMethod: '',
      notes: '',
    }
  })

  // Get income data
  const { 
    data: incomeData, 
    isLoading: isLoadingIncome,
    error: incomeError
  } = useQuery({
    queryKey: ['income', id],
    queryFn: () => financeApi.getIncomeById(id || ''),
    enabled: !!id,
  })

  // Kategori listesi sorgusu
  const {
    data: categoriesData,
    isLoading: isCategoriesLoading,
  } = useQuery({
    queryKey: ['financeCategories', 'income'],
    queryFn: () => financeApi.getCategories('income'),
  })

  // Update form when income data is loaded
  useEffect(() => {
    if (incomeData?.data?.income) {
      const income = incomeData.data.income
      reset({
        amount: income.amount,
        date: income.date ? new Date(income.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        categoryId: income.category?._id || income.categoryId || '',
        description: income.description || '',
        paymentMethod: income.paymentMethod || '',
        notes: income.notes || '',
      })
    }
  }, [incomeData, reset])

  // Update income mutation
  const updateIncomeMutation = useMutation({
    mutationFn: (data: any) => financeApi.updateIncome(id || '', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] })
      queryClient.invalidateQueries({ queryKey: ['income', id] })
      queryClient.invalidateQueries({ queryKey: ['financeSummary'] })
      navigate('/finance')
    },
    onError: (error: any) => {
      setError(error.message || 'Gelir kaydı güncellenirken bir hata oluştu')
    }
  })

  // Form submission handler
  const onSubmit = (data: any) => {
    updateIncomeMutation.mutate(data)
  }

  const isLoading = isLoadingIncome || updateIncomeMutation.isPending

  if (isLoadingIncome) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    )
  }

  if (incomeError || !incomeData?.data?.income) {
    return (
      <Alert severity="error">
        Gelir kaydı bulunamadı. <Button onClick={() => navigate('/finance')}>Finans Sayfasına Dön</Button>
      </Alert>
    )
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/finance')}
          sx={{ mr: 2 }}
        >
          Geri
        </Button>
        <Typography variant="h4" component="h1">
          Gelir Kaydını Düzenle
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
                name="amount"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Tutar"
                    type="number"
                    fullWidth
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₺</InputAdornment>,
                    }}
                    error={!!errors.amount}
                    helperText={errors.amount?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="date"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Tarih"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.date}
                    helperText={errors.date?.message}
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
                      disabled={isCategoriesLoading}
                    >
                      {isCategoriesLoading ? (
                        <MenuItem value="">
                          <CircularProgress size={20} />
                        </MenuItem>
                      ) : (
                        categoriesData?.data?.items?.map((category: any) => (
                          <MenuItem key={category._id} value={category._id}>
                            {category.name}
                          </MenuItem>
                        ))
                      )}
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
                name="paymentMethod"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.paymentMethod}>
                    <InputLabel>Ödeme Yöntemi</InputLabel>
                    <Select
                      {...field}
                      label="Ödeme Yöntemi"
                    >
                      <MenuItem value="cash">Nakit</MenuItem>
                      <MenuItem value="creditCard">Kredi Kartı</MenuItem>
                      <MenuItem value="bankTransfer">Banka Transferi</MenuItem>
                      <MenuItem value="other">Diğer</MenuItem>
                    </Select>
                    {errors.paymentMethod && (
                      <FormHelperText>{errors.paymentMethod.message}</FormHelperText>
                    )}
                  </FormControl>
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
                    error={!!errors.description}
                    helperText={errors.description?.message}
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
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box display="flex" justifyContent="flex-end" gap={2}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/finance')}
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
                  {isLoading ? (
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
      </Paper>
    </Box>
  )
}

export default EditIncomePage
