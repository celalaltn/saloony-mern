# Example API Endpoints and Usage

This document provides practical examples of how to use the Saloony API endpoints with real-world scenarios.

## Authentication Flow Example

### 1. Company Registration
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Güzellik Merkezi Ayşe",
    "businessType": "salon",
    "firstName": "Ayşe",
    "lastName": "Yılmaz",
    "email": "ayse@guzellikmerkezi.com",
    "password": "SecurePass123!",
    "phone": "+905551234567",
    "address": {
      "street": "Bağdat Caddesi No:123",
      "city": "İstanbul",
      "state": "İstanbul",
      "postalCode": "34728",
      "country": "Turkey"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Company and admin user created successfully",
  "data": {
    "user": {
      "id": "65a1b2c3d4e5f6789abcdef0",
      "firstName": "Ayşe",
      "lastName": "Yılmaz",
      "email": "ayse@guzellikmerkezi.com",
      "role": "admin"
    },
    "company": {
      "id": "65a1b2c3d4e5f6789abcdef1",
      "name": "Güzellik Merkezi Ayşe",
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

### 2. Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ayse@guzellikmerkezi.com",
    "password": "SecurePass123!"
  }'
```

## Service Management Examples

### 1. Create Services
```bash
# Create Hair Cut Service
curl -X POST http://localhost:5000/api/v1/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Saç Kesimi",
    "description": "Profesyonel saç kesimi ve şekillendirme",
    "category": "hair_cut",
    "price": 150,
    "duration": 60,
    "staff": ["65a1b2c3d4e5f6789abcdef2"],
    "requirements": {
      "preparation": "Saçlarınızı yıkanmış olarak gelin",
      "aftercare": "24 saat boyama yapmayın"
    },
    "loyaltyPoints": 15
  }'

# Create Nail Art Service
curl -X POST http://localhost:5000/api/v1/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Nail Art Tasarım",
    "description": "Özel nail art tasarımları ve süslemeler",
    "category": "nail_art",
    "price": 200,
    "duration": 90,
    "staff": ["65a1b2c3d4e5f6789abcdef3"],
    "requirements": {
      "preparation": "Tırnaklarınızı temiz ve kısa getirin",
      "aftercare": "İlk 2 saat su ile temasından kaçının"
    },
    "loyaltyPoints": 20
  }'

# Create Massage Service
curl -X POST http://localhost:5000/api/v1/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Rahatlatıcı Masaj",
    "description": "45 dakikalık rahatlatıcı vücut masajı",
    "category": "massage",
    "price": 300,
    "duration": 45,
    "staff": ["65a1b2c3d4e5f6789abcdef4"],
    "requirements": {
      "preparation": "Rahat kıyafetler giyin",
      "aftercare": "Bol su için"
    },
    "loyaltyPoints": 30
  }'
```

## Customer Management Examples

### 1. Create Customer
```bash
curl -X POST http://localhost:5000/api/v1/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "firstName": "Zeynep",
    "lastName": "Kaya",
    "phone": "+905551234568",
    "email": "zeynep@example.com",
    "dateOfBirth": "1992-08-15T00:00:00.000Z",
    "gender": "female",
    "address": {
      "street": "Cumhuriyet Caddesi No:67",
      "city": "İstanbul",
      "postalCode": "34367"
    },
    "notes": "Saç boyası alerjisi var. Organik ürün tercih ediyor.",
    "preferences": {
      "preferredStaff": ["65a1b2c3d4e5f6789abcdef2"],
      "allergies": ["hair_dye", "ammonia"],
      "communicationPreference": "both",
      "appointmentReminders": true
    },
    "tags": ["VIP", "Organik Ürün"]
  }'
```

### 2. Add Customer Note
```bash
curl -X POST http://localhost:5000/api/v1/customers/65a1b2c3d4e5f6789abcdef5/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "note": "Müşteri yeni saç renginden çok memnun kaldı. Bir sonraki randevuda aynı tonu istiyor."
  }'
