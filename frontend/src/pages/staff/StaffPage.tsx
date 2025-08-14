import React, { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Avatar,
  Chip,
  TextField,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tooltip,
} from '@mui/material'
import {
  Add as AddIcon,
  Person,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { staffApi, Staff } from '@/lib/api/staffApi'

const StaffPage: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [staffToDelete, setStaffToDelete] = useState<string | null>(null)

  // Fetch staff data
  const {
    data: staffData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['staff', page + 1, rowsPerPage, searchTerm],
    queryFn: () => staffApi.getStaff(page + 1, rowsPerPage, searchTerm),
  })

  // Delete staff mutation
  const deleteStaffMutation = useMutation({
    mutationFn: (id: string) => staffApi.deleteStaff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      setDeleteDialogOpen(false)
      setStaffToDelete(null)
    },
  })

  // Toggle staff active status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      staffApi.toggleActiveStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
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

  // Handle search
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
    setPage(0)
  }

  // Open delete confirmation dialog
  const handleDeleteClick = (id: string) => {
    setStaffToDelete(id)
    setDeleteDialogOpen(true)
  }

  // Confirm delete
  const handleConfirmDelete = () => {
    if (staffToDelete) {
      deleteStaffMutation.mutate(staffToDelete)
    }
  }

  // Toggle staff active status
  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    toggleStatusMutation.mutate({ id, isActive: !currentStatus })
  }

  // Get role display name
  const getRoleDisplayName = (role: string) => {
    const roles: Record<string, string> = {
      admin: 'Yönetici',
      manager: 'Müdür',
      stylist: 'Stilist',
      hairdresser: 'Kuaför',
      esthetician: 'Estetisyen',
      masseur: 'Masör',
      masseuse: 'Masöz',
      nailArtist: 'Tırnak Sanatçısı',
      receptionist: 'Resepsiyonist',
      staff: 'Personel',
    }
    return roles[role] || role
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Personel
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          color="primary"
          onClick={() => navigate('/staff/create')}
        >
          Yeni Personel
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <TextField
            variant="outlined"
            placeholder="Personel ara..."
            size="small"
            fullWidth
            value={searchTerm}
            onChange={handleSearch}
            InputProps={{
              startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
            }}
            sx={{ maxWidth: 500 }}
          />
          <Tooltip title="Yenile">
            <IconButton onClick={() => refetch()} sx={{ ml: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {isError ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {(error as Error)?.message || 'Personel listesi yüklenirken bir hata oluştu'}
          </Alert>
        ) : isLoading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : staffData?.data?.items?.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Personel Listesi
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Henüz personel bulunmuyor. Salon personelinizi buradan yönetebilirsiniz.
              </Typography>
              
              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Personel Rolleri:
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  <Chip 
                    avatar={<Avatar><Person /></Avatar>}
                    label="Kuaför" 
                    variant="outlined" 
                  />
                  <Chip 
                    avatar={<Avatar><Person /></Avatar>}
                    label="Estetisyen" 
                    variant="outlined" 
                  />
                  <Chip 
                    avatar={<Avatar><Person /></Avatar>}
                    label="Masöz" 
                    variant="outlined" 
                  />
                  <Chip 
                    avatar={<Avatar><Person /></Avatar>}
                    label="Nail Artist" 
                    variant="outlined" 
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Personel</TableCell>
                    <TableCell>İletişim</TableCell>
                    <TableCell>Rol</TableCell>
                    <TableCell>Uzmanlık</TableCell>
                    <TableCell>Durum</TableCell>
                    <TableCell align="right">İşlemler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {staffData?.data?.items?.map((staff: Staff) => (
                    <TableRow key={staff._id}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar sx={{ mr: 2 }}>
                            {staff.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography variant="body1">{staff.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{staff.email}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {staff.phone}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getRoleDisplayName(staff.role)}
                          size="small"
                          color={staff.role === 'admin' ? 'primary' : 'default'}
                          variant={staff.role === 'admin' ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                      <TableCell>{staff.specialization || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={staff.isActive ? 'Aktif' : 'Pasif'}
                          size="small"
                          color={staff.isActive ? 'success' : 'error'}
                          onClick={() => handleToggleStatus(staff._id, staff.isActive)}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Düzenle">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/staff/edit/${staff._id}`)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Sil">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(staff._id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={staffData?.data?.total || 0}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25]}
              labelRowsPerPage="Sayfa başına satır:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} / ${count !== -1 ? count : `${to}'den fazla`}`
              }
            />
          </>
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Personel Silme</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bu personeli silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>İptal</Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleteStaffMutation.isPending}
          >
            {deleteStaffMutation.isPending ? 'Siliniyor...' : 'Sil'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default StaffPage
