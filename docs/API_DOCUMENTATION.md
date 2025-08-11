# Saloony API Documentation

## Base URL
```
http://localhost:5000/api/v1
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Response Format
All API responses follow this format:
```json
{
  "success": boolean,
  "message": string,
  "data": object | array,
  "errors": array (optional)
}
```

## Authentication Endpoints

### POST /auth/register
Register a new company and admin user.

**Request Body:**
```json
{
  "companyName": "Güzel Salon",
  "businessType": "salon",
  "firstName": "Ahmet",
  "lastName": "Yılmaz",
  "email": "ahmet@guzelsalon.com",
  "password": "securepassword123",
  "phone": "+905551234567",
  "address": {
    "street": "Atatürk Caddesi No:123",
    "city": "İstanbul",
    "state": "İstanbul",
    "postalCode": "34000",
    "country": "Turkey"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Company and admin user created successfully",
  "data": {
    "user": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "firstName": "Ahmet",
      "lastName": "Yılmaz",
      "email": "ahmet@guzelsalon.com",
      "role": "admin"
    },
    "company": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "name": "Güzel Salon",
      "businessType": "salon",
      "subscription": {
        "plan": "trial",
        "status": "active",
        "trialEnd": "2024-02-15T10:30:00.000Z"
      }
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": "15m"
    }
  }
}
```

### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "ahmet@guzelsalon.com",
  "password": "securepassword123"
}
```

### POST /auth/refresh
Refresh access token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### GET /auth/me
Get current user information.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "firstName": "Ahmet",
      "lastName": "Yılmaz",
      "email": "ahmet@guzelsalon.com",
      "role": "admin",
      "permissions": {
        "appointments": { "view": true, "create": true, "edit": true, "delete": true },
        "customers": { "view": true, "create": true, "edit": true, "delete": true }
      }
    },
    "company": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "name": "Güzel Salon",
      "businessType": "salon"
    }
  }
}
```

## Appointment Endpoints

### GET /appointments
Get appointments with filtering and pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `status` (string): Filter by status (scheduled, confirmed, in_progress, completed, cancelled, no_show)
- `staff` (string): Filter by staff member ID
- `customer` (string): Filter by customer ID
- `startDate` (string): Filter from date (ISO 8601)
- `endDate` (string): Filter to date (ISO 8601)

**Example Request:**
```
GET /appointments?page=1&limit=10&status=scheduled&startDate=2024-01-15T00:00:00.000Z
```

**Response:**
```json
{
  "success": true,
  "data": {
    "appointments": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
        "customer": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
          "firstName": "Ayşe",
          "lastName": "Demir",
          "phone": "+905551234568"
        },
        "staff": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
          "firstName": "Mehmet",
          "lastName": "Kaya"
        },
        "services": [
          {
            "service": {
              "_id": "64f8a1b2c3d4e5f6a7b8c9d5",
              "name": "Saç Kesimi",
              "price": 150,
              "duration": 60,
              "category": "hair_cut"
            },
            "price": 150,
            "duration": 60,
            "isPackageSession": false
          }
        ],
        "dateTime": "2024-01-15T14:00:00.000Z",
        "endTime": "2024-01-15T15:00:00.000Z",
        "duration": 60,
        "status": "scheduled",
        "totalAmount": 150,
        "paidAmount": 0,
        "paymentStatus": "pending"
      }
    ],
    "pagination": {
      "current": 1,
      "pages": 5,
      "total": 47,
      "limit": 10
    }
  }
}
```

### POST /appointments
Create a new appointment.

**Request Body:**
```json
{
  "customer": "64f8a1b2c3d4e5f6a7b8c9d3",
  "staff": "64f8a1b2c3d4e5f6a7b8c9d4",
  "services": [
    {
      "service": "64f8a1b2c3d4e5f6a7b8c9d5",
      "packageInstanceId": null
    }
  ],
  "dateTime": "2024-01-15T14:00:00.000Z",
  "notes": {
    "customer": "Saç boyası alerjisi var"
  },
  "paymentMethod": "cash"
}
```

### GET /appointments/calendar
Get calendar view of appointments.

**Query Parameters:**
- `start` (string, required): Start date (ISO 8601)
- `end` (string, required): End date (ISO 8601)
- `staff` (string, optional): Filter by staff member ID

**Response:**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "64f8a1b2c3d4e5f6a7b8c9d2",
        "title": "Ayşe Demir",
        "start": "2024-01-15T14:00:00.000Z",
        "end": "2024-01-15T15:00:00.000Z",
        "status": "scheduled",
        "staff": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
          "firstName": "Mehmet",
          "lastName": "Kaya"
        },
        "services": "Saç Kesimi",
        "amount": 150
      }
    ]
  }
}
```

