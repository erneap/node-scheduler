import { Request, Response, Router } from "express";
import { auth } from '../middleware/authorization.middleware';
import { Assignment, ChangeAssignment, Employee, IEmployee, NewEmployeeAssignment } 
  from "scheduler-node-models/scheduler/employees";
import { logConnection, collections } from "scheduler-node-models/config";
import { ObjectId } from "mongodb";
import { IUser, User } from "scheduler-node-models/users";
import { getEmployee, updateEmployee } from "./initialRoutes";

const router = Router();

/**
 * This method will create a new assignment for an employee, using a provided site, 
 * workcenter, and start date.
 */
router.post('/employee/assignment', auth, async(req: Request, res: Response) => {
  try {
    const data = req.body as NewEmployeeAssignment;
    if (data) {
      const start = new Date(data.start);
      const employee = await getEmployee(data.employee);
      employee.assignments.sort((a,b) => a.compareTo(b));
      employee.addAssignment(data.site, data.workcenter, start);
      employee.assignments.sort((a,b) => a.compareTo(b));
      if (data.scheduledays > 0) {
        employee.assignments[employee.assignments.length - 1]
          .changeScheduleDays(0, data.scheduledays)
      }
      await updateEmployee(employee);
      res.status(201).json(employee);
    } else {
      throw new Error('No new employee assignment request data');
    }
  } catch (err) {
    const error = err as Error;
    if (logConnection.employeeLog) {
      logConnection.employeeLog.log(`Error: CreateEmployeeAssignment: ${error.message}`);
    }
    res.status(400).json({'message': error.message});
  }
});

/**
 * To change an employee's assignment, we will:
 * 1) Pull the employee from the employee collection
 * 2) Sort the employee's assignments, then find the assignment to change
 * 3) if found, change any of the fields, add a schedule, update its dates, or remove a
 * schedule.
 * 4) Replace the employee in the collection.
 * ** If an error is detected, an error message is put in the log and sent as a response
 * 5) Send updated employee back as response.
 */
router.put('/employee/assignment', auth, async(req: Request, res: Response) => {
  try {
    const data = req.body as ChangeAssignment;
    if (data) {
      const employee = await getEmployee(data.employee);
      employee.updateAssignment(data.asgmt, data.field, data.value, data.schedule, 
        data.workday);
      await updateEmployee(employee);
      res.status(200).json(employee);
    }
  } catch (err) {
    const error = err as Error;
    if (logConnection.employeeLog) {
      logConnection.employeeLog.log(`Error: UpdateEmployeeAssignment: ${error.message}`);
    }
    res.status(400).json({'message': error.message});
  }
});

/**
 * This function will convert a string value of a date YYYY-MM-DD to a date object.
 * @param date A string value in the proper format.
 * @returns 
 */
export function getDateFromString(date: string): Date {
  const parts = date.split('-');
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const day = parseInt(parts[2]);

  const result = new Date(Date.UTC(year, month - 1, day));
  return result;
}

/**
 * This method will delete an assignment from an employee's record, based on employee 
 * identifier and assignment id.
 */
router.delete('/employee/assignment/:id/:asgmt', auth, async(req: Request, res: Response) => {
  try {
    const empID = req.params.id as string;
    const asgmtID = req.params.asgmt as string;

    if (empID !== '' && asgmtID !== '') {
      const employee = await getEmployee(empID);
      employee.removeAssignment(Number(asgmtID));
      await updateEmployee(employee);
      res.status(200).json(employee);
    } else {
      throw new Error('Employee or Assignment ID missing')
    }
  } catch (err) {
    const error = err as Error;
    if (logConnection.employeeLog) {
      logConnection.employeeLog.log(`Error: DeleteEmployeeAssignment: ${error.message}`);
    }
    res.status(400).json({'message': error.message});
  }
});

export default router;