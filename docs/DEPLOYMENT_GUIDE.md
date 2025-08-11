# Deployment Guide

## Overview
This guide covers deployment strategies for the Saloony appointment management system, including development, staging, and production environments.

## Environment Setup

### Prerequisites
- Node.js 18+ and npm
- MongoDB Atlas account or local MongoDB
- Redis Cloud account or local Redis
- Stripe account with Turkish support
- SendGrid account for emails
- Twilio account for SMS
- Cloudinary account for image storage

### Environment Variables

#### Backend (.env)
```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/saloony
MONGODB_URI_TEST=mongodb+srv://username:password@cluster.mongodb.net/saloony_test

# JWT Configuration
JWT_ACCESS_SECRET=your-super-secure-access-secret-key-here
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key-here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password

# SendGrid Configuration
SENDGRID_API_KEY=SG.your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@saloony.com
SENDGRID_FROM_NAME=Saloony

# Twilio Configuration
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-publishable-key
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Application Configuration
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-frontend-domain.com

# Subscription Configuration
SUBSCRIPTION_PRICE_MONTHLY=10
SUBSCRIPTION_CURRENCY=try
```

#### Frontend (.env)
```bash
VITE_API_BASE_URL=https://your-backend-domain.com/api/v1
VITE_SOCKET_URL=https://your-backend-domain.com
```

## Deployment Options

### Option 1: Railway (Recommended)

Railway provides excellent support for full-stack applications with automatic deployments.

#### Backend Deployment
1. **Connect Repository**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login to Railway
   railway login
   
   # Initialize project
   railway init
   ```

2. **Configure Build Settings**
   - Root directory: `/backend`
   - Build command: `npm run build`
   - Start command: `npm start`

3. **Environment Variables**
   - Add all backend environment variables in Railway dashboard
   - Use Railway's MongoDB and Redis add-ons for managed services

4. **Custom Domain**
   ```bash
   # Add custom domain
   railway domain add api.yourdomain.com
   ```

#### Frontend Deployment
1. **Build Configuration**
   - Root directory: `/frontend`
   - Build command: `npm run build`
   - Output directory: `dist`

2. **Environment Variables**
   - Set `VITE_API_BASE_URL` to your backend Railway URL
   - Set `VITE_SOCKET_URL` to your backend Railway URL

### Option 2: Heroku

#### Backend on Heroku
1. **Create Heroku App**
   ```bash
   # Install Heroku CLI
   npm install -g heroku
   
   # Login
   heroku login
   
   # Create app
   heroku create saloony-api
   
   # Set buildpack
   heroku buildpacks:set heroku/nodejs
   ```

2. **Configure Environment**
   ```bash
   # Set environment variables
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI=your-mongodb-uri
   # ... add all other environment variables
   ```

3. **Deploy**
   ```bash
   # Add Heroku remote
   git remote add heroku https://git.heroku.com/saloony-api.git
   
   # Deploy
   git subtree push --prefix backend heroku main
   ```

#### Frontend on Netlify
1. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`

2. **Environment Variables**
   - Add frontend environment variables in Netlify dashboard

3. **Deploy**
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli
   
   # Deploy
   cd frontend
   npm run build
   netlify deploy --prod --dir=dist
   ```

### Option 3: DigitalOcean App Platform

1. **Create App**
   - Connect GitHub repository
   - Configure backend and frontend as separate components

2. **Backend Configuration**
   ```yaml
   name: saloony-backend
   source_dir: /backend
   github:
     repo: your-username/saloony-mern
     branch: main
   run_command: npm start
   environment_slug: node-js
   instance_count: 1
   instance_size_slug: basic-xxs
   ```

3. **Frontend Configuration**
   ```yaml
   name: saloony-frontend
   source_dir: /frontend
   github:
     repo: your-username/saloony-mern
     branch: main
   build_command: npm run build
   output_dir: /dist
   ```

## Docker Deployment

### Dockerfile (Backend)
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

EXPOSE 5000

CMD ["npm", "start"]
```

### Dockerfile (Frontend)
```dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
      - mongodb

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    environment:
      - VITE_API_BASE_URL=http://localhost:5000/api/v1

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password

volumes:
  redis_data:
  mongodb_data:
```

## CI/CD Pipeline

