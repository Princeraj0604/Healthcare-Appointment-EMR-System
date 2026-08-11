import { z } from 'zod';

export const createRazorpayOrderSchema = z.object({
  body: z.object({
    appointmentId: z.string().min(1, 'Appointment ID is required'),
  }),
});

export const verifyPaymentSchema = z.object({
  body: z.object({
    appointmentId: z.string().min(1, 'Appointment ID is required'),
    razorpayOrderId: z.string().min(1, 'Razorpay order ID is required'),
    razorpayPaymentId: z.string().min(1, 'Razorpay payment ID is required'),
    razorpaySignature: z.string().min(1, 'Razorpay signature is required'),
  }),
});

export type CreateRazorpayOrderInput = z.infer<typeof createRazorpayOrderSchema>['body'];
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>['body'];
