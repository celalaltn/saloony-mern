const socketIo = require('socket.io');
const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');

let io = null;

const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId)
        .populate('company')
        .select('-password');

      if (!user || !user.isActive || !user.company.isActive) {
        return next(new Error('Authentication error: Invalid user'));
      }

      socket.userId = user._id.toString();
      socket.companyId = user.company._id.toString();
      socket.userRole = user.role;
      
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected to company ${socket.companyId}`);
    
    // Join company room
    socket.join(`company:${socket.companyId}`);
    
    // Join user-specific room
    socket.join(`user:${socket.userId}`);

    // Handle appointment updates
    socket.on('appointment:update', (data) => {
      socket.to(`company:${socket.companyId}`).emit('appointment:updated', {
        ...data,
        updatedBy: socket.userId,
      });
    });

    // Handle new appointments
    socket.on('appointment:new', (data) => {
      socket.to(`company:${socket.companyId}`).emit('appointment:created', {
        ...data,
        createdBy: socket.userId,
      });
    });

    // Handle customer updates
    socket.on('customer:update', (data) => {
      socket.to(`company:${socket.companyId}`).emit('customer:updated', {
        ...data,
        updatedBy: socket.userId,
      });
    });

    // Handle staff status updates
    socket.on('staff:status', (data) => {
      if (socket.userRole === 'admin') {
        socket.to(`company:${socket.companyId}`).emit('staff:status:updated', {
          ...data,
          updatedBy: socket.userId,
        });
      }
    });

    // Handle typing indicators for notes
    socket.on('typing:start', (data) => {
      socket.to(`company:${socket.companyId}`).emit('typing:user:start', {
        userId: socket.userId,
        resource: data.resource,
        resourceId: data.resourceId,
      });
    });

    socket.on('typing:stop', (data) => {
      socket.to(`company:${socket.companyId}`).emit('typing:user:stop', {
        userId: socket.userId,
        resource: data.resource,
        resourceId: data.resourceId,
      });
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
    });
  });

  return io;
};

const getSocketInstance = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocket() first.');
  }
  return io;
};

// Utility functions for emitting events
const emitToCompany = (companyId, event, data) => {
  if (io) {
    io.to(`company:${companyId}`).emit(event, data);
  }
};

const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

module.exports = {
  initializeSocket,
  getSocketInstance,
  emitToCompany,
  emitToUser,
  emitToAll,
};
