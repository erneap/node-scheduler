import { Request, Response, Router } from "express";
import { auth } from '../middleware/authorization.middleware';
import { logConnection } from "../config/logging";
import { collections } from "../config/mongoconnect";
import { ObjectId } from "mongodb";
import { IUser, User } from "scheduler-node-models/users";
import { Employee, IEmployee, NewLeaveRequest } from "scheduler-node-models/scheduler/employees";

const router = Router();

/**
 * This method will create a new leave for an employee, using provided new 
 * leave request.
 */
router.post('/employee/leave', auth, async(req: Request, res: Response) => {
  try {
    const data = req.body as NewLeaveRequest;
    if (data) {
      const lvDate = new Date(data.leavedate);
      const colEmp = collections.employees;
      if (colEmp) {
        const query = { _id: new ObjectId(data.employee)};
        const iEmp = await colEmp.findOne<IEmployee>(query);
        if (iEmp !== null) {
          const employee = new Employee(iEmp);
          employee.addLeave(0, lvDate, data.code, data.status, data.hours, '', 
            data.holcode);
          await colEmp.replaceOne(query, employee);
          const colUsers = collections.users;
          if (colUsers) {
            const iUser = await colUsers.findOne<IUser>(query)
            if (iUser) {
              employee.user = new User(iUser);
            }
          }
          res.status(201).json(employee);
        } else {
          throw new Error('Employee not found');
        }
      }
    } else {
      throw new Error('No new employee leave request data');
    }
  } catch (err) {
    const error = err as Error;
    if (logConnection.employeeLog) {
      logConnection.employeeLog.log(`Error: CreateEmployeeLeave: ${error.message}`);
    }
    res.status(400).json({'message': error.message});
  }
});

export default router;