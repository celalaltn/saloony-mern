import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Paper,
  TablePagination,
  IconButton,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
  CardHeader,
  CardActionArea,
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Event as EventIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Spa as SpaIcon,
  DateRange as DateRangeIcon,
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { packagesApi } from '@/lib/api'
// date-fns sadece gerektiğinde kullanılacak

const PackagesPage: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showActive, setShowActive] = useState(true)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null)

  // Get packages data
  const { data: packagesData, isLoading } = useQuery({
    queryKey: ['packages', { page, limit: rowsPerPage, search: searchQuery, active: showActive }],
    queryFn: () => packagesApi.getAll({ 
      page: page + 1, 
      limit: rowsPerPage, 
      search: searchQuery,
      active: showActive
    }),
  })

  // Toggle package status mutation
  const togglePackageStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      packagesApi.update(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] })
      handleCloseMenu()
    },
    onError: (error: any) => {
      setError(error.message || 'Paket durumu güncellenirken bir hata oluştu')
      handleCloseMenu()
    }
  })

  // Delete package mutation
  const deletePackageMutation = useMutation({
    mutationFn: (id: string) => packagesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] })
      handleCloseMenu()
    },
    onError: (error: any) => {
      setError(error.message || 'Paket silinirken bir hata oluştu')
      handleCloseMenu()
    }
  })

  // Handle page change
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  // Handle search query change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
    setPage(0)
  }

  // Handle active filter change
  const handleActiveFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowActive(event.target.checked)
    setPage(0)
  }

  // Menu handlers
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, packageId: string) => {
    setAnchorEl(event.currentTarget)
    setSelectedPackageId(packageId)
  }

  const handleCloseMenu = () => {
    setAnchorEl(null)
    setSelectedPackageId(null)
  }

  // Toggle package status handler
  const handleTogglePackageStatus = () => {
    if (selectedPackageId) {
      const selectedPackage = packagesData?.data?.packages.find(
        (pkg: any) => pkg.id === selectedPackageId
      )
      if (selectedPackage) {
        togglePackageStatusMutation.mutate({
          id: selectedPackageId,
          isActive: !selectedPackage.isActive
        })
      }
    }
  }

  // Delete package handler
  const handleDeletePackage = () => {
    if (selectedPackageId) {
      deletePackageMutation.mutate(selectedPackageId)
    }
  }

  // Unused functions removed to fix lint errors

  // Calculate discount percentage
  const calculateDiscount = (price: number, totalValue: number) => {
    if (totalValue <= 0) return 0
    const discount = ((totalValue - price) / totalValue) * 100
    return Math.round(discount)
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Paketler
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          color="primary"
          onClick={() => navigate('/packages/create')}
        >
          Yeni Paket
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filter and Search */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <FormControlLabel
            control={
              <Switch
                checked={showActive}
                onChange={handleActiveFilterChange}
                color="primary"
              />
            }
            label="Sadece Aktif Paketler"
          />
          <TextField
            placeholder="Paket Ara..."
            size="small"
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Paper>

      {/* Package Grid */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" my={5}>
          <CircularProgress />
        </Box>
      ) : packagesData?.data?.packages?.length > 0 ? (
        <>
          <Grid container spacing={3} mb={3}>
            {packagesData.data.packages.map((pkg: any) => (
              <Grid item xs={12} sm={6} md={4} key={pkg.id}>
                <Card 
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    opacity: pkg.isActive ? 1 : 0.7
                  }}
                >
                  <CardHeader
                    title={pkg.name}
                    action={
                      <IconButton
                        onClick={(e) => handleOpenMenu(e, pkg.id)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    }
                  />
                  <CardActionArea 
                    onClick={() => navigate(`/packages/${pkg.id}`)}
                    sx={{ flexGrow: 1 }}
                  >
                    <CardContent>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {pkg.description || 'Açıklama bulunmuyor'}
                      </Typography>
                      
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <AttachMoneyIcon fontSize="small" color="primary" />
                        <Typography variant="h6" component="span">
                          {pkg.price} ₺
                        </Typography>
                        {calculateDiscount(pkg.price, pkg.totalValue) > 0 && (
                          <Chip 
                            label={`%${calculateDiscount(pkg.price, pkg.totalValue)} İndirim`} 
                            color="error" 
                            size="small" 
                          />
                        )}
                      </Box>
                      
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <SpaIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {pkg.sessionCount} Seans
                        </Typography>
                      </Box>
                      
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <DateRangeIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {pkg.validityPeriod} Gün Geçerlilik
                        </Typography>
                      </Box>
                      
                      <Divider sx={{ my: 1 }} />
                      
                      <Typography variant="subtitle2" gutterBottom>
                        Paket Hizmetleri:
                      </Typography>
                      <Box display="flex" gap={1} flexWrap="wrap">
                        {pkg.services.map((service: any) => (
                          <Chip 
                            key={service.id} 
                            label={service.name} 
                            size="small" 
                            variant="outlined" 
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </CardActionArea>
                  <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                    <Chip 
                      icon={pkg.isActive ? <CheckCircleIcon /> : <CancelIcon />}
                      label={pkg.isActive ? 'Aktif' : 'Pasif'}
                      color={pkg.isActive ? 'success' : 'default'}
                      size="small"
                    />
                    <Button 
                      size="small" 
                      startIcon={<EventIcon />}
                      onClick={() => navigate('/customers', { state: { packageId: pkg.id } })}
                    >
                      Müşteriye Sat
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          <TablePagination
            rowsPerPageOptions={[6, 12, 24]}
            component="div"
            count={packagesData?.data?.pagination?.total || 0}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Sayfa başına paket:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
          />
        </>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Paket Listesi
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {searchQuery ? 'Arama kriterlerine uygun paket bulunamadı' : 'Henüz paket bulunmuyor. Müşterileriniz için özel paketler oluşturun.'}
                </Typography>
                
                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Örnek Paket Türleri:
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip label="10 Seans Lazer" variant="outlined" />
                    <Chip label="5 Seans Masaj" variant="outlined" />
                    <Chip label="Gelin Paketi" variant="outlined" />
                    <Chip label="Aylık Bakım" variant="outlined" />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Package Stats */}
      <Grid container spacing={3} mt={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Toplam Paket
              </Typography>
              <Typography variant="h3">
                {isLoading ? <CircularProgress size={24} /> : packagesData?.data?.stats?.total || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Aktif Paketler
              </Typography>
              <Typography variant="h3">
                {isLoading ? <CircularProgress size={24} /> : packagesData?.data?.stats?.active || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Satılan Paketler
              </Typography>
              <Typography variant="h3">
                {isLoading ? <CircularProgress size={24} /> : packagesData?.data?.stats?.sold || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Package Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => {
          if (selectedPackageId) {
            navigate(`/packages/${selectedPackageId}/edit`)
            handleCloseMenu()
          }
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Düzenle</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleTogglePackageStatus}>
          <ListItemIcon>
            {packagesData?.data?.packages?.find((pkg: any) => pkg.id === selectedPackageId)?.isActive ? 
              <CancelIcon fontSize="small" /> : 
              <CheckCircleIcon fontSize="small" color="success" />
            }
          </ListItemIcon>
          <ListItemText>
            {packagesData?.data?.packages?.find((pkg: any) => pkg.id === selectedPackageId)?.isActive ? 
              'Pasif Yap' : 'Aktif Yap'
            }
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeletePackage}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Sil</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default PackagesPage
