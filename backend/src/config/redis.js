// Redis client mock for development without Redis
const Redis = require('redis');

// Create a mock Redis client for development
let redisClient = {
  connect: () => console.log('Mock Redis client connected'),
  disconnect: () => console.log('Mock Redis client disconnected'),
  get: (key) => Promise.resolve(null),
  set: (key, value) => Promise.resolve('OK'),
  del: (key) => Promise.resolve(1),
  on: (event, callback) => {}, // No-op for events
  quit: () => Promise.resolve('OK'),
};

const initializeRedis = async () => {
  try {
    // In development mode without Redis, use the mock client
    if (process.env.NODE_ENV === 'production') {
      // Only try to connect to real Redis in production
      console.log('Production mode: Would connect to real Redis here');
      // Uncomment below to use real Redis in production
      /*
      redisClient = Redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        password: process.env.REDIS_PASSWORD || undefined,
      });
      
      redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });
      */
    } else {
      console.log('Development mode: Using mock Redis client');
    }

    redisClient.on('connect', () => {
      console.log('Redis Client Connected');
    });

    redisClient.on('ready', () => {
      console.log('Redis Client Ready');
    });

    redisClient.on('end', () => {
      console.log('Redis Client Disconnected');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('Failed to initialize Redis:', error);
    throw error;
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call initializeRedis() first.');
  }
  return redisClient;
};

const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};

// Cache utilities
const cache = {
  async get(key) {
    try {
      const client = getRedisClient();
      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  async set(key, value, ttl = 3600) {
    try {
      const client = getRedisClient();
      await client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  },

  async del(key) {
    try {
      const client = getRedisClient();
      await client.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  },

  async exists(key) {
    try {
      const client = getRedisClient();
      return await client.exists(key);
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  },

  async flush() {
    try {
      const client = getRedisClient();
      await client.flushAll();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  },
};

module.exports = {
  initializeRedis,
  getRedisClient,
  closeRedis,
  cache,
};
