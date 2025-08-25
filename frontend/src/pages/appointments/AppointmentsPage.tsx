import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material'
import {
  Add as AddIcon,
  Event as EventIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  PersonOff as PersonOffIcon,
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { appointmentsApi } from '@/lib/api'
import { format, isToday, isTomorrow, addDays, isAfter, isBefore, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'
import AppointmentFormModal from '@/components/appointments/AppointmentFormModal'

const AppointmentsPage: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Get appointments data
  const { data: appointmentsData, isLoading } = useQuery({
    queryKey: ['appointments', { page, limit: rowsPerPage, search: searchQuery }],
    queryFn: () => appointmentsApi.getAll({ page: page + 1, limit: rowsPerPage, search: searchQuery }),
  })

  // Update appointment status mutation
  const updateAppointmentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => appointmentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
    onError: (error: any) => {
      setError(error.message || 'Randevu güncellenirken bir hata oluştu')
    }
  })

  // Handle page change
  const handleChangePage = (_: unknown, newPage: number) => {
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

  // Handle status change
  const handleStatusChange = (id: string, status: string) => {
    updateAppointmentMutation.mutate({ id, data: { status } })
  }

  // Get status chip color
  const getStatusChip = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Chip label="Planlandı" color="primary" size="small" />
      case 'completed':
        return <Chip label="Tamamlandı" color="success" size="small" />
      case 'cancelled':
        return <Chip label="İptal Edildi" color="error" size="small" />
      case 'no-show':
        return <Chip label="Gelmedi" color="warning" size="small" />
      default:
        return <Chip label={status} color="default" size="small" />
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = parseISO(dateString)
    if (isToday(date)) {
      return `Bugün, ${format(date, 'HH:mm')}`
    } else if (isTomorrow(date)) {
      return `Yarın, ${format(date, 'HH:mm')}`
    } else {
      return format(date, 'dd MMM, HH:mm', { locale: tr })
    }
  }

  // Get upcoming appointments (next 7 days)
  const upcomingAppointments = appointmentsData?.data?.appointments?.filter((appointment: any) => {
    const appointmentDate = parseISO(appointment.startTime)
    return (
      appointment.status === 'scheduled' &&
      isAfter(appointmentDate, new Date()) &&
      isBefore(appointmentDate, addDays(new Date(), 7))
    )
  }) || []

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Randevular
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<EventIcon />}
            onClick={() => navigate('/appointments/calendar')}
          >
            Takvim Görünümü
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            color="primary"
            onClick={() => setIsModalOpen(true)}
          >
            Yeni Randevu
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Upcoming Appointments */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Yaklaşan Randevular (7 Gün)
        </Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {isLoading ? (
            <Grid item xs={12} display="flex" justifyContent="center">
              <CircularProgress />
            </Grid>
          ) : upcomingAppointments.length > 0 ? (
            upcomingAppointments.map((appointment: any) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={appointment.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 6 }
                  }}
                  onClick={() => navigate(`/appointments/${appointment.id}`)}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {formatDate(appointment.startTime)}
                      </Typography>
                      {getStatusChip(appointment.status)}
                    </Box>
                    <Typography variant="body1">
                      {appointment.customer.firstName} {appointment.customer.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Personel: {appointment.staff.firstName} {appointment.staff.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Hizmetler: {appointment.services.map((service: any) => service.name).join(', ')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Yaklaşan randevu bulunmuyor. Yeni randevu oluşturmak için yukarıdaki butonu kullanın.
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* All Appointments */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">
            Tüm Randevular
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

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tarih</TableCell>
                <TableCell>Müşteri</TableCell>
                <TableCell>Personel</TableCell>
                <TableCell>Hizmetler</TableCell>
                <TableCell>Durum</TableCell>
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
              ) : appointmentsData && appointmentsData.data && appointmentsData.data.appointments && appointmentsData.data.appointments.length > 0 ? (
                appointmentsData.data.appointments.map((appointment: any) => (
                  <TableRow key={appointment.id}>
                    <TableCell>{formatDate(appointment.startTime)}</TableCell>
                    <TableCell>
                      {appointment.customer.firstName} {appointment.customer.lastName}
                    </TableCell>
                    <TableCell>
                      {appointment.staff.firstName} {appointment.staff.lastName}
                    </TableCell>
                    <TableCell>
                      {appointment.services.map((service: any) => service.name).join(', ')}
                    </TableCell>
                    <TableCell>{getStatusChip(appointment.status)}</TableCell>
                    <TableCell align="right">
                      <Box display="flex" justifyContent="flex-end">
                        {appointment.status === 'scheduled' && (
                          <>
                            <Tooltip title="Tamamlandı">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStatusChange(appointment.id, 'completed')
                                }}
                              >
                                <CheckCircleIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="İptal Et">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStatusChange(appointment.id, 'cancelled')
                                }}
                              >
                                <CancelIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Gelmedi">
                              <IconButton
                                size="small"
                                color="warning"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStatusChange(appointment.id, 'no-show')
                                }}
                              >
                                <PersonOffIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        <Tooltip title="Düzenle">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/appointments/${appointment.id}/edit`)
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Randevu bulunamadı
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={appointmentsData?.data?.pagination?.total || 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Sayfa başına satır:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
        />
      </Paper>
      
      {/* Appointment Form Modal */}
      <AppointmentFormModal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </Box>
  )
}

export default AppointmentsPage
