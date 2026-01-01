import { Request, Response, Router } from "express";
import { auth } from '../middleware/authorization.middleware';
import { logConnection } from "../config/logging";
import { NewEmployeeAssignment } from "scheduler-node-models/scheduler/employees";

const router = Router();

router.post('/employee/assignment', async(req: Request, res: Response) => {
  try {
    const data = req.body as NewEmployeeAssignment;
    if (data) {

    } else {
      throw new Error('No new employee assignment request data');
    }
  } catch (err) {
    const error = err as Error;
    if (logConnection.employeeLog) {
      logConnection.employeeLog.log(`Error: GetEmployee: ${error.message}`);
    }
    res.status(400).json({'message': error.message});
  }
});

export default router;