import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material'
import { servicesApi } from '../../lib/api'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

// Form validation schema
const categorySchema = yup.object({
  name: yup.string().required('Kategori adı zorunludur'),
  description: yup.string().optional(),
})

interface CategoryFormData {
  name: string
  description: string
}

const CategoriesPage: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [openAddDialog, setOpenAddDialog] = useState(false)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Form setup for add/edit
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: yupResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  // Get categories
  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['serviceCategories'],
    queryFn: () => servicesApi.getCategories(),
  })

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: (data: CategoryFormData) => servicesApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceCategories'] })
      handleCloseAddDialog()
      setError(null)
    },
    onError: (error: any) => {
      setError(error.message || 'Kategori oluşturulurken bir hata oluştu')
    },
  })

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryFormData }) =>
      servicesApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceCategories'] })
      handleCloseEditDialog()
      setError(null)
    },
    onError: (error: any) => {
      setError(error.message || 'Kategori güncellenirken bir hata oluştu')
    },
  })

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => servicesApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceCategories'] })
      handleCloseDeleteDialog()
      setError(null)
    },
    onError: (error: any) => {
      setError(error.message || 'Kategori silinirken bir hata oluştu')
    },
  })

  // Dialog handlers
  const handleOpenAddDialog = () => {
    reset({ name: '', description: '' })
    setOpenAddDialog(true)
  }

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false)
  }

  const handleOpenEditDialog = (category: any) => {
    setSelectedCategory(category)
    reset({
      name: category.name,
      description: category.description || '',
    })
    setOpenEditDialog(true)
  }

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false)
    setSelectedCategory(null)
  }

  const handleOpenDeleteDialog = (category: any) => {
    setSelectedCategory(category)
    setOpenDeleteDialog(true)
  }

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false)
    setSelectedCategory(null)
  }

  // Form submission handlers
  const onSubmitAdd = (data: CategoryFormData) => {
    createCategoryMutation.mutate(data)
  }

  const onSubmitEdit = (data: CategoryFormData) => {
    if (selectedCategory) {
      updateCategoryMutation.mutate({ id: selectedCategory.id, data })
    }
  }

  const onSubmitDelete = () => {
    if (selectedCategory) {
      deleteCategoryMutation.mutate(selectedCategory.id)
    }
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/services')}
          sx={{ mr: 2 }}
        >
          Hizmetlere Dön
        </Button>
        <Typography variant="h4" component="h1">
          Hizmet Kategorileri
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Kategoriler</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
          >
            Yeni Kategori
          </Button>
        </Box>

        {isLoading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : categoriesData?.data?.categories?.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Henüz kategori bulunmuyor. Yeni kategori eklemek için yukarıdaki butonu kullanın.
          </Typography>
        ) : (
          <List>
            {categoriesData?.data?.categories?.map((category: any) => (
              <React.Fragment key={category.id}>
                <ListItem>
                  <ListItemText
                    primary={category.name}
                    secondary={category.description || 'Açıklama yok'}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={() => handleOpenEditDialog(category)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleOpenDeleteDialog(category)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      {/* Add Category Dialog */}
      <Dialog open={openAddDialog} onClose={handleCloseAddDialog}>
        <DialogTitle>Yeni Kategori Ekle</DialogTitle>
        <form onSubmit={handleSubmit(onSubmitAdd)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Kategori Adı"
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
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAddDialog}>İptal</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createCategoryMutation.isPending}
            >
              {createCategoryMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog}>
        <DialogTitle>Kategori Düzenle</DialogTitle>
        <form onSubmit={handleSubmit(onSubmitEdit)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Kategori Adı"
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
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEditDialog}>İptal</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={updateCategoryMutation.isPending}
            >
              {updateCategoryMutation.isPending ? 'Güncelleniyor...' : 'Güncelle'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Category Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Kategori Sil</DialogTitle>
        <DialogContent>
          <DialogContentText>
            "{selectedCategory?.name}" kategorisini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>İptal</Button>
          <Button
            onClick={onSubmitDelete}
            color="error"
            variant="contained"
            disabled={deleteCategoryMutation.isPending}
          >
            {deleteCategoryMutation.isPending ? 'Siliniyor...' : 'Sil'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default CategoriesPage
