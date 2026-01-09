import { Request, Response, Router } from "express";
import { Logger } from "scheduler-node-models/general";
import { InitialResponse } from 'scheduler-node-models/scheduler/web';
import { ObjectId } from "mongodb";
import { collections } from '../config/mongoconnect';
import { Employee, IEmployee, IWorkRecord, Work, WorkRecord } from "scheduler-node-models/scheduler/employees";
import { Site } from "scheduler-node-models/scheduler/sites";
import { ITeam, Team } from "scheduler-node-models/scheduler/teams";
import { IUser, User } from "scheduler-node-models/users";
import { auth } from '../middleware/authorization.middleware';
import { logConnection } from "../config/logging";

const router = Router();

/**
 * This method will be used to download a mexcel (manual excel) file so that the on-site
 * company supervisor can provide the work hours and leave codes for each day of the 
 * month, and will show the total work hours for the month.
 * Steps:
 * 1) Get the team, site and company identifiers
 */
router.get('/ingest/:team/:site/:company', async(req: Request, res: Response) => {

});

router.post('/ingest', async(req: Request, res: Response) => {

});

export default router;