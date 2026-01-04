import { Request, Response, Router } from "express";
import { auth } from '../middleware/authorization.middleware';
import { logConnection } from "../config/logging";
import { getEmployee, getUser, updateEmployee, updateUser } from "./initialRoutes";
import { AnnualLeave, Employee, IEmployee, NewLeaveBalance, UpdateLeaveBalance } from "scheduler-node-models/scheduler/employees";

const router = Router();

/**
 * This method will add a new leave balance object, if the leave balance for 
 * the employee and year is not present.  To add a new balance, we need to 
 * calculate the amount of PTO available as of 1/1 of the year to use as carry over
 * from the previous year and carry the annual leave from the previous year.
 * Steps:
 * 1)  Get the new leave balance data (employee id and year) from the request body.
 * 2)  Pull the employee from the database.
 * 3)  Check to see if balance already present.  Send error if already present.
 * 4)  If not present, calculate the PTO available at end of year from the previous
 * year's annual leave plus carryover, then subtract any PTO from that year to get
 * a balance as of the end of the year.
 * 5)  Create the leave balance record for the requested year, using the previous year's
 * annual leave and the calculated value for carry over.  Add this to the employee's
 * leave balance list.
 * 6)  Update the employee in the database.
 * 7)  Respond with the updated employee object.
 */
router.post('/employee/balance', async(req: Request, res: Response) => {
  try {
    const data = req.body as NewLeaveBalance;
    if (data) {
      const employee = await getEmployee(data.employee);
      // determine if year is already in the list
      let found = false;
      let previous = 0.0;
      let annual = 0.0;
      employee.balances.forEach(bal => {
        if (bal.year === data.year) {
          found = true;
        } else if (bal.year === data.year - 1) {
          previous = bal.annual + bal.carryover;
          annual = bal.annual;
        }
      });
      if (!found) { 
        const start = new Date(Date.UTC(data.year - 1, 0, 1));
        const end = new Date(data.year, 0, 1);
        employee.leaves.forEach(lv => {
          if (lv.code.toLowerCase() === 'p' && lv.leavedate.getTime() >= start.getTime()
            && lv.leavedate.getTime() < end.getTime()) {
            previous -= lv.hours;
          }
        });
        if (previous > 40.0) {
          previous = 40.0;
        }
        employee.balances.push(new AnnualLeave({
          year: data.year,
          annual: annual,
          carryover: previous
        }));
        await updateEmployee(employee);
        res.status(201).json(employee);
      } else {
        throw new Error('Year already created');
      }
    } else {
      throw new Error('New Leave Balance data missing');
    }
  } catch (err) {
    const error = err as Error;
    if (logConnection.employeeLog) {
      logConnection.employeeLog.log(`Error: CreateEmployeeLeaveBalance: ${error.message}`);
    }
    res.status(400).json({'message': error.message});
  }
});

/**
 * This method will be used to update an employee's year leave balance.  
 * Steps:
 * 1) Get the update data from the request body.
 * 2) Get the employee from the database.
 * 3) Loop through the current leave balances to find the requested year.
 * 4) if Found, update the requested field with the value given.
 * 5) if not found, throw error message
 * 6) Update the employee record in the database.
 * 7) Respond with the update employee object.
 */
router.put('/employee/balance', async(req: Request, res: Response) => {
  try {
    const data = req.body as UpdateLeaveBalance;
    if (data) {
      const employee = await getEmployee(data.employee);
      let found = false;
      employee.balances.forEach((bal, b) => {
        if (bal.year === data.year) {
          found = true;
          switch (data.field.toLowerCase()) {
            case "annual":
              bal.annual = data.value;
              break;
            case 'carry':
            case 'carryover':
              bal.carryover = data.value;
              break;
          }
          employee.balances[b] = bal;
        }
      });
      if (!found) {
        throw new Error(`Leave Balance not found - ${data.year}`);
      }
      await updateEmployee(employee);
      res.status(200).json(employee);
    } else {
      throw new Error('Update Leave Balance data missing');
    }
  } catch (err) {
    const error = err as Error;
    if (logConnection.employeeLog) {
      logConnection.employeeLog.log(`Error: UpdateEmployeeLeaveBalance: ${error.message}`);
    }
    res.status(400).json({'message': error.message});
  }
});

/**
 * This method will remove a leave balance object from the employee.
 * Steps:
 * 1) Get the employee id and year values from the request parameters.
 * 2) Get the employee record from the database
 * 3) Check for the year in the employee's balance list.
 * 4) Remove it if found, or throw error if not found.
 * 5) Update the employee in the database
 * 6) Response with the employee object.
 */
router.delete('/employee/balance/:id/:year', async(req: Request, res: Response) => {
  try {
    const empID = req.params.id;
    const syear = req.params.year;
    if (empID && syear) {
      const year = Number(syear);
      const employee = await getEmployee(empID);
      let found = -1;
      employee.balances.forEach((bal, b) => {
        if (bal.year === year) {
          found = b;
        }
      });
      if (found >= 0) {
        employee.balances.splice(found, 1);
      } else {
        throw new Error(`Leave Balance Year not found - ${year}`);
      }
      await updateEmployee(employee);
      res.status(200).json(employee);
    } else {
      throw new Error('Employee ID or year missing');
    }
  } catch (err) {
    const error = err as Error;
    if (logConnection.employeeLog) {
      logConnection.employeeLog.log(`Error: DeleteEmployeeLeaveBalance: ${error.message}`);
    }
    res.status(400).json({'message': error.message});
  }
});

export default router;