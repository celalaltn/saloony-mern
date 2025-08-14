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
} from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import { financeApi } from '@/lib/api/financeApi'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface ExpensesListProps {
  dateRange: {
    startDate: string
    endDate: string
  }
}

const ExpensesList: React.FC<ExpensesListProps> = ({ dateRange }) => {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')

  // Gider listesi sorgusu
  const {
    data: expensesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['expenses', page, rowsPerPage, searchTerm, dateRange],
    queryFn: () => financeApi.getExpenses({
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

  const handleEditExpense = (id: string) => {
    navigate(`/finance/expense/edit/${id}`)
  }

  const handleDeleteExpense = (id: string) => {
    // Silme işlemi için onay ve API çağrısı burada yapılacak
    if (window.confirm('Bu gider kaydını silmek istediğinizden emin misiniz?')) {
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
        Gider kayıtları yüklenirken bir hata oluştu.
      </Alert>
    )
  }

  const expenses = expensesData?.data?.items || []
  const totalCount = expensesData?.data?.totalCount || 0

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Gider Kayıtları</Typography>
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
            {expenses.length > 0 ? (
              expenses.map((expense: any) => (
                <TableRow key={expense._id}>
                  <TableCell>
                    {format(new Date(expense.date), 'dd MMMM yyyy', { locale: tr })}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={expense.category?.name || 'Kategori Yok'} 
                      size="small" 
                      color="error" 
                      variant="outlined" 
                    />
                  </TableCell>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell align="right">{expense.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    {expense.paymentMethod === 'cash' && 'Nakit'}
                    {expense.paymentMethod === 'creditCard' && 'Kredi Kartı'}
                    {expense.paymentMethod === 'bankTransfer' && 'Banka Transferi'}
                    {expense.paymentMethod === 'other' && 'Diğer'}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Düzenle">
                      <IconButton
                        size="small"
                        onClick={() => handleEditExpense(expense._id)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Sil">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteExpense(expense._id)}
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
                  Kayıtlı gider bulunamadı.
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

export default ExpensesList
