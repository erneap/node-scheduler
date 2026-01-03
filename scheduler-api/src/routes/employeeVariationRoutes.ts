import { Request, Response, Router } from "express";
import { auth } from '../middleware/authorization.middleware';
import { logConnection } from "../config/logging";
import {  ChangeAssignment, Employee, IEmployee, NewEmployeeAssignment } 
  from "scheduler-node-models/scheduler/employees";
import { collections } from "../config/mongoconnect";
import { ObjectId } from "mongodb";
import { IUser, User } from "scheduler-node-models/users";
import { getDateFromString } from "./employeeAssignmentRoutes";
import { getEmployee, updateEmployee } from "./initialRoutes";

const router = Router();

/**
 * This method is called to create a new variation for the employee.  We use a 
 * NewEmployeeAssignment interface for the data structure because much of the information
 * is the same, just don't provide any data not needed.
 * Steps:
 * 1) Get the creation data from the request body.
 * 2) Get the employee from the database.  If not present, throw error.
 * 3) Use the employee addVariation method to add the new variation.
 * 4) Replace the employee record in the database.
 * 5) Respond with the updated employee.
 */
router.post('/employee/variation', async(req: Request, res: Response) => {
  try {
    const data = req.body as NewEmployeeAssignment;
    if (data) {
      const employee = await getEmployee(data.employee);
      employee.addVariation(data.site, data.start);
      await updateEmployee(employee);
      res.status(200).json(employee);
    } else {
      throw new Error('Data not provided')
    }
  } catch (err) {
    const error = err as Error;
    if (logConnection.employeeLog) {
      logConnection.employeeLog.log(`Error: CreateEmployeeVariation: ${error.message}`);
    }
    res.status(400).json({'message': error.message});
  }
});

/**
 * This method is used to update a variation based on the data provided.  We use a 
 * ChangeAssignment interface for the data structure because much of the information is
 * the same, just don't provide data where the variation doesn't need it.  The variation
 * is updated by field.
 * Steps:
 * 1) Get the update data from the request body.
 * 2) Get the employee the variation is attached to.  If not found, throw error
 * 3) Update the value by field name, a switch is provided to determine which field to 
 * update.
 * 4) Replace the employee record in the database.
 * 5) Respond with the employee to the client.
 */
router.put('/employee/variation', async(req: Request, res: Response) => {
  try {
    const data = req.body as ChangeAssignment;
    if (data) {
      const employee = await getEmployee(data.employee);
      employee.variations.sort((a,b) => a.compareTo(b));
      employee.variations.forEach((vari, v) => {
        if (vari.id === data.asgmt) {
          switch (data.field.toLowerCase()) {
            case "site":
              vari.site = data.value;
              break;
            case "mids":
            case "ismids":
              vari.mids = Boolean(data.value);
              break;
            case "dates":
              vari.schedule.showdates = Boolean(data.value);
              break;
            case "start":
            case "startdate":
              vari.startdate = getDateFromString(data.value);
              break;
            case "end":
            case "enddate":
              vari.enddate = getDateFromString(data.value);
              break;
            case "changeschedule":
              vari.schedule.setScheduleDays(Number(data.value));
              break;
            case "workday-code":
            case "workday-workcenter":
            case "workday-hours":
            case "workday-copy":
              const wparts = data.field.split('-');
              if (data.schedule && data.workday) {
                vari.updateWorkday(data.workday, wparts[1], data.value);
              }
              break;
          }
          employee.variations[v] = vari;
        }
      });
      await updateEmployee(employee);
      res.status(200).json(employee);
    } else {
      throw new Error('Data not provided.')
    }
  } catch (err) {
    const error = err as Error;
    if (logConnection.employeeLog) {
      logConnection.employeeLog.log(`Error: UpdateEmployeeVariation: ${error.message}`);
    }
    res.status(400).json({'message': error.message});
  }
});

/**
 * this method will be used to remove a variation from the employee record.
 * Steps:
 * 1) Get the employee and variation id from the request.
 * 2) Pull the employee record, if not present, send error
 * 3) Find the variation within the employee record.  If not found, throw error
 * 4) Delete the variation.
 * 5) Save the modified employee record.
 * 6) Add the employee's user record and send it via the response.
 */
router.delete('/employee/variation/:id/:vari', async(req: Request, res: Response) => {
  try {
    const empID = req.params.id;
    const sVarID = req.params.vari;
    if (empID !== '' && sVarID !== '') {
      const employee = await getEmployee(empID);
      const variID = Number(sVarID);
      let index = -1;
      employee.variations.forEach((vari, v) => {
        if (vari.id === variID) {
          index = v;
        }
      });
      if (index >= 0) {
        employee.variations.splice(index, 1);
      } else {
        throw new Error('Variation not found')
      }
      await updateEmployee(employee);
      res.status(200).json(employee);
    } else {
      throw new Error('Employee or Variation ID missing');
    }
  } catch (err) {
    const error = err as Error;
    if (logConnection.employeeLog) {
      logConnection.employeeLog.log(`Error: DeleteEmployeeVariation: ${error.message}`);
    }
    res.status(400).json({'message': error.message});
  }
});

export default router;