## Customer Endpoints

### GET /customers
Get customers with search and filtering.

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `search` (string): Search in name, email, phone
- `tags` (array): Filter by tags
- `isActive` (boolean): Filter by active status

### POST /customers
Create a new customer.

**Request Body:**
```json
{
  "firstName": "Ayşe",
  "lastName": "Demir",
  "phone": "+905551234568",
  "email": "ayse@example.com",
  "dateOfBirth": "1990-05-15T00:00:00.000Z",
  "gender": "female",
  "address": {
    "street": "İnönü Caddesi No:45",
    "city": "İstanbul",
    "postalCode": "34100"
  },
  "notes": "Saç boyası alerjisi var",
  "preferences": {
    "preferredStaff": ["64f8a1b2c3d4e5f6a7b8c9d4"],
    "allergies": ["hair_dye"],
    "communicationPreference": "both"
  },
  "tags": ["VIP", "Regular"]
}
```

### GET /customers/:id/appointments
Get customer's appointment history.

### POST /customers/:id/notes
Add a note to customer.

**Request Body:**
```json
{
  "note": "Müşteri randevusunu 30 dakika erken geldi"
}
```

## Service Endpoints

### GET /services
Get all services.

**Query Parameters:**
- `category` (string): Filter by category
- `isActive` (boolean): Filter by active status
- `search` (string): Search in name and description

**Response:**
```json
{
  "success": true,
  "data": {
    "services": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d5",
        "name": "Saç Kesimi",
        "description": "Profesyonel saç kesimi hizmeti",
        "category": "hair_cut",
        "price": 150,
        "duration": 60,
        "staff": [
          {
            "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
            "firstName": "Mehmet",
            "lastName": "Kaya"
          }
        ],
        "isActive": true,
        "loyaltyPoints": 15
      }
    ]
  }
}
```

### POST /services
Create a new service.

**Request Body:**
```json
{
  "name": "Nail Art",
  "description": "Özel nail art tasarımları",
  "category": "nail_art",
  "price": 200,
  "duration": 90,
  "staff": ["64f8a1b2c3d4e5f6a7b8c9d4"],
  "requirements": {
    "preparation": "Tırnaklarınızı temiz getirin",
    "aftercare": "24 saat su ile temasından kaçının"
  },
  "loyaltyPoints": 20
}
```

## Dashboard Endpoints

### GET /dashboard/stats
Get dashboard statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "todayAppointments": 12,
    "monthlyRevenue": 15750,
    "totalCustomers": 234,
    "activeStaff": 5
  }
}
```

## Transaction Endpoints

### GET /transactions
Get financial transactions.

**Query Parameters:**
- `page`, `limit`: Pagination
- `type`: income or expense
- `category`: Transaction category
- `startDate`, `endDate`: Date range

### POST /transactions
Create a new transaction.

**Request Body:**
```json
{
  "type": "expense",
  "category": "supplies",
  "amount": 500,
  "description": "Saç bakım ürünleri alımı",
  "date": "2024-01-15T10:00:00.000Z",
  "paymentMethod": "card",
  "reference": {
    "invoiceNumber": "INV-2024-001"
  },
  "tags": ["monthly", "supplies"],
  "notes": "L'Oreal ürünleri"
}
```

## Webhook Endpoints

### POST /webhooks/stripe
Stripe webhook for payment events.

**Headers:**
- `stripe-signature`: Webhook signature

### POST /webhooks/twilio/sms-status
Twilio webhook for SMS delivery status.

### POST /webhooks/sendgrid/events
SendGrid webhook for email events.

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation errors",
  "errors": [
    {
      "field": "email",
      "message": "Please enter a valid email"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Permission denied. Cannot create appointments."
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Server error"
}
```

## Rate Limiting
- 100 requests per 15 minutes per IP address
- Applies to all `/api/` endpoints

## Background Jobs

The system uses BullMQ for background job processing:

### Appointment Reminders
- Automatically sent 24 hours before appointment
- Sent via email and/or SMS based on customer preferences

### Package Expiry Warnings
- Sent 7 days before package expiration
- Only for packages with remaining sessions

### Status Updates
- Automatic appointment status updates
- Package expiry checks

### Manual Job Triggers
You can manually trigger jobs through the API (admin only):

```javascript
// Queue appointment reminder
await jobService.queueAppointmentReminder(appointment, delayInMs);

// Queue appointment confirmation
await jobService.queueAppointmentConfirmation(appointment);

// Queue email
await jobService.queueEmail(emailData);

// Queue SMS
await jobService.queueSMS(smsData);
```
