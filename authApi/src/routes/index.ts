import express from 'express';
import userRoutes from './user.routes';
import authenticateRoutes from './authenticate.routes';
import resetRoutes from './reset.routes';

const router = express.Router();

router.use('', userRoutes);
router.use('', authenticateRoutes);
router.use('', resetRoutes);

export default router;