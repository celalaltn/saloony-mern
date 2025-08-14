import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  Divider,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material'
import { servicesApi } from '../../lib/api'
import { useMutation } from '@tanstack/react-query'

const ServicesPage: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [activeFilter, setActiveFilter] = useState<boolean | null>(null)
  
  // Menu state
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  
  // Get services data
  const { data: servicesData, isLoading, error } = useQuery({
    queryKey: ['services', searchTerm, categoryFilter, activeFilter],
    queryFn: () => servicesApi.getAll({
      search: searchTerm,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      isActive: activeFilter,
    }),
  })
  
  // Get categories
  const { data: categoriesData } = useQuery({
    queryKey: ['serviceCategories'],
    queryFn: () => servicesApi.getCategories(),
  })
  
  // Delete service mutation
  const deleteServiceMutation = useMutation({
    mutationFn: (id: string) => servicesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      handleCloseDeleteDialog()
    },
  })
  
  // Toggle service active status mutation
  const toggleActiveStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { isActive: boolean } }) => 
      servicesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      handleCloseMenu()
    },
  })
  
  // Menu handlers
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, serviceId: string) => {
    setMenuAnchorEl(event.currentTarget)
    setSelectedServiceId(serviceId)
  }
  
  const handleCloseMenu = () => {
    setMenuAnchorEl(null)
    setSelectedServiceId(null)
  }
  
  // Delete dialog handlers
  const handleOpenDeleteDialog = () => {
    setDeleteDialogOpen(true)
    handleCloseMenu()
  }
  
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false)
  }
  
  const handleDeleteService = () => {
    if (selectedServiceId) {
      deleteServiceMutation.mutate(selectedServiceId)
    }
  }
  
  const handleToggleActiveStatus = (service: any) => {
    if (selectedServiceId) {
      toggleActiveStatusMutation.mutate({
        id: selectedServiceId,
        data: { isActive: !service.isActive },
      })
    }
  }
  
  // Calculate service statistics
  const totalServices = servicesData?.data?.services?.length || 0
  const activeServices = servicesData?.data?.services?.filter(s => s.isActive)?.length || 0
  const inactiveServices = totalServices - activeServices
  
  const selectedService = servicesData?.data?.services?.find(s => s.id === selectedServiceId)
  
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Hizmetler
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          color="primary"
          onClick={() => navigate('/services/create')}
        >
          Yeni Hizmet
        </Button>
      </Box>
      
      {/* Statistics Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4}>
          <Paper elevation={2} sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <Typography variant="h6">Toplam Hizmet</Typography>
            <Typography variant="h4">{totalServices}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper elevation={2} sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
            <Typography variant="h6">Aktif Hizmet</Typography>
            <Typography variant="h4">{activeServices}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper elevation={2} sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
            <Typography variant="h6">Pasif Hizmet</Typography>
            <Typography variant="h4">{inactiveServices}</Typography>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Search and Filters */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Hizmet Ara"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Kategori</InputLabel>
            <Select
              value={categoryFilter}
              label="Kategori"
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="all">Tüm Kategoriler</MenuItem>
              {categoriesData?.data?.categories?.map((category: any) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Durum</InputLabel>
            <Select
              value={activeFilter === null ? 'all' : activeFilter ? 'active' : 'inactive'}
              label="Durum"
              onChange={(e) => {
                const value = e.target.value
                setActiveFilter(value === 'all' ? null : value === 'active')
              }}
            >
              <MenuItem value="all">Tüm Durumlar</MenuItem>
              <MenuItem value="active">Aktif</MenuItem>
              <MenuItem value="inactive">Pasif</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Services List */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">
          Hizmetler yüklenirken bir hata oluştu: {(error as any).message}
        </Alert>
      ) : servicesData?.data?.services?.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Hizmet Bulunamadı
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Arama kriterlerinize uygun hizmet bulunamadı. Filtreleri değiştirmeyi veya yeni hizmet eklemeyi deneyin.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {servicesData?.data?.services?.map((service: any) => (
            <Grid item xs={12} sm={6} md={4} key={service.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Typography variant="h6" gutterBottom>
                      {service.name}
                    </Typography>
                    <IconButton size="small" onClick={(e) => handleOpenMenu(e, service.id)}>
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {service.description || 'Açıklama bulunmuyor'}
                  </Typography>
                  
                  <Box display="flex" justifyContent="space-between" mt={2}>
                    <Typography variant="h6" color="primary">
                      {service.price} ₺
                    </Typography>
                    <Typography variant="body2">
                      {service.duration} dakika
                    </Typography>
                  </Box>
                  
                  <Box mt={2} display="flex" gap={1} flexWrap="wrap">
                    <Chip 
                      label={service.isActive ? 'Aktif' : 'Pasif'}
                      color={service.isActive ? 'success' : 'error'}
                      size="small"
                    />
                    {service.category && (
                      <Chip 
                        label={service.category.name}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Service Actions Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => {
          navigate(`/services/edit/${selectedServiceId}`)
          handleCloseMenu()
        }}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Düzenle
        </MenuItem>
        <MenuItem onClick={() => selectedService && handleToggleActiveStatus(selectedService)}>
          {selectedService?.isActive ? (
            <>
              <CloseIcon fontSize="small" sx={{ mr: 1 }} />
              Pasife Al
            </>
          ) : (
            <>
              <CheckIcon fontSize="small" sx={{ mr: 1 }} />
              Aktife Al
            </>
          )}
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleOpenDeleteDialog} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Sil
        </MenuItem>
      </Menu>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Hizmet Silme</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bu hizmeti silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>İptal</Button>
          <Button 
            onClick={handleDeleteService} 
            color="error" 
            variant="contained"
            disabled={deleteServiceMutation.isPending}
          >
            {deleteServiceMutation.isPending ? 'Siliniyor...' : 'Sil'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ServicesPage
