import React from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  useTheme,
} from '@mui/material'
import {
  CalendarToday,
  People,
  AttachMoney,
  Group,
} from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/lib/api'

const DashboardPage: React.FC = () => {
  const theme = useTheme()

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardApi.getStats,
  })

  const statsCards = [
    {
      title: "Bugünkü Randevular",
      value: stats?.data?.todayAppointments || 0,
      icon: <CalendarToday />,
      color: theme.palette.primary.main,
    },
    {
      title: "Toplam Müşteri",
      value: stats?.data?.totalCustomers || 0,
      icon: <People />,
      color: theme.palette.success.main,
    },
    {
      title: "Aylık Gelir",
      value: `${stats?.data?.monthlyRevenue || 0} ₺`,
      icon: <AttachMoney />,
      color: theme.palette.warning.main,
    },
    {
      title: "Aktif Personel",
      value: stats?.data?.activeStaff || 0,
      icon: <Group />,
      color: theme.palette.info.main,
    },
  ]

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {statsCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {isLoading ? '-' : card.value}
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      backgroundColor: card.color,
                      width: 56,
                      height: 56,
                    }}
                  >
                    {card.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Additional dashboard content can be added here */}
      <Box mt={4}>
        <Typography variant="h6" mb={2}>
          Hoş geldiniz! 🎉
        </Typography>
        <Typography color="text.secondary">
          Saloony ile işletmenizi daha verimli yönetin. Sol menüden farklı bölümlere erişebilirsiniz.
        </Typography>
      </Box>
    </Box>
  )
}

export default DashboardPage
