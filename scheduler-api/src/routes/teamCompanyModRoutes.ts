import { Request, Response, Router } from "express";
import { auth } from '../middleware/authorization.middleware';
import { logConnection, collections } from "scheduler-node-models/config";
import { ObjectId } from "mongodb";
import { ITeam, NewCompanyHoliday, Team, UpdateTeam } from "scheduler-node-models/scheduler/teams";
import { HolidayType } from "scheduler-node-models/scheduler/teams/company";

const router = Router();
export default router;