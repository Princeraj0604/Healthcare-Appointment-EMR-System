import { Router } from 'express';
import {
  createMedicalRecord,
  getRecordByAppointment,
  getPatientHistory,
} from '../controllers/medicalRecord.controller';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/auth.middleware';
import { doctorOnly } from '../middlewares/rbac.middleware';
import { createMedicalRecordSchema } from '../validations/medicalRecord.validation';

const router = Router();

router.use(authenticate);

/**
 * @route   POST /api/v1/medical-records
 * @desc    Add diagnosis, prescription & lab reports
 * @access  Private (Doctor only)
 */
router.post('/', doctorOnly, validate(createMedicalRecordSchema), createMedicalRecord);

/**
 * @route   GET /api/v1/medical-records/appointment/:appointmentId
 * @desc    Get record for an appointment
 * @access  Private (Patient or Doctor owner)
 */
router.get('/appointment/:appointmentId', getRecordByAppointment);

/**
 * @route   GET /api/v1/medical-records/patient/:patientUserId
 * @desc    Get full medical history for a patient
 * @access  Private (Patient owner, Doctor, or Admin)
 */
router.get('/patient/:patientUserId', getPatientHistory);

export default router;
