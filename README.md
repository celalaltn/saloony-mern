# Saloony - Beauty Salon Appointment Management System

A comprehensive MERN stack appointment management system for beauty salons and barbershops.

## Features

- **Appointment Management**: Schedule appointments with customer notes, various services (nail-art, etc.)
- **Income/Expense Tracking**: Financial management for salon operations
- **Staff Management**: Role-based access control (Admin/Staff)
- **Package/Session Tracking**: Track multi-session packages (e.g., 10-session laser treatments)
- **Customer Management**: Comprehensive customer database
- **Notifications**: Email and SMS notifications for appointments
- **Subscription Model**: 10₺/month per company
- **Real-time Updates**: Optional Socket.IO integration

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** authentication with refresh tokens
- **bcrypt** for password hashing
- **Stripe** for payment processing
- **Twilio** for SMS notifications
- **SendGrid** for email notifications
- **BullMQ + Redis** for background jobs
- **Socket.IO** for real-time features (optional)

### Frontend
- **React** with TypeScript
- **React Query** for state management
- **React Hook Form + Yup** for form validation
- **Material UI** for UI components
- **MUI DataGrid** for data tables
- **Recharts** for analytics

### Mobile
- **Expo/React Native** (future implementation)

## Database Schema

- **Company**: Salon/barbershop information
- **User**: Admin and staff users
- **Customer**: Client information
- **Service**: Available services
- **Package**: Service packages
- **PackageInstance**: Individual package purchases
- **Appointment**: Appointment bookings
- **Transaction**: Financial transactions
- **NotificationLog**: Notification history
- **Attendance**: Staff attendance tracking

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB
- Redis
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd saloony-mern
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Install frontend dependencies
```bash
cd ../frontend
npm install
```

4. Set up environment variables (see .env.example files)

5. Start development servers
```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm start
```

## Project Structure

```
saloony-mern/
├── backend/                 # Express.js API server
├── frontend/               # React application
├── mobile/                 # React Native app (future)
├── docs/                   # Documentation
└── docker/                 # Docker configurations
```

## License

MIT License
