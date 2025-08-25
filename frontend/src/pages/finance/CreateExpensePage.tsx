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
  InputAdornment,
} from '@mui/material'
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { financeApi } from '@/lib/api/financeApi'

// Form validation schema
const schema = yup.object({
  amount: yup.number().required('Tutar zorunludur').positive('Tutar pozitif olmalıdır'),
  date: yup.date().required('Tarih zorunludur'),
  categoryId: yup.string().required('Kategori seçimi zorunludur'),
  description: yup.string().required('Açıklama zorunludur'),
  paymentMethod: yup.string().required('Ödeme yöntemi zorunludur'),
  notes: yup.string(),
}).required()

// Form data type
type FormData = yup.InferType<typeof schema>

const CreateExpensePage: React.FC = () => {
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
      amount: 0,
      date: new Date(),
      categoryId: '',
      description: '',
      paymentMethod: '',
      notes: '',
    }
  })

  // Kategori listesi sorgusu
  const {
    data: categoriesData,
    isLoading: isCategoriesLoading,
  } = useQuery({
    queryKey: ['financeCategories', 'expense'],
    queryFn: () => financeApi.getCategories('expense'),
  })

  // Create expense mutation
  const createExpenseMutation = useMutation({
    mutationFn: (data: FormData) => financeApi.createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['financeSummary'] })
      navigate('/finance')
    },
    onError: (error: any) => {
      setError(error.message || 'Gider kaydı oluşturulurken bir hata oluştu')
    }
  })

  // Form submission handler
  const onSubmit = (data: FormData) => {
    createExpenseMutation.mutate(data)
  }

  const isLoading = createExpenseMutation.isPending

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
          Yeni Gider Ekle
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
                  color="secondary"
                  disabled={isLoading}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Gider Ekle'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  )
}

export default CreateExpensePage
