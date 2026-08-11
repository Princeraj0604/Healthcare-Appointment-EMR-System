import { Request, Response } from 'express';
import { adminService } from '../services/admin.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { Role } from '@prisma/client';

export const getDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await adminService.getDashboardStats();
  res.status(200).json(ApiResponse.ok('Admin dashboard stats', stats));
});

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const role = req.query.role as Role | undefined;
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const result = await adminService.getUsers(role, page, limit);
  res.status(200).json(result);
});

export const approveDoctor = asyncHandler(async (req: Request, res: Response) => {
  const doctorId = req.params.id;
  const { isApproved } = req.body;
  const result = await adminService.setDoctorApproval(doctorId, isApproved ?? true);
  res.status(200).json(ApiResponse.ok(result.message, result.doctor));
});
