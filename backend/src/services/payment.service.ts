import Razorpay from 'razorpay';
import crypto from 'crypto';
import prisma from '../config/database';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import logger from '../utils/logger';
import { PaymentStatus, AppointmentStatus } from '@prisma/client';
import { VerifyPaymentInput } from '../validations/payment.validation';

// Initialize Razorpay SDK instance
const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
});

export const paymentService = {
  /**
   * Create Razorpay Order for an appointment
   */
  async createOrder(appointmentId: string, userId: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: true,
        patient: { include: { user: true } },
      },
    });

    if (!appointment) throw ApiError.notFound('Appointment not found');

    if (appointment.patient.userId !== userId) {
      throw ApiError.forbidden('You can only pay for your own appointments');
    }

    if (appointment.paymentStatus === PaymentStatus.PAID) {
      throw ApiError.badRequest('Appointment is already paid for');
    }

    const amountInPaise = Math.round(Number(appointment.doctor.consultationFee) * 100);

    // Create order on Razorpay
    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `receipt_${appointment.id.substring(0, 10)}`,
        notes: {
          appointmentId: appointment.id,
          patientName: appointment.patient.user.name,
        },
      });
    } catch (err: any) {
      logger.error('Razorpay Order Creation Error:', err);
      // Mock order fallback in dev mode if test keys are invalid
      if (env.NODE_ENV === 'development') {
        razorpayOrder = {
          id: `order_mock_${Date.now()}`,
          amount: amountInPaise,
          currency: 'INR',
        };
      } else {
        throw ApiError.internal('Failed to create payment order with Razorpay');
      }
    }

    // Upsert local Payment record
    const payment = await prisma.payment.upsert({
      where: { appointmentId },
      update: {
        amount: appointment.doctor.consultationFee,
        razorpayOrderId: razorpayOrder.id,
        status: PaymentStatus.PENDING,
      },
      create: {
        appointmentId,
        amount: appointment.doctor.consultationFee,
        razorpayOrderId: razorpayOrder.id,
        status: PaymentStatus.PENDING,
      },
    });

    return {
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      paymentId: payment.id,
    };
  },

  /**
   * Verify Razorpay Payment Signature (HMAC-SHA256)
   */
  async verifyPayment(input: VerifyPaymentInput, userId: string) {
    const payment = await prisma.payment.findUnique({
      where: { appointmentId: input.appointmentId },
      include: { appointment: { include: { patient: true } } },
    });

    if (!payment) throw ApiError.notFound('Payment record not found');

    if (payment.appointment.patient.userId !== userId) {
      throw ApiError.forbidden('Unauthorized payment verification');
    }

    // Signature verification logic
    const secret = env.RAZORPAY_KEY_SECRET || 'secret_placeholder';
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
      .digest('hex');

    const isValid = generatedSignature === input.razorpaySignature;

    // Dev mode tolerance if using mock keys
    const isMockValid = env.NODE_ENV === 'development' && input.razorpayOrderId.startsWith('order_mock_');

    if (!isValid && !isMockValid) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED, failureReason: 'Signature verification failed' },
      });
      throw ApiError.badRequest('Invalid payment signature. Payment verification failed.');
    }

    // Mark payment as PAID & update appointment status
    const [updatedPayment] = await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.PAID,
          razorpayPaymentId: input.razorpayPaymentId,
          razorpaySignature: input.razorpaySignature,
        },
      }),
      prisma.appointment.update({
        where: { id: input.appointmentId },
        data: {
          paymentStatus: PaymentStatus.PAID,
          status: AppointmentStatus.CONFIRMED,
        },
      }),
    ]);

    logger.info(`Payment ${updatedPayment.id} verified and marked PAID for appointment ${input.appointmentId}`);

    return { success: true, message: 'Payment verified successfully. Appointment confirmed!' };
  },

  /**
   * Razorpay Webhook Endpoint Handler
   */
  async handleWebhook(body: any, signature: string) {
    const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET || 'webhook_secret';
    const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(JSON.stringify(body)).digest('hex');

    if (expectedSignature !== signature && env.NODE_ENV === 'production') {
      throw ApiError.badRequest('Invalid webhook signature');
    }

    const event = body.event;
    if (event === 'payment.captured') {
      const paymentEntity = body.payload.payment.entity;
      const orderId = paymentEntity.order_id;

      const payment = await prisma.payment.findUnique({
        where: { razorpayOrderId: orderId },
      });

      if (payment && payment.status !== PaymentStatus.PAID) {
        await prisma.$transaction([
          prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.PAID,
              razorpayPaymentId: paymentEntity.id,
            },
          }),
          prisma.appointment.update({
            where: { id: payment.appointmentId },
            data: {
              paymentStatus: PaymentStatus.PAID,
              status: AppointmentStatus.CONFIRMED,
            },
          }),
        ]);
        logger.info(`Webhook successfully processed payment capture for order ${orderId}`);
      }
    }

    return { status: 'ok' };
  },
};
