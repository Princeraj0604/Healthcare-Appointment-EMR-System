import { Router } from 'express';
import { createOrder, verifyPayment, handleWebhook } from '../controllers/payment.controller';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/auth.middleware';
import { patientOnly } from '../middlewares/rbac.middleware';
import { createRazorpayOrderSchema, verifyPaymentSchema } from '../validations/payment.validation';

const router = Router();

/**
 * @route   POST /api/v1/payments/webhook
 * @desc    Razorpay webhook callback (Public, signature verified)
 * @access  Public
 */
router.post('/webhook', handleWebhook);

// Protected routes require patient login
router.use(authenticate);

/**
 * @route   POST /api/v1/payments/create-order
 * @desc    Generate Razorpay Order ID for appointment
 * @access  Private (Patient only)
 */
router.post('/create-order', patientOnly, validate(createRazorpayOrderSchema), createOrder);

/**
 * @route   POST /api/v1/payments/verify
 * @desc    Verify Razorpay payment signature
 * @access  Private (Patient only)
 */
router.post('/verify', patientOnly, validate(verifyPaymentSchema), verifyPayment);

export default router;
