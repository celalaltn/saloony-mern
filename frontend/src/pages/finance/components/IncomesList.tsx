import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import { financeApi } from '@/lib/api/financeApi'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface IncomesListProps {
  dateRange: {
    startDate: string
    endDate: string
  }
}

const IncomesList: React.FC<IncomesListProps> = ({ dateRange }) => {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')

  // Gelir listesi sorgusu
  const {
    data: incomesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['incomes', page, rowsPerPage, searchTerm, dateRange],
    queryFn: () => financeApi.getIncomes({
      page: page + 1,
      limit: rowsPerPage,
      search: searchTerm,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    }),
  })

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
    setPage(0)
  }

  const handleEditIncome = (id: string) => {
    navigate(`/finance/income/edit/${id}`)
  }

  const handleDeleteIncome = (id: string) => {
    // Silme işlemi için onay ve API çağrısı burada yapılacak
    if (window.confirm('Bu gelir kaydını silmek istediğinizden emin misiniz?')) {
      // Silme işlemi burada yapılacak
    }
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error">
        Gelir kayıtları yüklenirken bir hata oluştu.
      </Alert>
    )
  }

  const incomes = incomesData?.data?.items || []
  const totalCount = incomesData?.data?.totalCount || 0

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Gelir Kayıtları</Typography>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Ara..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tarih</TableCell>
              <TableCell>Kategori</TableCell>
              <TableCell>Açıklama</TableCell>
              <TableCell align="right">Tutar (₺)</TableCell>
              <TableCell>Ödeme Yöntemi</TableCell>
              <TableCell align="center">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {incomes.length > 0 ? (
              incomes.map((income: any) => (
                <TableRow key={income._id}>
                  <TableCell>
                    {format(new Date(income.date), 'dd MMMM yyyy', { locale: tr })}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={income.category?.name || 'Kategori Yok'} 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                    />
                  </TableCell>
                  <TableCell>{income.description}</TableCell>
                  <TableCell align="right">{income.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    {income.paymentMethod === 'cash' && 'Nakit'}
                    {income.paymentMethod === 'creditCard' && 'Kredi Kartı'}
                    {income.paymentMethod === 'bankTransfer' && 'Banka Transferi'}
                    {income.paymentMethod === 'other' && 'Diğer'}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Düzenle">
                      <IconButton
                        size="small"
                        onClick={() => handleEditIncome(income._id)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Sil">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteIncome(income._id)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Kayıtlı gelir bulunamadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={totalCount}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Sayfa başına kayıt:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
      />
    </Box>
  )
}

export default IncomesList