```

## Staff Management Examples

### 1. Create Staff Member
```bash
curl -X POST http://localhost:5000/api/v1/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "firstName": "Mehmet",
    "lastName": "Demir",
    "email": "mehmet@guzellikmerkezi.com",
    "password": "StaffPass123!",
    "phone": "+905551234569",
    "role": "staff",
    "permissions": {
      "appointments": {
        "view": true,
        "create": true,
        "edit": true,
        "delete": false
      },
      "customers": {
        "view": true,
        "create": true,
        "edit": true,
        "delete": false
      },
      "services": {
        "view": true,
        "create": false,
        "edit": false,
        "delete": false
      }
    },
    "specialties": ["hair_cut", "hair_color"],
    "workingHours": {
      "monday": { "start": "09:00", "end": "18:00" },
      "tuesday": { "start": "09:00", "end": "18:00" },
      "wednesday": { "start": "09:00", "end": "18:00" },
      "thursday": { "start": "09:00", "end": "18:00" },
      "friday": { "start": "09:00", "end": "18:00" },
      "saturday": { "start": "10:00", "end": "16:00" },
      "sunday": { "start": null, "end": null }
    }
  }'
```

## Appointment Management Examples

### 1. Create Appointment
```bash
curl -X POST http://localhost:5000/api/v1/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "customer": "65a1b2c3d4e5f6789abcdef5",
    "staff": "65a1b2c3d4e5f6789abcdef2",
    "services": [
      {
        "service": "65a1b2c3d4e5f6789abcdef6",
        "packageInstanceId": null
      },
      {
        "service": "65a1b2c3d4e5f6789abcdef7",
        "packageInstanceId": null
      }
    ],
    "dateTime": "2024-01-20T14:00:00.000Z",
    "notes": {
      "customer": "Saç boyası alerjisi var - organik ürün kullan",
      "staff": "Müşteri hassas ciltli, dikkatli ol"
    },
    "paymentMethod": "card",
    "reminders": {
      "email": true,
      "sms": true,
      "reminderTime": 24
    }
  }'
```

### 2. Update Appointment Status
```bash
curl -X PATCH http://localhost:5000/api/v1/appointments/65a1b2c3d4e5f6789abcdef8 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "status": "in_progress",
    "notes": {
      "staff": "Müşteri 10 dakika geç geldi, işlem başladı"
    }
  }'
```

### 3. Complete Appointment with Payment
```bash
curl -X PATCH http://localhost:5000/api/v1/appointments/65a1b2c3d4e5f6789abcdef8 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "status": "completed",
    "paidAmount": 350,
    "paymentStatus": "paid",
    "paymentMethod": "card",
    "notes": {
      "staff": "İşlem başarıyla tamamlandı. Müşteri sonuçtan memnun."
    },
    "feedback": {
      "rating": 5,
      "comment": "Çok memnun kaldım, teşekkürler!"
    }
  }'
```

### 4. Get Calendar View
```bash
curl -X GET "http://localhost:5000/api/v1/appointments/calendar?start=2024-01-15T00:00:00.000Z&end=2024-01-21T23:59:59.000Z&staff=65a1b2c3d4e5f6789abcdef2" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Package Management Examples

### 1. Create Package
```bash
curl -X POST http://localhost:5000/api/v1/packages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Güzellik Paketi - 10 Seans",
    "description": "10 seanslık kapsamlı güzellik bakım paketi",
    "services": [
      {
        "service": "65a1b2c3d4e5f6789abcdef6",
        "sessionsIncluded": 5
      },
      {
        "service": "65a1b2c3d4e5f6789abcdef7",
        "sessionsIncluded": 3
      },
      {
        "service": "65a1b2c3d4e5f6789abcdef9",
        "sessionsIncluded": 2
      }
    ],
    "totalSessions": 10,
    "originalPrice": 2000,
    "packagePrice": 1600,
    "validityDays": 180,
    "isActive": true,
    "description": "6 aylık süre içinde kullanılabilir"
  }'
```

