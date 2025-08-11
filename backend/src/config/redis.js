const Redis = require('redis');

let redisClient = null;

const initializeRedis = async () => {
  try {
    redisClient = Redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      password: process.env.REDIS_PASSWORD || undefined,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          console.error('Redis connection refused');
          return new Error('Redis connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          console.error('Redis retry time exhausted');
          return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
          console.error('Redis max retry attempts reached');
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      },
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

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
