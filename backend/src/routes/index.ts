import { Router } from 'express';
import healthRouter from './health.route';
import authRouter from './auth.route';
import doctorRouter from './doctor.route';
import appointmentRouter from './appointment.route';
import medicalRecordRouter from './medicalRecord.route';
import paymentRouter from './payment.route';
import notificationRouter from './notification.route';
import adminRouter from './admin.route';

// ============================================================
// Main API Router — mounts all sub-routers
// Base path: /api/v1
// ============================================================

const router = Router();

// Mount all phase routers
router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/doctors', doctorRouter);
router.use('/appointments', appointmentRouter);
router.use('/medical-records', medicalRecordRouter);
router.use('/payments', paymentRouter);
router.use('/notifications', notificationRouter);
router.use('/admin', adminRouter);

export default router;
