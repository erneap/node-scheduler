import { Request, Response, Router } from "express";
import { auth } from '../middleware/authorization.middleware';
import { logConnection } from "../config/logging";
import { Assignment, Employee, IEmployee, NewEmployeeAssignment } from "scheduler-node-models/scheduler/employees";
import { collections } from "../config/mongoconnect";
import { ObjectId } from "mongodb";

const router = Router();

router.post('/employee/assignment', async(req: Request, res: Response) => {
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
      logConnection.employeeLog.log(`Error: GetEmployee: ${error.message}`);
    }
    res.status(400).json({'message': error.message});
  }
});

export default router;