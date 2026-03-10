import { Server, Socket } from 'socket.io';
import { prisma } from '../utils/prisma';
import { logger } from '../middleware/logger';
import jwt from 'jsonwebtoken';
import { config } from '../config';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export function setupChatSocket(io: Server) {
  // Authentication middleware for socket connections
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, config.jwt.secret) as any;
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;

      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`User connected: ${socket.userId} (Socket: ${socket.id})`);

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    // Handle joining course/support rooms
    socket.on('join-room', async (roomId: string) => {
      try {
        // Verify user has access to this room
        if (roomId.startsWith('course:')) {
          const courseId = roomId.replace('course:', '');
          const enrollment = await prisma.enrollment.findUnique({
            where: {
              userId_courseId: {
                userId: socket.userId!,
                courseId
              }
            }
          });

          if (!enrollment && socket.userRole !== 'ADMIN' && socket.userRole !== 'INSTRUCTOR') {
            socket.emit('error', { message: 'No tienes acceso a este chat' });
            return;
          }
        }

        socket.join(roomId);
        logger.info(`User ${socket.userId} joined room ${roomId}`);

        // Load recent messages
        const recentMessages = await prisma.chatMessage.findMany({
          where: { roomId },
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        });

        socket.emit('room-messages', recentMessages.reverse());
      } catch (error) {
        logger.error('Error joining room:', error);
        socket.emit('error', { message: 'Error al unirse al chat' });
      }
    });

    // Handle sending messages
    socket.on('send-message', async (data: {
      roomId: string;
      message: string;
      type?: string;
      metadata?: any;
    }) => {
      try {
        const { roomId, message, type = 'text', metadata } = data;

        // Create message in database
        const chatMessage = await prisma.chatMessage.create({
          data: {
            roomId,
            senderId: socket.userId!,
            message,
            type,
            metadata
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        });

        // Emit to all users in the room
        io.to(roomId).emit('new-message', chatMessage);

        logger.info(`Message sent in room ${roomId} by user ${socket.userId}`);
      } catch (error) {
        logger.error('Error sending message:', error);
        socket.emit('error', { message: 'Error al enviar el mensaje' });
      }
    });

    // Handle typing indicators
    socket.on('typing', (data: { roomId: string }) => {
      socket.to(data.roomId).emit('user-typing', {
        userId: socket.userId,
        timestamp: new Date()
      });
    });

    socket.on('stop-typing', (data: { roomId: string }) => {
      socket.to(data.roomId).emit('user-stopped-typing', {
        userId: socket.userId
      });
    });

    // Handle marking messages as read
    socket.on('mark-read', async (data: { roomId: string; messageIds?: string[] }) => {
      try {
        const { roomId, messageIds } = data;

        if (messageIds && messageIds.length > 0) {
          await prisma.chatMessage.updateMany({
            where: {
              id: { in: messageIds },
              roomId,
              NOT: { senderId: socket.userId }
            },
            data: { read: true }
          });
        } else {
          // Mark all messages in room as read
          await prisma.chatMessage.updateMany({
            where: {
              roomId,
              NOT: { senderId: socket.userId },
              read: false
            },
            data: { read: true }
          });
        }

        socket.emit('messages-marked-read', { roomId, messageIds });
      } catch (error) {
        logger.error('Error marking messages as read:', error);
        socket.emit('error', { message: 'Error al marcar mensajes como leídos' });
      }
    });

    // Handle leaving rooms
    socket.on('leave-room', (roomId: string) => {
      socket.leave(roomId);
      logger.info(`User ${socket.userId} left room ${roomId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.userId} (Socket: ${socket.id})`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('Socket error:', error);
    });
  });

  // Periodic cleanup of old messages (optional)
  setInterval(async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const deleted = await prisma.chatMessage.deleteMany({
        where: {
          createdAt: { lt: thirtyDaysAgo },
          type: 'text' // Only delete text messages, keep important files/images
        }
      });

      if (deleted.count > 0) {
        logger.info(`Cleaned up ${deleted.count} old chat messages`);
      }
    } catch (error) {
      logger.error('Error cleaning up old messages:', error);
    }
  }, 24 * 60 * 60 * 1000); // Run once per day
}

/**
 * Send notification via socket to specific user
 */
export function sendNotificationToUser(io: Server, userId: string, notification: any) {
  io.to(`user:${userId}`).emit('notification', notification);
}

/**
 * Broadcast message to all users in a course
 */
export function broadcastToCourse(io: Server, courseId: string, event: string, data: any) {
  io.to(`course:${courseId}`).emit(event, data);
}