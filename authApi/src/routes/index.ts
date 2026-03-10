import express from 'express';
import userRoutes from './user.routes';
import authenticateRoutes from './authenticate.routes';

const router = express.Router();

router.use('', userRoutes);
router.use('', authenticateRoutes);

export default router;