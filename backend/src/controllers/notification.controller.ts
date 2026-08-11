import { Request, Response } from 'express';
import { notificationService } from '../services/notification.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const getMyNotifications = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const result = await notificationService.getUserNotifications(req.user!.id, page, limit);
  res.status(200).json(result);
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const updated = await notificationService.markAsRead(req.params.id, req.user!.id);
  res.status(200).json(ApiResponse.ok('Notification marked as read', updated));
});

export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationService.markAllAsRead(req.user!.id);
  res.status(200).json(ApiResponse.ok(result.message, null));
});
