import { Request, Response, Router } from "express";
import { auth } from '../middleware/authorization.middleware';
import { logConnection } from "../config/logging";
import { Assignment, ChangeAssignment, Employee, IEmployee, NewEmployeeAssignment } from "scheduler-node-models/scheduler/employees";
import { collections } from "../config/mongoconnect";
import { ObjectId } from "mongodb";
import { IUser, User } from "scheduler-node-models/users";

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
      const colEmp = collections.employees;
      if (colEmp) {
        const query = { _id: new ObjectId(data.employee)};
        const iEmp = await colEmp.findOne<IEmployee>(query);
        if (iEmp !== null) {
          const employee = new Employee(iEmp);
          employee.assignments.sort((a,b) => a.compareTo(b));
          employee.addAssignment(data.site, data.workcenter, start);
          employee.assignments.sort((a,b) => a.compareTo(b));
          if (data.scheduledays > 0) {
            employee.assignments[employee.assignments.length - 1]
              .changeScheduleDays(0, data.scheduledays)
          }
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
router.put('/employee/assignment', async(req: Request, res: Response) => {
  try {
    const data = req.body as ChangeAssignment;
    if (data) {
      const query = { _id: new ObjectId(data.employee)};
      const colEmp = collections.employees;
      if (colEmp) {
        const iEmp = await colEmp.findOne<IEmployee>(query);
        if (iEmp) {
          const employee = new Employee(iEmp);
          employee.assignments.sort((a,b) => a.compareTo(b));
          employee.assignments.forEach((asgmt, i) => {
            if (asgmt.id === data.asgmt) {
              switch (data.field.toLowerCase()) {
                case "site":
                  asgmt.site = data.value;
                  break;
                case "workcenter":
                  asgmt.workcenter = data.value;
                  break;
                case "start":
                case "startdate":
                  asgmt.startDate = getDateFromString(data.value);
                  break;
                case "end":
                case "enddate":
                  asgmt.endDate = getDateFromString(data.value);
                  break;
                case "rotationdate":
                  asgmt.rotationdate = getDateFromString(data.value);
                  break;
                case "rotationdays":
                  asgmt.rotationdays = Number(data.value);
                  break;
                case "addschedule":
                  asgmt.addSchedule(Number(data.value));
                  break;
                case "removeschedule":
                  if (data.schedule) {
                    asgmt.removeSchedule(data.schedule);
                  }
                  break;
                case "scheduledays":
                  if (data.schedule) {
                    asgmt.changeScheduleDays(data.schedule, Number(data.value));
                  }
                  break;
                case "workday-code":
                case "workday-workcenter":
                case "workday-hours":
                case "workday-copy":
                  const wparts = data.field.split('-');
                  if (data.schedule && data.workday) {
                    asgmt.updateWorkday(data.schedule, data.workday, wparts[1], data.value);
                  }
                  break;
              }
              employee.assignments[i] = asgmt;
            }
          });
          await colEmp.replaceOne(query, employee);
          const colUsers = collections.users;
          if (colUsers) {
            const iUser = await colUsers.findOne<IUser>(query)
            if (iUser) {
              employee.user = new User(iUser);
            }
          }
          res.status(200).json(employee);
        } else {
          throw new Error('Employee not found');
        }
      } else {
        throw new Error('Employee collection missing');
      }
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
function getDateFromString(date: string): Date {
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
router.delete('/employee/assignment/:id/:asgmt', async(req: Request, res: Response) => {
  try {
    const empID = req.params.id;
    const asgmtID = req.params.asgmt;

    if (empID !== '' && asgmtID !== '') {
      const query = { _id: new ObjectId(empID)};
      const colEmp = collections.employees;
      if (colEmp) {
        const iEmp = await colEmp.findOne<IEmployee>(query);
        const asID = Number(asgmtID);
        if (iEmp) {
          const employee = new Employee(iEmp);
          let found = -1;
          employee.assignments.forEach((asgmt, a) => {
            if (asgmt.id === asID) {
              found = a;
            }
          });
          if (found >= 0) {
            employee.assignments.splice(found, 1);
          } else {
            throw new Error(`Assignment not found: ${asID}`);
          }
          await colEmp.replaceOne(query, employee);
          const colUsers = collections.users;
          if (colUsers) {
            const iUser = await colUsers.findOne<IUser>(query)
            if (iUser) {
              employee.user = new User(iUser);
            }
          }
        } else {
          throw new Error("Employee not found");
        }
      }

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