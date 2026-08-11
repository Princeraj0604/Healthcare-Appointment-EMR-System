import { Router } from 'express';
import {
  getDoctors,
  getDoctorById,
  updateDoctorProfile,
  setDoctorAvailability,
  getDoctorAvailability,
  getDoctorReviews,
} from '../controllers/doctor.controller';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/auth.middleware';
import { doctorOnly } from '../middlewares/rbac.middleware';
import {
  getDoctorsQuerySchema,
  updateDoctorProfileSchema,
  setAvailabilitySchema,
  getAvailabilityQuerySchema,
} from '../validations/doctor.validation';

const router = Router();

// ── Public Routes ────────────────────────────────────────────

/**
 * @route   GET /api/v1/doctors
 * @desc    Search/list doctors with filters & pagination
 * @access  Public
 */
router.get('/', validate(getDoctorsQuerySchema), getDoctors);

/**
 * @route   GET /api/v1/doctors/:id
 * @desc    Get doctor profile details
 * @access  Public
 */
router.get('/:id', getDoctorById);

/**
 * @route   GET /api/v1/doctors/:id/availability
 * @desc    Get generated time slots for a specific date
 * @access  Public
 */
router.get('/:id/availability', validate(getAvailabilityQuerySchema), getDoctorAvailability);

/**
 * @route   GET /api/v1/doctors/:id/reviews
 * @desc    Get doctor reviews
 * @access  Public
 */
router.get('/:id/reviews', getDoctorReviews);

// ── Protected Doctor Routes ─────────────────────────────────

/**
 * @route   PUT /api/v1/doctors/profile
 * @desc    Update own doctor profile
 * @access  Private (Doctor only)
 */
router.put('/profile', authenticate, doctorOnly, validate(updateDoctorProfileSchema), updateDoctorProfile);

/**
 * @route   PUT /api/v1/doctors/availability
 * @desc    Set/update weekly availability schedule
 * @access  Private (Doctor only)
 */
router.put('/availability', authenticate, doctorOnly, validate(setAvailabilitySchema), setDoctorAvailability);

export default router;
