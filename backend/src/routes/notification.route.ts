import { Router } from 'express';
import { getMyNotifications, markAsRead, markAllAsRead } from '../controllers/notification.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getMyNotifications);
router.put('/mark-all-read', markAllAsRead);
router.put('/:id/read', markAsRead);

export default router;
