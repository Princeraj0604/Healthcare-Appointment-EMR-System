import { Router } from 'express';
import { getDashboardStats, getUsers, approveDoctor } from '../controllers/admin.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { adminOnly } from '../middlewares/rbac.middleware';

const router = Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate, adminOnly);

/**
 * @route   GET /api/v1/admin/dashboard-stats
 * @desc    Get aggregate system statistics & revenue
 * @access  Private (Admin only)
 */
router.get('/dashboard-stats', getDashboardStats);

/**
 * @route   GET /api/v1/admin/users
 * @desc    List all system users
 * @access  Private (Admin only)
 */
router.get('/users', getUsers);

/**
 * @route   PUT /api/v1/admin/doctors/:id/approve
 * @desc    Approve or revoke doctor verification
 * @access  Private (Admin only)
 */
router.put('/doctors/:id/approve', approveDoctor);

export default router;
