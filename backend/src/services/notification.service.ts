import prisma from '../config/database';
import { NotificationType } from '@prisma/client';
import { PaginatedResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { SOCKET_EVENTS } from '../types/index';

export const notificationService = {
  /**
   * Create and send notification (DB + Socket.io)
   */
  async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type?: NotificationType;
    metadata?: Record<string, any>;
  }) {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type ?? NotificationType.GENERAL,
        metadata: data.metadata ?? undefined,
      },
    });

    // Emit real-time Socket.io event if connected
    const io = (global as any).io;
    if (io) {
      io.to(`user:${data.userId}`).emit(SOCKET_EVENTS.NOTIFICATION, notification);
    }

    return notification;
  },

  /**
   * Get user notifications (paginated)
   */
  async getUserNotifications(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      ...PaginatedResponse.create('Notifications retrieved', notifications, total, page, limit),
      unreadCount,
    };
  },

  /**
   * Mark single notification as read
   */
  async markAsRead(id: string, userId: string) {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) throw ApiError.notFound('Notification not found');
    if (notification.userId !== userId) throw ApiError.forbidden('Unauthorized');

    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { message: 'All notifications marked as read' };
  },
};
