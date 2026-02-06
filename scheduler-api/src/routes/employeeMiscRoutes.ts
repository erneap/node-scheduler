import { Request, Response, Router } from "express";
import { auth } from '../middleware/authorization.middleware';
import { logConnection, collections } from "scheduler-node-models/config";
import { getEmployee, getTeam, updateEmployee } from "./initialRoutes";
import { EmployeeContactSpecialtyUpdate, EmployeeSpecialtiesUpdate, EmployeeWorkResponse, 
  IWorkRecord, Work, WorkRecord } from "scheduler-node-models/scheduler/employees";
import { ObjectId } from "mongodb";

const router = Router();

/**
 * This method is used to both add and delete specialties from the employees specialty 
 * list.  The add or delete is based on the data.value, a true means add and a false
 * means delete.
 * Steps:
 * 1) Get the specialty data from the request body
 * 2) Get the employee from the database
 * 3) Get the team from the database, based on the employee's information
 * 4) if the data.value is true, Add the specialty, otherwise delete one.
 * 5) Update the employee in the database
 * 6) Respond with the employee to the client
 */
router.put('/employee/specialty', auth, async(req: Request, res: Response) => {
  try {
    const data = req.body as EmployeeContactSpecialtyUpdate;
    if (data) {
      const employee = await getEmployee(data.employee);
      const team = await getTeam(employee.team, employee.site);
      if (Boolean(data.value)) {
        let sortid = 0;
        team.specialties.forEach(sp => {
          if (sp.id === data.typeid) {
            sortid = sp.sort;
          }
        });
        employee.addSpecialty(data.typeid, true, sortid);
      } else {
        employee.deleteSpecialty(data.contactid);
      }
      await updateEmployee(employee);
      res.status(200).json(employee);
    } else {
      throw new Error('Specialty update data missing');
    }
  } catch (err) {
    const error = err as Error;
    if (logConnection.employeeLog) {
      logConnection.employeeLog.log(`Error: UpdateSpecialty: ${error.message}`);
    }
    res.status(400).json({'message': error.message});
  }
});

/**
 * This method is use to update (add/delete) from a list of specialties given.
 * Steps:
 * 1) Get the specialties update data from the request body.
 * 2) Get the employee from the database.
 * 3) Based on the action (add or delete) using the list of specialties.
 * 4) Update the employee in the database
 * 5) Respond with the employee to the client
 */
router.put('/employee/specialties', auth, async(req: Request, res: Response) => {
  try {
    const data = req.body as EmployeeSpecialtiesUpdate;
    if (data) {
      const employee = await getEmployee(data.employee);
      const team = await getTeam(employee.team, employee.site);
      if (data.action.toLowerCase() === 'add') {
        data.specialties.forEach(sid => {
          let sortid = 0;
          team.specialties.forEach(sp => {
            if (sp.id === sid) {
              sortid = sp.sort;
            }
          });
          employee.addSpecialty(sid, true, sortid);
        })
      } else {
        data.specialties.forEach(sid => {
          employee.deleteSpecialty(sid);
        });
      }
      await updateEmployee(employee);
      res.status(200).json(employee);
    } else {
      throw new Error('Specialties update data missing');
    }
  } catch (err) {
    const error = err as Error;
    if (logConnection.employeeLog) {
      logConnection.employeeLog.log(`Error: UpdateSpecialties: ${error.message}`);
    }
    res.status(400).json({'message': error.message});
  }
});

/**
 * This method is used to update an employee's contact information.
 * Steps:
 * 1) Get the contact info data from the request body
 * 2) Get the employee from the database
 * 3) Get the team from the database, based on the employee's information
 * 4) if the contact id is zero, Add the contact info, otherwise delete one.
 * 5) Update the employee in the database
 * 6) Respond with the employee to the client
 */
router.put('/employee/contact', auth, async(req: Request, res: Response) => {
  try {
    const data = req.body as EmployeeContactSpecialtyUpdate;
    if (data) {
      const employee = await getEmployee(data.employee);
      const team = await getTeam(employee.team, employee.site);
      if (data.contactid === 0) {
        let sortid = 0;
        team.contacttypes.forEach(sp => {
          if (sp.id === data.typeid) {
            sortid = sp.sort;
          }
        });
        employee.addContactInfo(data.typeid, data.value, sortid);
      } else {
        employee.deleteContactInfo(data.contactid);
      }
      await updateEmployee(employee);
      res.status(200).json(employee);
    } else {
      throw new Error('Contact Info update data missing');
    }
  } catch (err) {
    const error = err as Error;
    if (logConnection.employeeLog) {
      logConnection.employeeLog.log(`Error: UpdateContactInfo: ${error.message}`);
    }
    res.status(400).json({'message': error.message});
  }
});

/**
 * This method is used to pull a work list for an employee from the database
 * Steps:
 * 1) Get the employee identifer and year for the work to pull
 * 2) Check for the work collection, if not found, send error
 * 3) Pull the work record from the database
 * 4) Create the work response from the data.
 * 5) Respond with the employee work response.
 */
router.get('/employee/work/:id/:year', auth, async(req: Request, res: Response) => {
  try {
    const empID = req.params.id as string;
    const sYear = req.params.year as string;
    if (empID && sYear) {
      const year = Number(sYear);
      if (collections.work) {
        const query = { employeeID: new ObjectId(empID), year: year }
        const iWorkRecord = await collections.work.findOne<IWorkRecord>(query);
        if (iWorkRecord && iWorkRecord !== null) {
          const wRecord = new WorkRecord(iWorkRecord);
          const result: EmployeeWorkResponse = {
            employee: empID,
            year: year,
            work: []
          };
          wRecord.work.forEach(wk => {
            result.work.push(new Work(wk));
          });
          wRecord.work.sort((a,b) => a.compareTo(b));
          res.status(200).json(result);
        } else {
          throw new Error('No work available for employee and year');
        }
      } else {
        throw new Error('Work database collection missing');
      }
    } else {
      throw new Error('Employee ID and/or year missing');
    }
  } catch (err) {
    const error = err as Error;
    if (logConnection.employeeLog) {
      logConnection.employeeLog.log(`Error: GetEmployeeWork: ${error.message}`);
    }
    res.status(400).json({'message': error.message});
  }
});

export default router;