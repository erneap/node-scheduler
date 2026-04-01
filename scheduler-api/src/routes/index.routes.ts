import express from 'express';
import initialRoutes from './initialRoutes'
import employeeRoutes from './employeeRoutes';
import employeeAssignmentRoutes from './employeeAssignmentRoutes';
import employeeVariationRoutes from './employeeVariationRoutes';
import employeeLeaveRoutes from './employeeLeaveRoutes';
import employeeBalanceRoutes from './employeeBalanceRoutes';
import employeeMiscRoutes from './employeeMiscRoutes';
import ingestRoutes from './ingestRoutes';
import siteRoutes from './siteRoutes';
import siteForecastRoutes from './siteForecastRoutes';
import siteWorkcenterRoutes from './siteWorkcenterRoutes';
import siteCofSRoutes from './siteCofSRoutes';
import teamRoutes from './teamRoutes';
import teamWorkcodeRoutes from './teamWorkcodeRoutes';
import teamCompanyRoutes from './teamCompanyRoutes';
import teamCompanyHolidayRoutes from './teamCompanyHolidayRoutes';
import teamCompanyModRoutes from './teamCompanyModRoutes';
import employeeLeaveRequestRoutes from './employeeLeaveRequestRoutes';
import siteScheduleRoutes from './siteScheduleRoutes';
import teamQueryRoutes from './teamQueryRoutes';

const router = express.Router();

router.use('', initialRoutes);
router.use('', employeeRoutes);
router.use('', employeeAssignmentRoutes);
router.use('', employeeVariationRoutes);
router.use('', employeeBalanceRoutes);
router.use('', employeeMiscRoutes);
router.use('', employeeLeaveRequestRoutes);
router.use('', ingestRoutes);
router.use('', siteRoutes);
router.use('', siteForecastRoutes);
router.use('', siteWorkcenterRoutes);
router.use('', siteCofSRoutes);
router.use('', siteScheduleRoutes);
router.use('', teamRoutes);
router.use('', teamWorkcodeRoutes);
router.use('', employeeLeaveRoutes);
router.use('', teamCompanyRoutes);
router.use('', teamCompanyHolidayRoutes);
router.use('', teamCompanyModRoutes);
router.use('', teamQueryRoutes);

export default router;