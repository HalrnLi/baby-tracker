import { Router } from 'express';
import authRoutes from './auth';
import babyRoutes from './baby';
import recordsRoutes from './records';
import remindersRoutes from './reminders';
import healthRoutes from './health';
import syncRoutes from './sync';
import statsRoutes from './stats';

const router = Router();

router.use('/auth', authRoutes);
router.use('/baby', babyRoutes);
router.use('/records', recordsRoutes);
router.use('/reminders', remindersRoutes);
router.use('/health', healthRoutes);
router.use('/sync', syncRoutes);
router.use('/stats', statsRoutes);

export default router;
