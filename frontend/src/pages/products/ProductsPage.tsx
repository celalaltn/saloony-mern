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
  Avatar,
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AttachMoney as AttachMoneyIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsApi } from '@/lib/api'

const ProductsPage: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(12)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showActive, setShowActive] = useState(true)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Get products data
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', { page, limit: rowsPerPage, search: searchQuery, active: showActive, category: categoryFilter }],
    queryFn: () => productsApi.getAll({ 
      page: page + 1, 
      limit: rowsPerPage, 
      search: searchQuery,
      active: showActive,
      category: categoryFilter !== 'all' ? categoryFilter : undefined
    }),
  })

  // Get categories for filter
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productsApi.getCategories(),
  })

  // Toggle product status mutation
  const toggleProductStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      productsApi.update(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      handleCloseMenu()
    },
    onError: (error: any) => {
      setError(error.message || 'Ürün durumu güncellenirken bir hata oluştu')
      handleCloseMenu()
    }
  })

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      handleCloseMenu()
    },
    onError: (error: any) => {
      setError(error.message || 'Ürün silinirken bir hata oluştu')
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

  // Handle category filter change
  const handleCategoryFilterChange = (category: string) => {
    setCategoryFilter(category)
    setPage(0)
  }

  // Menu handlers
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, productId: string) => {
    setAnchorEl(event.currentTarget)
    setSelectedProductId(productId)
  }

  const handleCloseMenu = () => {
    setAnchorEl(null)
    setSelectedProductId(null)
  }

  // Toggle product status handler
  const handleToggleProductStatus = () => {
    if (selectedProductId) {
      const selectedProduct = productsData?.data?.products?.find(
        (product: any) => product.id === selectedProductId
      )
      if (selectedProduct) {
        toggleProductStatusMutation.mutate({
          id: selectedProductId,
          isActive: !selectedProduct.isActive
        })
      }
    }
  }

  // Delete product handler
  const handleDeleteProduct = () => {
    if (selectedProductId) {
      deleteProductMutation.mutate(selectedProductId)
    }
  }

  // Add to cart handler
  const handleAddToCart = (productId: string) => {
    // TODO: Implement add to cart functionality
    console.log('Add to cart:', productId)
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Ürünler
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          color="primary"
          onClick={() => navigate('/products/create')}
        >
          Yeni Ürün
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filter and Search */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} gap={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={showActive}
                  onChange={handleActiveFilterChange}
                  color="primary"
                />
              }
              label="Sadece Aktif Ürünler"
            />
          </Box>
          
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            <Chip 
              label="Tüm Kategoriler" 
              color={categoryFilter === 'all' ? 'primary' : 'default'}
              onClick={() => handleCategoryFilterChange('all')}
              clickable
            />
            {categoriesData?.data?.categories?.map((category: any) => (
              <Chip 
                key={category.id} 
                label={category.name} 
                color={categoryFilter === category.id ? 'primary' : 'default'}
                onClick={() => handleCategoryFilterChange(category.id)}
                clickable
              />
            ))}
          </Box>
          
          <TextField
            placeholder="Ürün Ara..."
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

      {/* Product Stats */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Toplam Ürün
              </Typography>
              <Typography variant="h3">
                {isLoading ? <CircularProgress size={24} /> : productsData?.data?.stats?.total || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Aktif Ürünler
              </Typography>
              <Typography variant="h3">
                {isLoading ? <CircularProgress size={24} /> : productsData?.data?.stats?.active || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Stokta Azalan
              </Typography>
              <Typography variant="h3">
                {isLoading ? <CircularProgress size={24} /> : productsData?.data?.stats?.lowStock || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Toplam Değer
              </Typography>
              <Typography variant="h3">
                {isLoading ? <CircularProgress size={24} /> : `${productsData?.data?.stats?.totalValue || 0} ₺`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Product Grid */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" my={5}>
          <CircularProgress />
        </Box>
      ) : productsData?.data?.products?.length > 0 ? (
        <>
          <Grid container spacing={3} mb={3}>
            {productsData.data.products.map((product: any) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                <Card 
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    opacity: product.isActive ? 1 : 0.7
                  }}
                >
                  <CardHeader
                    avatar={
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <InventoryIcon />
                      </Avatar>
                    }
                    action={
                      <IconButton
                        onClick={(e) => handleOpenMenu(e, product.id)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    }
                    title={product.name}
                    subheader={product.category?.name || 'Kategorisiz'}
                  />
                  <CardActionArea 
                    onClick={() => navigate(`/products/${product.id}`)}
                    sx={{ flexGrow: 1 }}
                  >
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <AttachMoneyIcon fontSize="small" color="primary" />
                        <Typography variant="h6" component="span">
                          {product.price} ₺
                        </Typography>
                      </Box>
                      
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <InventoryIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          Stok: {product.stock}
                        </Typography>
                        {product.stock <= product.lowStockThreshold && (
                          <Chip 
                            label="Stok Az" 
                            color="warning" 
                            size="small" 
                          />
                        )}
                      </Box>
                      
                      <Divider sx={{ my: 1 }} />
                      
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {product.description || 'Açıklama bulunmuyor'}
                      </Typography>
                      
                      {product.barcode && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          Barkod: {product.barcode}
                        </Typography>
                      )}
                    </CardContent>
                  </CardActionArea>
                  <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                    <Chip 
                      icon={product.isActive ? <CheckCircleIcon /> : <CancelIcon />}
                      label={product.isActive ? 'Aktif' : 'Pasif'}
                      color={product.isActive ? 'success' : 'default'}
                      size="small"
                    />
                    <Button 
                      size="small" 
                      startIcon={<ShoppingCartIcon />}
                      onClick={() => handleAddToCart(product.id)}
                      disabled={!product.isActive || product.stock <= 0}
                    >
                      Sepete Ekle
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          <TablePagination
            rowsPerPageOptions={[12, 24, 48]}
            component="div"
            count={productsData?.data?.pagination?.total || 0}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Sayfa başına ürün:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
          />
        </>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Ürün Listesi
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {searchQuery || categoryFilter !== 'all' ? 'Arama kriterlerine uygun ürün bulunamadı' : 'Henüz ürün bulunmuyor. Satışını yapmak istediğiniz ürünleri ekleyin.'}
                </Typography>
                
                <Box mt={2} display="flex" justifyContent="center">
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/products/create')}
                  >
                    İlk Ürününüzü Ekleyin
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Product Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => {
          if (selectedProductId) {
            navigate(`/products/${selectedProductId}/edit`)
            handleCloseMenu()
          }
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Düzenle</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleToggleProductStatus}>
          <ListItemIcon>
            {productsData && productsData.data && productsData.data.products && 
              productsData.data.products.find((product: any) => product.id === selectedProductId)?.isActive ? 
              <CancelIcon fontSize="small" /> : 
              <CheckCircleIcon fontSize="small" color="success" />
            }
          </ListItemIcon>
          <ListItemText>
            {productsData && productsData.data && productsData.data.products && 
              productsData.data.products.find((product: any) => product.id === selectedProductId)?.isActive ? 
              'Pasif Yap' : 'Aktif Yap'
            }
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteProduct}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Sil</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default ProductsPage
