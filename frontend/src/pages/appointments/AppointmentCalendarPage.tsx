import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import {
  Add as AddIcon,
  Event as EventIcon,
  Today as TodayIcon,
  NavigateBefore,
  NavigateNext,
  Refresh,
} from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import { appointmentsApi, usersApi } from '@/lib/api'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns'
import { tr } from 'date-fns/locale'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import trLocale from '@fullcalendar/core/locales/tr'

const AppointmentCalendarPage: React.FC = () => {
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedStaff, setSelectedStaff] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)
  
  // Get staff data
  const { data: staffData, isLoading: isLoadingStaff } = useQuery({
    queryKey: ['staff'],
    queryFn: () => usersApi.getAll(),
  })
  
  // Get calendar data
  const { data: calendarData, isLoading: isLoadingCalendar, refetch: refetchCalendar } = useQuery({
    queryKey: ['appointments', 'calendar', {
      start: startOfMonth(currentDate).toISOString(),
      end: endOfMonth(currentDate).toISOString(),
      staff: selectedStaff !== 'all' ? selectedStaff : undefined
    }],
    queryFn: () => appointmentsApi.getCalendar({
      start: startOfMonth(currentDate).toISOString(),
      end: endOfMonth(currentDate).toISOString(),
      staff: selectedStaff !== 'all' ? selectedStaff : undefined
    }),
  })
  
  const handleDateChange = (date: Date) => {
    setCurrentDate(date)
  }
  
  const handleStaffChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedStaff(event.target.value as string)
  }
  
  const handleEventClick = (info: any) => {
    navigate(`/appointments/${info.event.id}`)
  }
  
  const handleDateClick = (info: any) => {
    // Create a new appointment on the clicked date
    const clickedDate = new Date(info.dateStr)
    // Set hours to current time
    clickedDate.setHours(new Date().getHours())
    clickedDate.setMinutes(new Date().getMinutes())
    
    navigate('/appointments/create', { state: { startDate: clickedDate } })
  }
  
  const isLoading = isLoadingStaff || isLoadingCalendar
  
  // Transform appointments data for FullCalendar
  const events = calendarData?.data?.appointments?.map((appointment: any) => ({
    id: appointment.id,
    title: `${appointment.customer.firstName} ${appointment.customer.lastName}`,
    start: new Date(appointment.startTime),
    end: new Date(appointment.endTime),
    backgroundColor: getStatusColor(appointment.status),
    borderColor: getStatusColor(appointment.status),
    extendedProps: {
      customer: appointment.customer,
      staff: appointment.staff,
      services: appointment.services,
      status: appointment.status,
    }
  })) || []
  
  function getStatusColor(status: string): string {
    switch (status) {
      case 'scheduled':
        return '#1976d2' // blue
      case 'completed':
        return '#2e7d32' // green
      case 'cancelled':
        return '#d32f2f' // red
      case 'no-show':
        return '#ed6c02' // orange
      default:
        return '#757575' // grey
    }
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Randevu Takvimi
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<EventIcon />}
            onClick={() => navigate('/appointments')}
          >
            Liste Görünümü
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            color="primary"
            onClick={() => navigate('/appointments/create')}
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

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton onClick={() => handleDateChange(subMonths(currentDate, 1))}>
              <NavigateBefore />
            </IconButton>
            <Typography variant="h6">
              {format(currentDate, 'MMMM yyyy', { locale: tr })}
            </Typography>
            <IconButton onClick={() => handleDateChange(addMonths(currentDate, 1))}>
              <NavigateNext />
            </IconButton>
            <Tooltip title="Bugüne Git">
              <IconButton onClick={() => handleDateChange(new Date())}>
                <TodayIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Yenile">
              <IconButton onClick={() => refetchCalendar()}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
          
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Personel</InputLabel>
            <Select
              value={selectedStaff}
              onChange={handleStaffChange}
              label="Personel"
            >
              <MenuItem value="all">Tüm Personel</MenuItem>
              {staffData?.data?.users?.map((staff: any) => (
                <MenuItem key={staff.id} value={staff.id}>
                  {staff.firstName} {staff.lastName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="400px">
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ height: 'calc(100vh - 300px)', minHeight: '500px' }}>
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              locale={trLocale}
              events={events}
              eventClick={handleEventClick}
              dateClick={handleDateClick}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              nowIndicator={true}
              businessHours={{
                daysOfWeek: [1, 2, 3, 4, 5, 6], // Monday - Saturday
                startTime: '09:00',
                endTime: '19:00',
              }}
              slotMinTime="08:00:00"
              slotMaxTime="21:00:00"
              allDaySlot={false}
              height="100%"
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }}
            />
          </Box>
        )}
      </Paper>
      
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Randevu Durumları
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          <Chip 
            label="Planlandı" 
            sx={{ bgcolor: getStatusColor('scheduled'), color: 'white' }} 
          />
          <Chip 
            label="Tamamlandı" 
            sx={{ bgcolor: getStatusColor('completed'), color: 'white' }} 
          />
          <Chip 
            label="İptal Edildi" 
            sx={{ bgcolor: getStatusColor('cancelled'), color: 'white' }} 
          />
          <Chip 
            label="Gelmedi" 
            sx={{ bgcolor: getStatusColor('no-show'), color: 'white' }} 
          />
        </Box>
      </Paper>
    </Box>
  )
}

export default AppointmentCalendarPage
