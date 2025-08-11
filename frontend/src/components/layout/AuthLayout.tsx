import React from 'react'
import {
  Box,
  Container,
  Paper,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material'

interface AuthLayoutProps {
  children: React.ReactNode
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 3,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            p: isMobile ? 3 : 4,
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Box textAlign="center" mb={3}>
            <Typography
              variant="h3"
              fontWeight="bold"
              color="primary"
              gutterBottom
            >
              Saloony
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Güzellik salonu ve kuaför yönetim sistemi
            </Typography>
          </Box>
          {children}
        </Paper>
      </Container>
    </Box>
  )
}

export default AuthLayout