### GitHub Actions Workflow
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: |
            backend/package-lock.json
            frontend/package-lock.json
      
      - name: Install backend dependencies
        run: |
          cd backend
          npm ci
      
      - name: Install frontend dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Run backend tests
        run: |
          cd backend
          npm test
      
      - name: Run frontend tests
        run: |
          cd frontend
          npm test
      
      - name: Build frontend
        run: |
          cd frontend
          npm run build

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Railway
        uses: railway/cli@v2
        with:
          command: up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install and build
        run: |
          cd frontend
          npm ci
          npm run build
      
      - name: Deploy to Netlify
        uses: netlify/actions/cli@master
        with:
          args: deploy --prod --dir=frontend/dist
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## Database Migration

### MongoDB Indexes
```javascript
// Create indexes for better performance
db.appointments.createIndex({ "company": 1, "dateTime": 1 })
db.appointments.createIndex({ "company": 1, "staff": 1, "dateTime": 1 })
db.appointments.createIndex({ "company": 1, "customer": 1 })
db.appointments.createIndex({ "company": 1, "status": 1 })

db.customers.createIndex({ "company": 1, "phone": 1 })
db.customers.createIndex({ "company": 1, "email": 1 })
db.customers.createIndex({ "company": 1, "isActive": 1 })

db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "company": 1, "role": 1 })

db.transactions.createIndex({ "company": 1, "date": -1 })
db.transactions.createIndex({ "company": 1, "type": 1, "date": -1 })

db.notificationlogs.createIndex({ "company": 1, "createdAt": -1 })
db.notificationlogs.createIndex({ "company": 1, "status": 1 })
```

## Monitoring and Logging

### Application Monitoring
```javascript
// Add to server.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### Health Check Endpoint
```javascript
// Add to server.js
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await mongoose.connection.db.admin().ping();
    
    // Check Redis connection
    await redisClient.ping();
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

## Security Checklist

### Pre-deployment Security
- [ ] All environment variables are set correctly
- [ ] JWT secrets are strong and unique
- [ ] Database connection uses SSL
- [ ] CORS is configured for production domains only
- [ ] Rate limiting is enabled
- [ ] Helmet middleware is configured
- [ ] Input validation is implemented
- [ ] File upload restrictions are in place
- [ ] Webhook signatures are verified

### Post-deployment Security
- [ ] SSL certificates are installed
- [ ] Security headers are configured
- [ ] Database access is restricted
- [ ] API endpoints are tested
- [ ] Monitoring is set up
- [ ] Backup strategy is implemented

## Performance Optimization

### Backend Optimizations
```javascript
// Enable compression
app.use(compression());

// Set cache headers
app.use('/api', (req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
  }
  next();
});

// Database connection pooling
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

### Frontend Optimizations
```javascript
// Lazy loading routes
const AppointmentsPage = lazy(() => import('./pages/AppointmentsPage'));
const CustomersPage = lazy(() => import('./pages/CustomersPage'));

// Image optimization
const optimizedImageUrl = (url, width = 400) => {
  return `${url}?w=${width}&q=80&f=auto`;
};
```

## Backup Strategy

### Database Backup
```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$MONGODB_URI" --out="/backups/saloony_$DATE"
tar -czf "/backups/saloony_$DATE.tar.gz" "/backups/saloony_$DATE"
rm -rf "/backups/saloony_$DATE"

# Upload to cloud storage
aws s3 cp "/backups/saloony_$DATE.tar.gz" "s3://your-backup-bucket/"
```

### File Backup
- Cloudinary automatically handles image backups
- Application code is backed up in Git repository
- Environment variables should be documented securely

## Troubleshooting

### Common Issues
1. **Database Connection Timeout**
   - Check MongoDB Atlas IP whitelist
   - Verify connection string format
   - Check network connectivity

2. **Redis Connection Failed**
   - Verify Redis URL and password
   - Check Redis service status
   - Ensure Redis version compatibility

3. **Webhook Failures**
   - Verify webhook endpoint URLs
   - Check webhook signature verification
   - Monitor webhook logs

4. **Email/SMS Not Sending**
   - Check SendGrid/Twilio API keys
   - Verify sender verification
   - Check rate limits

### Monitoring Commands
```bash
# Check application logs
heroku logs --tail -a saloony-api

# Check database performance
mongo --eval "db.runCommand({serverStatus: 1})"

# Check Redis performance
redis-cli info stats

# Test API endpoints
curl -X GET https://your-api-domain.com/health
```

This deployment guide provides multiple options for hosting the Saloony application, from simple cloud platforms to more complex containerized deployments, ensuring you can choose the best option for your needs and budget.