### 2. Purchase Package for Customer
```bash
curl -X POST http://localhost:5000/api/v1/customers/65a1b2c3d4e5f6789abcdef5/packages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "package": "65a1b2c3d4e5f6789abcdefa",
    "paymentMethod": "card",
    "paidAmount": 1600,
    "notes": "Müşteri 6 ay içinde kullanacak"
  }'
```

### 3. Use Package Session in Appointment
```bash
curl -X POST http://localhost:5000/api/v1/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "customer": "65a1b2c3d4e5f6789abcdef5",
    "staff": "65a1b2c3d4e5f6789abcdef2",
    "services": [
      {
        "service": "65a1b2c3d4e5f6789abcdef6",
        "packageInstanceId": "65a1b2c3d4e5f6789abcdefb"
      }
    ],
    "dateTime": "2024-01-22T15:00:00.000Z",
    "paymentMethod": "package",
    "notes": {
      "staff": "Paket seansı kullanılıyor - 4 seans kaldı"
    }
  }'
```

## Financial Management Examples

### 1. Record Income Transaction
```bash
curl -X POST http://localhost:5000/api/v1/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "type": "income",
    "category": "service",
    "amount": 350,
    "description": "Saç kesimi ve nail art - Zeynep Kaya",
    "date": "2024-01-20T16:30:00.000Z",
    "paymentMethod": "card",
    "reference": {
      "appointmentId": "65a1b2c3d4e5f6789abcdef8",
      "customerId": "65a1b2c3d4e5f6789abcdef5"
    },
    "tags": ["appointment", "completed"],
    "notes": "Müşteri %10 bahşiş verdi"
  }'
```

### 2. Record Expense Transaction
```bash
curl -X POST http://localhost:5000/api/v1/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "type": "expense",
    "category": "supplies",
    "amount": 750,
    "description": "Saç bakım ürünleri ve nail art malzemeleri",
    "date": "2024-01-15T11:00:00.000Z",
    "paymentMethod": "card",
    "reference": {
      "invoiceNumber": "INV-2024-001",
      "supplier": "Güzellik Ürünleri A.Ş."
    },
    "tags": ["monthly", "supplies", "hair_products", "nail_supplies"],
    "notes": "L'Oreal ve OPI ürünleri alındı",
    "isRecurring": true,
    "recurringInfo": {
      "frequency": "monthly",
      "nextDate": "2024-02-15T11:00:00.000Z"
    }
  }'
```

### 3. Get Financial Summary
```bash
curl -X GET "http://localhost:5000/api/v1/transactions?startDate=2024-01-01&endDate=2024-01-31&type=income" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Dashboard and Analytics Examples

### 1. Get Dashboard Stats
```bash
curl -X GET http://localhost:5000/api/v1/dashboard/stats \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "todayAppointments": 8,
    "monthlyRevenue": 12450,
    "totalCustomers": 156,
    "activeStaff": 3,
    "pendingAppointments": 5,
    "completedAppointments": 3,
    "packagesSold": 2,
    "averageRating": 4.8
  }
}
```

## Notification Examples

### 1. Manual Appointment Reminder
```bash
curl -X POST http://localhost:5000/api/v1/notifications/appointment-reminder \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "appointmentId": "65a1b2c3d4e5f6789abcdef8",
    "type": "both",
    "customMessage": "Yarınki randevunuzu unutmayın! Saçlarınızı yıkanmış olarak gelin."
  }'
```

### 2. Send Package Expiry Warning
```bash
curl -X POST http://localhost:5000/api/v1/notifications/package-expiry \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "packageInstanceId": "65a1b2c3d4e5f6789abcdefb",
    "daysUntilExpiry": 7
  }'
