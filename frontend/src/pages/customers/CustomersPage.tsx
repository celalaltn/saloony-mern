import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  CircularProgress,
  Alert,
  // Tooltip, - kullanılmıyor
  Card,
  CardContent,
  Grid,
  Avatar,
  Tabs,
  Tab,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Event as EventIcon,
  // Cake as CakeIcon, - kullanılmıyor
  // Person as PersonIcon, - kullanılmıyor
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customersApi } from '@/lib/api/customersApi'
import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'

const CustomersPage: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState(0)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)

  // Get customers data
  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers', { page, limit: rowsPerPage, search: searchQuery, filter: selectedTab }],
    queryFn: () => customersApi.getAll({ 
      page: page + 1, 
      limit: rowsPerPage, 
      search: searchQuery,
      isActive: true // Sadece aktif müşterileri getir
    }),
  })

  // Delete customer mutation
  const deleteCustomerMutation = useMutation({
    mutationFn: (id: string) => customersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      handleCloseMenu()
    },
    onError: (error: any) => {
      setError(error.message || 'Müşteri silinirken bir hata oluştu')
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

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue)
    setPage(0)
  }

  // Menu handlers
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, customerId: string) => {
    setAnchorEl(event.currentTarget)
    setSelectedCustomerId(customerId)
  }

  const handleCloseMenu = () => {
    setAnchorEl(null)
    setSelectedCustomerId(null)
  }

  // Delete customer handler
  const handleDeleteCustomer = () => {
    if (selectedCustomerId) {
      deleteCustomerMutation.mutate(selectedCustomerId)
    }
  }

  // Format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-'
    return format(parseISO(dateString), 'dd MMM yyyy', { locale: tr })
  }

  // Get gender display text
  const getGenderText = (gender: string) => {
    switch (gender) {
      case 'male':
        return 'Erkek'
      case 'female':
        return 'Kadın'
      case 'other':
        return 'Diğer'
      default:
        return '-'
    }
  }

  // Get notification status chip
  const getNotificationChip = (allowSMS: boolean, allowEmail: boolean) => {
    if (allowSMS && allowEmail) {
      return <Chip icon={<NotificationsIcon />} label="SMS & E-posta" size="small" color="success" />
    } else if (allowSMS) {
      return <Chip icon={<NotificationsIcon />} label="Sadece SMS" size="small" color="info" />
    } else if (allowEmail) {
      return <Chip icon={<NotificationsIcon />} label="Sadece E-posta" size="small" color="info" />
    } else {
      return <Chip icon={<NotificationsOffIcon />} label="Bildirim Kapalı" size="small" color="default" />
    }
  }

  // Get avatar text
  const getAvatarText = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  // Get avatar color
  const getAvatarColor = (id: string) => {
    const colors = ['#1976d2', '#2e7d32', '#d32f2f', '#ed6c02', '#9c27b0', '#0288d1']
    const index = id.charCodeAt(0) % colors.length
    return colors[index]
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Müşteriler
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          color="primary"
          onClick={() => navigate('/customers/create')}
        >
          Yeni Müşteri
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2} sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={selectedTab} onChange={handleTabChange}>
            <Tab label="Tüm Müşteriler" />
            <Tab label="Randevulu Müşteriler" />
            <Tab label="Yeni Eklenenler" />
          </Tabs>
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
          <Typography variant="h6">
            {selectedTab === 0 ? 'Tüm Müşteriler' : 
             selectedTab === 1 ? 'Randevulu Müşteriler' : 
             'Yeni Eklenen Müşteriler'}
          </Typography>
          <TextField
            placeholder="Ara..."
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

        <Divider />

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Müşteri</TableCell>
                <TableCell>İletişim</TableCell>
                <TableCell>Cinsiyet</TableCell>
                <TableCell>Doğum Tarihi</TableCell>
                <TableCell>Bildirimler</TableCell>
                <TableCell align="right">İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : customersData?.customers?.length > 0 ? (
                customersData.customers.map((customer: any) => (
                  <TableRow 
                    key={customer.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/customers/${customer.id}`)}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar 
                          sx={{ 
                            bgcolor: getAvatarColor(customer.id),
                            width: 40,
                            height: 40
                          }}
                        >
                          {getAvatarText(customer.firstName, customer.lastName)}
                        </Avatar>
                        <Box>
                          <Typography variant="body1">
                            {customer.firstName} {customer.lastName}
                          </Typography>
                          {customer.appointments?.length > 0 && (
                            <Typography variant="caption" color="text.secondary">
                              {customer.appointments.length} randevu
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" flexDirection="column" gap={0.5}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <PhoneIcon fontSize="small" color="action" />
                          <Typography variant="body2">{customer.phone}</Typography>
                        </Box>
                        {customer.email && (
                          <Box display="flex" alignItems="center" gap={1}>
                            <EmailIcon fontSize="small" color="action" />
                            <Typography variant="body2">{customer.email}</Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{getGenderText(customer.gender)}</TableCell>
                    <TableCell>{formatDate(customer.dateOfBirth)}</TableCell>
                    <TableCell>
                      {getNotificationChip(customer.communicationPreference === 'sms' || customer.communicationPreference === 'both', 
                                         customer.communicationPreference === 'email' || customer.communicationPreference === 'both')}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenMenu(e, customer.id)
                        }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    {searchQuery ? 'Arama kriterlerine uygun müşteri bulunamadı' : 'Henüz müşteri bulunmuyor'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={customersData?.total || 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Sayfa başına satır:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
        />
      </Paper>

      {/* Customer Stats */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Toplam Müşteri
              </Typography>
              <Typography variant="h3">
                {isLoading ? <CircularProgress size={24} /> : customersData?.data?.pagination?.total || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Randevulu Müşteriler
              </Typography>
              <Typography variant="h3">
                {isLoading ? <CircularProgress size={24} /> : customersData?.data?.stats?.withAppointments || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Bu Ay Eklenen
              </Typography>
              <Typography variant="h3">
                {isLoading ? <CircularProgress size={24} /> : customersData?.data?.stats?.addedThisMonth || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Customer Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => {
          if (selectedCustomerId) {
            navigate(`/customers/${selectedCustomerId}/edit`)
            handleCloseMenu()
          }
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Düzenle</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedCustomerId) {
            navigate(`/appointments/create`, { state: { customerId: selectedCustomerId } })
            handleCloseMenu()
          }
        }}>
          <ListItemIcon>
            <EventIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Randevu Oluştur</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteCustomer}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Sil</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default CustomersPage
