# MongoDB Kurulum Rehberi

## MongoDB Atlas (Cloud) Kurulumu - ÖNERİLEN

1. **MongoDB Atlas'a kaydolun**: https://www.mongodb.com/atlas
2. **Yeni Cluster oluşturun**:
   - "Build a Database" tıklayın
   - M0 Sandbox (FREE) seçin
   - Region: Europe (Ireland) eu-west-1
   - Cluster Name: saloony-cluster

3. **Database kullanıcısı oluşturun**:
   - Security → Database Access
   - "Add New Database User"
   - Username: `saloony_admin`
   - Password: güçlü bir şifre oluşturun (kaydedin!)
   - Database User Privileges: "Read and write to any database"

4. **Network erişimi ayarlayın**:
   - Security → Network Access
   - "Add IP Address"
   - "Allow access from anywhere" (0.0.0.0/0) seçin

5. **Connection string alın**:
   - Database → Connect
   - "Connect your application"
   - Driver: Node.js, Version: 4.1 or later
   - Connection string'i kopyalayın:
   ```
   mongodb+srv://saloony_admin:<password>@saloony-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

6. **Backend .env dosyasını güncelleyin**:
   ```bash
   MONGODB_URI=mongodb+srv://saloony_admin:YOUR_PASSWORD@saloony-cluster.xxxxx.mongodb.net/saloony?retryWrites=true&w=majority
   ```

## VSCode MongoDB Extension ile Bağlantı

1. **VSCode'da MongoDB extension'ını açın** (sol panelde MongoDB ikonu)
2. **"Add Connection" tıklayın**
3. **Connection string'i yapıştırın**
4. **"Connect" tıklayın**
5. **"saloony" database'ini oluşturun**

## Yerel MongoDB Kurulumu (Alternatif)

1. **MongoDB Community Server indirin**: https://www.mongodb.com/try/download/community
2. **Kurulum yapın** (Windows için .msi dosyası)
3. **MongoDB Compass kurun** (GUI aracı)
4. **MongoDB servisini başlatın**:
   ```bash
   net start MongoDB
   ```
5. **Bağlantı string'i**:
   ```bash
   MONGODB_URI=mongodb://localhost:27017/saloony
   ```

## Redis Kurulumu

Redis için Docker kullanın (en kolay):
```bash
docker run -d -p 6379:6379 redis:alpine
```

Veya Redis Cloud'un ücretsiz tier'ını kullanın: https://redis.com/redis-enterprise-cloud/

## Test Etme

Backend'i yeniden başlatın:
```bash
cd backend
npm run dev
```

Başarılı bağlantı mesajları:
```
✅ MongoDB connected
✅ Redis connected
✅ Job service initialized
🚀 Server running on port 5000
```
