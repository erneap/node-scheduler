import express from 'express';
import logRoutes from './logsRoutes';
import noticeRoutes from './noticeRoutes';
import printRoutes from './printRoutes';

const router = express.Router();

router.use('', logRoutes);
router.use('', noticeRoutes);
router.use('', printRoutes);

export default router;