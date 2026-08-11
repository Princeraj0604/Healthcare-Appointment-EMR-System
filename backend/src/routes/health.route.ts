import { Router } from 'express';
import { healthCheck } from '../controllers/health.controller';

const router = Router();

/**
 * @route   GET /api/v1/health
 * @desc    Check health of all services
 * @access  Public
 */
router.get('/', healthCheck);

export default router;
