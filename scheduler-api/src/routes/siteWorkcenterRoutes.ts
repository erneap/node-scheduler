import { Request, Response, Router } from "express";
import { auth } from '../middleware/authorization.middleware';
import { logConnection, collections } from "scheduler-node-models/config";
import { getAllDatabaseInfo, getEmployee } from "./initialRoutes";
import { NewSiteWorkcenter } from 'scheduler-node-models/scheduler/sites/web';
import { Site } from "scheduler-node-models/scheduler/sites";
import { ObjectId } from "mongodb";
import { Employee } from "scheduler-node-models/scheduler/employees";
import { ITeam, Team } from "scheduler-node-models/scheduler/teams";

const router = Router();
export default router;