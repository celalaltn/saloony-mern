# MongoDB Kurulum Rehberi

## VSCode MongoDB Extension ile Bağlantı

1. **VSCode'da MongoDB extension'ını açın** (sol panelde MongoDB ikonu)
2. **"Add Connection" tıklayın**
3. **Connection string'i yapıştırın**:
   ```
   mongodb+srv://saloony_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/
   ```
4. **"Connect" tıklayın**
5. **"saloony" database'ini oluşturun**

## Backend .env Dosyasını Güncelleyin

Connection string'i aldıktan sonra, backend `.env` dosyasını güncelleyin:

```bash
# MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://saloony_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/saloony?retryWrites=true&w=majority
```

## Test Etme

Backend'i yeniden başlatın:
```bash
cd backend
npm run dev
```

Başarılı bağlantı mesajı:
```
✅ MongoDB connected
✅ SendGrid not configured - email notifications disabled
✅ Twilio not configured - SMS notifications disabled
❌ Redis connection error (normal, Redis henüz kurulmadı)
🚀 Server running on port 5000
```

## İlk Test Verisi

MongoDB bağlantısı çalıştıktan sonra, frontend'te kayıt ol sayfasından ilk şirket hesabınızı oluşturun:

1. http://localhost:3000 adresine gidin
2. "Kayıt Ol" tıklayın
3. Şirket bilgilerini doldurun
4. Hesap oluşturun

## Redis Kurulumu (Opsiyonel)

Redis için en kolay yol Docker:
```bash
docker run -d -p 6379:6379 redis:alpine
```

Veya Redis Cloud'un ücretsiz tier'ını kullanın: https://redis.com/redis-enterprise-cloud/

Redis olmadan da proje çalışır, sadece background job'lar çalışmaz.
