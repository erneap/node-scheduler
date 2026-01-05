import { Request, Response, Router } from "express";
import { auth } from '../middleware/authorization.middleware';
import { logConnection } from "../config/logging";
import { getEmployee, updateEmployee } from "./initialRoutes";
import { LeaveRequest, LeaveRequestComment, LeaveStatus, NewEmployeeLeaveRequest } from "scheduler-node-models/scheduler/employees";
import { ObjectId } from "mongodb";
import { UpdateRequest } from "scheduler-node-models/general";

const router = Router();

/**
 * This method is used to add a new leave request for an employee.
 * Steps:
 * 1) Get the new leave request data from the request body
 * 2) Get the employee from the database
 * 3) Check to see if there already is a leave for this period. if found, throw error
 * 4) Create the new leave request in draft status.
 * 5) Add it to the employee's leave request list.
 * 6) Update the employee in the database
 * 7) Respond with the employee to the client.
 */
router.post('/employee/request', async(req: Request, res: Response) => {
  try {
    const data = req.body as NewEmployeeLeaveRequest;
    if (data) {
      const employee = await getEmployee(data.employee);
      // check to see if a leave request is present for the same dates, if found, send
      // an error message
      const start = new Date(data.startdate);
      const end = new Date(data.enddate);
      let found = false;
      employee.requests.forEach(req => {
        if (req.startdate.getTime() === start.getTime() 
          && req.enddate.getTime() === end.getTime()) {
          found = true;
        }
      });
      if (found) {
        throw new Error('Leave Request for dates already created');
      }
      employee.createLeaveRequest(start, end, data.code, data.comment);

      await updateEmployee(employee);
      res.status(201).json(employee);
    } else {
      throw new Error('New Leave Request data missing')
    }
  } catch (err) {
    const error = err as Error;
    if (logConnection.employeeLog) {
      logConnection.employeeLog.log(`Error: CreateEmployeeLeaveRequest: ${error.message}`);
    }
    res.status(400).json({'message': error.message});
  }
});

/**
 * This method is called to update a leave request with the value given.  The employee
 * object has a method for updating the request, so it is called.
 * Steps:
 * 1) Get the update information from the request body
 * 2) Get the employee from the database
 * 3) Ensure the request id is present in the update information.  If not, throw error
 * 4) Update the employee request by calling the employee object's updateleaverequest
 * method.
 * 5) Update the employee in the database
 * 6) Respond with the employee object to the client
 */
router.put('/employee/request', async(req: Request, res: Response) => {
  try {
    const data = req.body as UpdateRequest;
    if (data) {
      const employee = await getEmployee(data.id);
      if (data.optional) {
        employee.updateLeaveRequest(data.optional, data.field, data.value);
        await updateEmployee(employee);
        res.status(200).json(employee);
      } else {
        throw new Error('Leave Request ID missing from update');
      }
    }
  } catch (err) {
    const error = err as Error;
    if (logConnection.employeeLog) {
      logConnection.employeeLog.log(`Error: UpdateEmployeeLeaveRequest: ${error.message}`);
    }
    res.status(400).json({'message': error.message});
  }
});

/**
 * This method is called to delete a leave request from an employee.  The employee object
 * has a method to delete the request, so it is called.
 * Steps:
 * 1) Get the employee id and request id from the request parameters
 * 2) Get the employee from the database
 * 3) Call the employee deleteLeaveRequest method to remove the leave request and any 
 * associated data.
 * 4) Update the employee in the database
 * 5) Response with the updated employee to the client.
 */
router.delete('/employee/request/:id/:reqid', async(req: Request, res: Response) => {
  try {
    const empID = req.params.id;
    const reqID = req.params.reqid;
    if (empID && reqID) {
      const employee = await getEmployee(empID);
      employee.deleteLeaveRequest(reqID);
      await updateEmployee(employee);
      res.status(200).json(employee);
    } else {
      throw new Error('Employee and/or request id missing');
    }
  } catch (err) {
    const error = err as Error;
    if (logConnection.employeeLog) {
      logConnection.employeeLog.log(`Error: DeleteEmployeeLeaveRequest: ${error.message}`);
    }
    res.status(400).json({'message': error.message});
  }
});

export default router;