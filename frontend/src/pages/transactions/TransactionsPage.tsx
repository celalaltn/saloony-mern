import React from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Tabs,
  Tab,
  Chip,
} from '@mui/material'
import { Add as AddIcon, TrendingUp, TrendingDown } from '@mui/icons-material'

const TransactionsPage: React.FC = () => {
  const [tabValue, setTabValue] = React.useState(0)

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Mali İşlemler
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          color="primary"
        >
          Yeni İşlem
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
                <Tab label="Tüm İşlemler" />
                <Tab label="Gelirler" />
                <Tab label="Giderler" />
              </Tabs>

              <Typography variant="h6" gutterBottom>
                İşlem Geçmişi
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Henüz işlem bulunmuyor. Gelir ve gider kayıtlarınızı buradan takip edebilirsiniz.
              </Typography>
              
              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  İşlem Türleri:
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  <Chip 
                    icon={<TrendingUp />} 
                    label="Randevu Geliri" 
                    color="success" 
                    variant="outlined" 
                  />
                  <Chip 
                    icon={<TrendingUp />} 
                    label="Paket Satışı" 
                    color="success" 
                    variant="outlined" 
                  />
                  <Chip 
                    icon={<TrendingDown />} 
                    label="Malzeme Gideri" 
                    color="error" 
                    variant="outlined" 
                  />
                  <Chip 
                    icon={<TrendingDown />} 
                    label="Kira" 
                    color="error" 
                    variant="outlined" 
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default TransactionsPage
