import { Request, Response } from 'express';
import { paymentService } from '../services/payment.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

// ============================================================
// Payment Controller
// ============================================================

/**
 * POST /api/v1/payments/create-order
 * Create Razorpay Order
 */
export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { appointmentId } = req.body;
  const order = await paymentService.createOrder(appointmentId, req.user!.id);
  res.status(201).json(ApiResponse.created('Razorpay order created', order));
});

/**
 * POST /api/v1/payments/verify
 * Verify Razorpay payment HMAC signature
 */
export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  const result = await paymentService.verifyPayment(req.body, req.user!.id);
  res.status(200).json(ApiResponse.ok(result.message, null));
});

/**
 * POST /api/v1/payments/webhook
 * Razorpay Webhook
 */
export const handleWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const result = await paymentService.handleWebhook(req.body, signature);
  res.status(200).json(result);
});
