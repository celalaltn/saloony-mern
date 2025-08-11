# Saloony Proje Kurulum Rehberi

## 🚀 Hızlı Başlangıç

### 1. Gereksinimler
- Node.js 18+ ve npm
- Git
- MongoDB (yerel veya Atlas)
- Redis (yerel veya cloud)

### 2. Projeyi İndirin ve Bağımlılıkları Kurun

```bash
# Backend bağımlılıklarını kurun
cd backend
npm install

# Frontend bağımlılıklarını kurun  
cd ../frontend
npm install
```

## 📊 Database Kurulumu

### Seçenek 1: MongoDB Atlas (Önerilen - Ücretsiz)

1. **MongoDB Atlas hesabı oluşturun**: https://www.mongodb.com/atlas
2. **Yeni cluster oluşturun** (M0 Sandbox - ücretsiz)
3. **Database kullanıcısı oluşturun**:
   - Database Access → Add New Database User
   - Username: `saloony_user`
   - Password: güçlü bir şifre seçin
4. **IP adresinizi whitelist'e ekleyin**:
   - Network Access → Add IP Address
   - "Allow access from anywhere" (0.0.0.0/0) seçin
5. **Connection string'i alın**:
   - Clusters → Connect → Connect your application
   - Node.js driver seçin
   - Connection string'i kopyalayın

### Seçenek 2: Yerel MongoDB

```bash
# Windows için MongoDB Community Edition
# https://www.mongodb.com/try/download/community adresinden indirin

# MongoDB servisini başlatın
net start MongoDB

# Veya MongoDB Compass kullanın (GUI)
# https://www.mongodb.com/products/compass
```

## 🔧 Environment Variables Kurulumu

### Backend Environment (.env)

`backend` klasöründe `.env` dosyası oluşturun:

```bash
# Database - MongoDB Atlas kullanıyorsanız
MONGODB_URI=mongodb+srv://saloony_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/saloony?retryWrites=true&w=majority

# Database - Yerel MongoDB kullanıyorsanız
# MONGODB_URI=mongodb://localhost:27017/saloony

# JWT Secrets (güçlü şifreler kullanın)
JWT_ACCESS_SECRET=super-secure-access-secret-key-change-this-in-production
JWT_REFRESH_SECRET=super-secure-refresh-secret-key-change-this-in-production
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Redis - Yerel Redis
REDIS_URL=redis://localhost:6379
# Redis şifresi varsa
# REDIS_PASSWORD=your-redis-password

# Email (SendGrid) - İsteğe bağlı, test için boş bırakabilirsiniz
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=test@saloony.com
SENDGRID_FROM_NAME=Saloony Test

# SMS (Twilio) - İsteğe bağlı, test için boş bırakabilirsiniz  
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Payment (Stripe) - İsteğe bağlı, test için boş bırakabilirsiniz
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Image Upload (Cloudinary) - İsteğe bağlı
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Application Settings
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Subscription Settings
SUBSCRIPTION_PRICE_MONTHLY=10
SUBSCRIPTION_CURRENCY=try
```

### Frontend Environment (.env)

`frontend` klasöründe `.env` dosyası oluşturun:

```bash
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
```

## 🔴 Redis Kurulumu

### Windows için Redis

```bash
# Redis for Windows indirin
# https://github.com/microsoftarchive/redis/releases

# Veya Docker kullanın
docker run -d -p 6379:6379 redis:alpine

# Veya Redis Cloud kullanın (ücretsiz tier)
# https://redis.com/redis-enterprise-cloud/
```

## 🚀 Projeyi Çalıştırma

### 1. Backend'i Başlatın

```bash
cd backend
npm run dev
```

**Başarılı başlatma çıktısı:**
```
🚀 Server running on port 5000
✅ MongoDB connected
✅ Redis connected  
✅ Job service initialized
```

### 2. Frontend'i Başlatın (Yeni terminal)

```bash
cd frontend
npm run dev
```

