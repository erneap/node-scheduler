import { Request, Response, Router } from "express";
import { auth } from '../middleware/authorization.middleware';
import { logConnection } from "../config/logging";
import { collections } from "../config/mongoconnect";
import { ObjectId } from "mongodb";
import { IUser, User } from "scheduler-node-models/users";
import { Employee, IEmployee, LeaveStatus, NewLeaveRequest, UpdateLeave } from "scheduler-node-models/scheduler/employees";
import { getEmployee, updateEmployee } from "./initialRoutes";

const router = Router();

/**
 * This method will create a new leave for an employee, using provided new 
 * leave request.
 * Steps:
 * 1) Get add leave data from the request.
 * 2) Get the employee from the database.
 * 3) Add a new leave to the employee
 * 4) update the employee inn the database
 * 5) respond with the employee object
 */
router.post('/employee/leave', auth, async(req: Request, res: Response) => {
  try {
    const data = req.body as NewLeaveRequest;
    if (data) {
      const lvDate = new Date(data.leavedate);
      const employee = await getEmployee(data.employee);
      employee.addLeave(0, lvDate, data.code, data.status, data.hours, '', 
        data.holcode);
      await updateEmployee(employee);
      res.status(200).json(employee);
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

/**
 * This method is used to update a single leave record for an employee.
 * Steps:
 * 1) Get the update data from the request.
 * 2) Get the employee record from the database.
 * 3) Find the leave requested.  But update only if not actual.
 * 4) Update the selected leave.
 * 5) After the update, update the employee in the database.
 * 6) Respond with the employee object.
 */
router.put('/employee/leave', auth, async(req: Request, res: Response) => {
  try {
    const data = req.body as UpdateLeave;
    if (data) {
      const employee = await getEmployee(data.employee);
      employee.updateLeave(data.leaveid, data.field, data.value);
      await updateEmployee(employee);
      res.status(200).json(employee);
    } else {
      throw new Error('No employee leave update data');
    }
  } catch (err) {
    const error = err as Error;
    if (logConnection.employeeLog) {
      logConnection.employeeLog.log(`Error: UpdateEmployeeLeave: ${error.message}`);
    }
    res.status(400).json({'message': error.message});
  }
});

/**
 * This method is used to delete a leave from the employee's leave list.  Employee and
 * leave identifiers are passed as part of the request.  You are not able to delete 
 * 'actual' leaves, because these are based on ingested data.
 * Steps:
 * 1) Get the employee and leave identifier from the request.
 * 2) Pull the employee from the database.
 * 3) Search the employee's leave for the leave identifier.
 * 4) If found, delete it.
 * 5) Update the employee in the database.
 * 6) Respond with the employee object.
 */
router.delete('employee/leave/:id/:leave', auth, async(req: Request, res: Response) => {
  try {
    const empID = req.params.id;
    const leaveID = req.params.leave;
    if (empID && leaveID) {
      const employee = await getEmployee(empID);
      employee.deleteLeave(Number(leaveID));
      await updateEmployee(employee);
      res.status(200).json(employee);
    } else {
      throw new Error('No employee and/or leave identifier');
    }
  } catch (err) {
    const error = err as Error;
    if (logConnection.employeeLog) {
      logConnection.employeeLog.log(`Error: DeleteEmployeeLeave: ${error.message}`);
    }
    res.status(400).json({'message': error.message});
  }
})

export default router;