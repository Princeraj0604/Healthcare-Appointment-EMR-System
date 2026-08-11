import { Router } from 'express';
import {
  bookAppointment,
  getMyAppointments,
  getAppointmentById,
  cancelAppointment,
  updateAppointmentStatus,
} from '../controllers/appointment.controller';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/auth.middleware';
import { patientOnly, doctorOnly } from '../middlewares/rbac.middleware';
import {
  bookAppointmentSchema,
  getAppointmentsQuerySchema,
  cancelAppointmentSchema,
  updateAppointmentStatusSchema,
} from '../validations/appointment.validation';

const router = Router();

// All appointment routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/appointments
 * @desc    Book a new appointment with a doctor
 * @access  Private (Patient only)
 */
router.post('/', patientOnly, validate(bookAppointmentSchema), bookAppointment);

/**
 * @route   GET /api/v1/appointments
 * @desc    List appointments for current user
 * @access  Private (Patient or Doctor)
 */
router.get('/', validate(getAppointmentsQuerySchema), getMyAppointments);

/**
 * @route   GET /api/v1/appointments/:id
 * @desc    Get details of a specific appointment
 * @access  Private (Patient or Doctor owner)
 */
router.get('/:id', getAppointmentById);

/**
 * @route   PUT /api/v1/appointments/:id/cancel
 * @desc    Cancel an appointment
 * @access  Private (Patient or Doctor owner)
 */
router.put('/:id/cancel', validate(cancelAppointmentSchema), cancelAppointment);

/**
 * @route   PUT /api/v1/appointments/:id/status
 * @desc    Update status (CONFIRMED, COMPLETED, NO_SHOW)
 * @access  Private (Doctor only)
 */
router.put('/:id/status', doctorOnly, validate(updateAppointmentStatusSchema), updateAppointmentStatus);

export default router;