**Başarılı başlatma çıktısı:**
```
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

## 🧪 Projeyi Test Etme

### 1. Tarayıcıda Test

1. **Frontend'e gidin**: http://localhost:3000
2. **Kayıt ol sayfasında** yeni bir salon hesabı oluşturun:
   - Salon Adı: "Test Güzellik Salonu"
   - İşletme Türü: "Salon"
   - Ad/Soyad: Test bilgileri
   - Email: test@example.com
   - Şifre: güçlü bir şifre

3. **Dashboard'a yönlendirileceksiniz**

### 2. API Endpoint'lerini Test Etme

```bash
# Health check
curl http://localhost:5000/health

# Kayıt ol
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Test Salon",
    "businessType": "salon", 
    "firstName": "Test",
    "lastName": "User",
    "email": "test@testsalon.com",
    "password": "TestPass123!",
    "phone": "+905551234567"
  }'
```

### 3. Database'i Kontrol Etme

**MongoDB Compass ile:**
1. Connection string'inizi kullanarak bağlanın
2. `saloony` database'ini görmelisiniz
3. Collections: companies, users, customers, appointments, vb.

**Mongo Shell ile:**
```bash
# Yerel MongoDB
mongo saloony

# Atlas için
mongo "mongodb+srv://cluster0.xxxxx.mongodb.net/saloony" --username saloony_user

# Collections'ları listele
show collections

# İlk company'yi görüntüle
db.companies.findOne()
```

## 🛠 Geliştirme Araçları

### 1. Database Yönetimi
- **MongoDB Compass**: GUI database yönetimi
- **Studio 3T**: Gelişmiş MongoDB IDE

### 2. API Testing
- **Postman**: API endpoint'lerini test etme
- **Insomnia**: Alternatif API client
- **Thunder Client**: VS Code extension

### 3. Redis Monitoring
- **RedisInsight**: Redis GUI client
- **Redis CLI**: Komut satırı aracı

## 🐛 Sorun Giderme

### Backend Başlamıyor

**MongoDB bağlantı hatası:**
```
❌ MongoDB connection error: MongoNetworkError
```
**Çözüm:**
- MongoDB Atlas'ta IP whitelist kontrolü
- Connection string doğruluğu
- Network bağlantısı

**Redis bağlantı hatası:**
```
❌ Redis connection error: ECONNREFUSED
```
**Çözüm:**
- Redis servisinin çalıştığından emin olun
- Port 6379'un açık olduğunu kontrol edin

### Frontend Başlamıyor

**Module bulunamadı hatası:**
```
Cannot find module 'react'
```
**Çözüm:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### CORS Hatası

**Browser console'da:**
```
Access to XMLHttpRequest blocked by CORS policy
```
**Çözüm:**
- Backend'in çalıştığından emin olun
- Frontend URL'in backend CORS ayarlarında olduğunu kontrol edin

## 📝 Test Verileri Oluşturma

### 1. Örnek Servisler Oluşturma

```bash
# Backend çalışırken, yeni terminal açın
cd backend
node scripts/seed-data.js
```

### 2. Manuel Test Verileri

API endpoint'lerini kullanarak:

1. **Servis oluştur** (Dashboard → Hizmetler → Yeni Hizmet)
2. **Müşteri ekle** (Dashboard → Müşteriler → Yeni Müşteri)  
3. **Personel ekle** (Dashboard → Personel → Yeni Personel)
4. **Randevu oluştur** (Dashboard → Randevular → Yeni Randevu)

## 🎯 Sonraki Adımlar

1. **Temel fonksiyonları test edin**
2. **Kendi verilerinizi ekleyin**
3. **Notification servisleri için API key'leri ekleyin**
4. **Payment işlemleri için Stripe hesabı oluşturun**
5. **Production deployment için rehberi takip edin**

## 📞 Yardım

Sorun yaşarsanız:
1. Console log'larını kontrol edin
2. Network tab'ını inceleyin  
3. Database connection'ını test edin
4. Environment variables'ları doğrulayın

**Başarılar! 🎉**
