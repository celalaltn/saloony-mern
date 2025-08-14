import React from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material'

const SettingsPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" mb={3}>
        Ayarlar
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Bildirim Ayarları
              </Typography>
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Email bildirimleri"
              />
              <br />
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="SMS bildirimleri"
              />
              <br />
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Randevu hatırlatmaları"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Genel Ayarlar
              </Typography>
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Otomatik yedekleme"
              />
              <br />
              <FormControlLabel
                control={<Switch />}
                label="Karanlık tema"
              />
              <br />
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Sesli bildirimler"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default SettingsPage