```

## Background Job Examples

### 1. Queue Custom Email
```javascript
// Example of queuing a custom email job
const jobService = require('./services/jobService');

await jobService.queueEmail({
  to: 'zeynep@example.com',
  subject: 'Özel İndirim Fırsatı!',
  template: 'special_offer',
  data: {
    customerName: 'Zeynep',
    discountPercent: 20,
    validUntil: '2024-02-01',
    services: ['Saç Kesimi', 'Nail Art']
  }
});
```

### 2. Queue SMS Notification
```javascript
// Example of queuing an SMS job
await jobService.queueSMS({
  to: '+905551234568',
  message: 'Merhaba Zeynep! Yarınki 14:00 randevunuz için hazır mısınız? Saçlarınızı yıkanmış olarak gelin. Güzellik Merkezi Ayşe',
  appointmentId: '65a1b2c3d4e5f6789abcdef8'
});
```

## Webhook Examples

### 1. Stripe Payment Success Webhook
```json
{
  "id": "evt_1234567890",
  "object": "event",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_1234567890",
      "amount": 160000,
      "currency": "try",
      "metadata": {
        "companyId": "65a1b2c3d4e5f6789abcdef1",
        "customerId": "65a1b2c3d4e5f6789abcdef5",
        "packageInstanceId": "65a1b2c3d4e5f6789abcdefb"
      }
    }
  }
}
```

### 2. Twilio SMS Status Webhook
```json
{
  "MessageSid": "SM1234567890",
  "MessageStatus": "delivered",
  "To": "+905551234568",
  "From": "+1234567890",
  "Body": "Merhaba Zeynep! Yarınki randevunuz...",
  "AccountSid": "AC1234567890"
}
```

## Error Handling Examples

### 1. Validation Error Response
```json
{
  "success": false,
  "message": "Validation errors",
  "errors": [
    {
      "field": "phone",
      "message": "Please enter a valid Turkish phone number"
    },
    {
      "field": "dateTime",
      "message": "Appointment time must be in the future"
    }
  ]
}
```

### 2. Authorization Error Response
```json
{
  "success": false,
  "message": "Permission denied. Cannot delete appointments."
}
```

### 3. Business Logic Error Response
```json
{
  "success": false,
  "message": "Appointment conflict detected",
  "details": {
    "conflictingAppointment": {
      "id": "65a1b2c3d4e5f6789abcdefc",
      "customer": "Ayşe Demir",
      "time": "2024-01-20T14:00:00.000Z"
    },
    "suggestedTimes": [
      "2024-01-20T15:00:00.000Z",
      "2024-01-20T16:00:00.000Z"
    ]
  }
}
```

## Testing Examples

### 1. Test Authentication Flow
```bash
#!/bin/bash

# Register new company
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Test Salon",
    "businessType": "salon",
    "firstName": "Test",
    "lastName": "User",
    "email": "test@testsalon.com",
    "password": "TestPass123!",
    "phone": "+905551234567"
  }')

# Extract access token
ACCESS_TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.data.tokens.accessToken')

# Test protected endpoint
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 2. Load Testing with Multiple Appointments
```bash
#!/bin/bash

ACCESS_TOKEN="your_access_token_here"

for i in {1..10}; do
  curl -X POST http://localhost:5000/api/v1/appointments \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -d "{
      \"customer\": \"65a1b2c3d4e5f6789abcdef5\",
      \"staff\": \"65a1b2c3d4e5f6789abcdef2\",
      \"services\": [{
        \"service\": \"65a1b2c3d4e5f6789abcdef6\"
      }],
      \"dateTime\": \"2024-01-$(printf %02d $((20 + i)))T$((10 + i)):00:00.000Z\"
    }" &
done

wait
echo "All appointments created!"
```

These examples demonstrate real-world usage scenarios for the Saloony API, showing how beauty salons and barbershops can integrate with the system to manage their daily operations effectively.
