import React, { useState } from 'react'
import {
  Box,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { financeApi } from '@/lib/api/financeApi'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { tr } from 'date-fns/locale'

interface FinanceSummaryProps {
  dateRange: {
    startDate: string
    endDate: string
  }
  setDateRange: React.Dispatch<React.SetStateAction<{
    startDate: string
    endDate: string
  }>>
}

const FinanceSummary: React.FC<FinanceSummaryProps> = ({ dateRange, setDateRange }) => {
  // Finans özeti sorgusu
  const {
    data: summaryData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['financeSummaryChart', dateRange],
    queryFn: () => financeApi.getSummary({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      groupBy: 'month',
    }),
  })

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setDateRange(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleQuickDateFilter = (months: number) => {
    const today = new Date()
    const startDate = subMonths(today, months)
    
    setDateRange({
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(today, 'yyyy-MM-dd'),
    })
  }

  const handleThisMonth = () => {
    const today = new Date()
    const firstDayOfMonth = startOfMonth(today)
    
    setDateRange({
      startDate: format(firstDayOfMonth, 'yyyy-MM-dd'),
      endDate: format(today, 'yyyy-MM-dd'),
    })
  }

  const handleLastMonth = () => {
    const today = new Date()
    const lastMonth = subMonths(today, 1)
    const firstDayOfLastMonth = startOfMonth(lastMonth)
    const lastDayOfLastMonth = endOfMonth(lastMonth)
    
    setDateRange({
      startDate: format(firstDayOfLastMonth, 'yyyy-MM-dd'),
      endDate: format(lastDayOfLastMonth, 'yyyy-MM-dd'),
    })
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
        Finans özeti yüklenirken bir hata oluştu.
      </Alert>
    )
  }

  // Grafik verilerini hazırla
  const chartData = summaryData?.data?.monthlyData || []
  
  // Verileri grafik için formatlama
  const formattedChartData = chartData.map((item: any) => ({
    name: format(new Date(item.month), 'MMM yyyy', { locale: tr }),
    gelir: item.totalIncome,
    gider: item.totalExpense,
    kar: item.netProfit,
  }))

  return (
    <Box>
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={3}>
          <TextField
            label="Başlangıç Tarihi"
            type="date"
            name="startDate"
            value={dateRange.startDate}
            onChange={handleDateChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="Bitiş Tarihi"
            type="date"
            name="endDate"
            value={dateRange.endDate}
            onChange={handleDateChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Box display="flex" gap={1}>
            <Button 
              variant="outlined" 
              size="medium" 
              onClick={handleThisMonth}
              sx={{ flexGrow: 1 }}
            >
              Bu Ay
            </Button>
            <Button 
              variant="outlined" 
              size="medium" 
              onClick={handleLastMonth}
              sx={{ flexGrow: 1 }}
            >
              Geçen Ay
            </Button>
            <Button 
              variant="outlined" 
              size="medium" 
              onClick={() => handleQuickDateFilter(3)}
              sx={{ flexGrow: 1 }}
            >
              Son 3 Ay
            </Button>
            <Button 
              variant="outlined" 
              size="medium" 
              onClick={() => handleQuickDateFilter(6)}
              sx={{ flexGrow: 1 }}
            >
              Son 6 Ay
            </Button>
          </Box>
        </Grid>
      </Grid>

      <Box height={400}>
        {formattedChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={formattedChartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `${Number(value).toFixed(2)} ₺`} />
              <Legend />
              <Bar dataKey="gelir" name="Gelir" fill="#4caf50" />
              <Bar dataKey="gider" name="Gider" fill="#f44336" />
              <Bar dataKey="kar" name="Kar/Zarar" fill="#2196f3" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <Alert severity="info">
              Seçilen tarih aralığında veri bulunamadı.
            </Alert>
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default FinanceSummary
