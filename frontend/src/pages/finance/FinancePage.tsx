import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  Paper,
  Divider,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material'
import { Add as AddIcon, TrendingUp, TrendingDown } from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import { financeApi } from '@/lib/api/financeApi'
import IncomesList from './components/IncomesList'
import ExpensesList from './components/ExpensesList'
import FinanceSummary from './components/FinanceSummary'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`finance-tabpanel-${index}`}
      aria-labelledby={`finance-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

function a11yProps(index: number) {
  return {
    id: `finance-tab-${index}`,
    'aria-controls': `finance-tabpanel-${index}`,
  }
}

const FinancePage: React.FC = () => {
  const navigate = useNavigate()
  const [tabValue, setTabValue] = useState(0)
  const [dateRange, setDateRange] = useState<{
    startDate: string
    endDate: string
  }>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  })

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  // Finans özeti sorgusu
  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    error: summaryError,
  } = useQuery({
    queryKey: ['financeSummary', dateRange],
    queryFn: () => financeApi.getSummary({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    }),
  })

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Finans Yönetimi
        </Typography>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/finance/income/create')}
            sx={{ mr: 2 }}
          >
            Gelir Ekle
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/finance/expense/create')}
          >
            Gider Ekle
          </Button>
        </Box>
      </Box>

      {/* Özet Kartları */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Toplam Gelir
              </Typography>
              <Box display="flex" alignItems="center">
                <TrendingUp color="success" sx={{ mr: 1 }} />
                <Typography variant="h5" component="div">
                  {isSummaryLoading ? (
                    <CircularProgress size={24} />
                  ) : summaryError ? (
                    'Hata'
                  ) : (
                    `${summaryData?.data?.totalIncome?.toFixed(2) || '0.00'} ₺`
                  )}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Toplam Gider
              </Typography>
              <Box display="flex" alignItems="center">
                <TrendingDown color="error" sx={{ mr: 1 }} />
                <Typography variant="h5" component="div">
                  {isSummaryLoading ? (
                    <CircularProgress size={24} />
                  ) : summaryError ? (
                    'Hata'
                  ) : (
                    `${summaryData?.data?.totalExpense?.toFixed(2) || '0.00'} ₺`
                  )}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Net Kar/Zarar
              </Typography>
              <Box display="flex" alignItems="center">
                {!isSummaryLoading && !summaryError && (
                  summaryData?.data?.netProfit >= 0 ? (
                    <TrendingUp color="success" sx={{ mr: 1 }} />
                  ) : (
                    <TrendingDown color="error" sx={{ mr: 1 }} />
                  )
                )}
                <Typography 
                  variant="h5" 
                  component="div"
                  color={!isSummaryLoading && !summaryError && summaryData?.data?.netProfit < 0 ? 'error' : 'inherit'}
                >
                  {isSummaryLoading ? (
                    <CircularProgress size={24} />
                  ) : summaryError ? (
                    'Hata'
                  ) : (
                    `${summaryData?.data?.netProfit?.toFixed(2) || '0.00'} ₺`
                  )}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Finans Özeti Grafiği */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" mb={2}>
          Finansal Özet
        </Typography>
        <FinanceSummary dateRange={dateRange} setDateRange={setDateRange} />
      </Paper>

      {/* Gelir/Gider Tabları */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="finance tabs">
            <Tab label="Gelirler" {...a11yProps(0)} />
            <Tab label="Giderler" {...a11yProps(1)} />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <IncomesList dateRange={dateRange} />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <ExpensesList dateRange={dateRange} />
        </TabPanel>
      </Paper>
    </Box>
  )
}

export default FinancePage
