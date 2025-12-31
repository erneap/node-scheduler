import { Request, Response, Router } from "express";
import { auth } from '../middleware/authorization.middleware';
import { logConnection } from "../config/logging";
import { getEmployee } from "./initialRoutes";
import { Employee, IEmployee } from "scheduler-node-models/scheduler/employees";
import { collections } from "../config/mongoconnect";
import { IUser, User } from "scheduler-node-models/users";
import { ObjectId } from "mongodb";

const router = Router();

/**
 * This method will will provide an employee based on the identifier provided.
 */
router.get('/employee/:id', async(req: Request, res: Response) => {
  try {
    const empID = req.params.id;
    if (empID) {
      const emp = await getEmployee(empID);
      res.status(200).json(emp);
    } else {
      if (logConnection.log) {
        logConnection.log.log(`Error: GetEmployee: No employee identifier`);
      }
    }
  } catch (err) {
    const error = err as Error;
    if (logConnection.log) {
      logConnection.log.log(`Error: GetEmployee: ${error.message}`);
    }
    res.status(400).json({'message': error.message});
  }
});

/**
 * This method is use to create a new employee to the employee list.  If the 
 * employee isn't in the user authentication tables, you add one of these also.
 * 
 * The method of creation is:
 * 1) first to check for a user in the authentation user collection with the email 
 * address given.  
 * 2) If not present, it will create a new user object in the collection using the 
 * first, middle and lastname, plus a password and workgroup of scheduler-employee.
 * 3) Then we check for the user's identifier in the employee collection
 * 4) if not present, create a new employee object with the first, middle and last
 * name, plus set the team and site information.  Then add it to the employee 
 * collection with the primary key (_id) to the user.id.
 * 5) lastly, pass the employee object with user object attached in the response.
 */
router.post('/employee', async(req: Request, res: Response) => {
  try {
    const data = req.body as IEmployee;
    if (data) {
      const colUsers = collections.users;
      const colEmp = collections.employees;
      if (colUsers && colEmp) {
        const userQuery = { 'emailAddress': data.email };
        const iuser = await colUsers.findOne<IUser>(userQuery);
        let user: User = new User();
        if (!iuser || iuser === null) {
          const newUser = new User();
          newUser.firstName = data.name.firstname;
          if (data.name.middlename) {
            newUser.middleName = data.name.middlename;
          }
          newUser.lastName = data.name.lastname;
          newUser.workgroups.push('scheduler-employee');
          
          newUser.setPassword((data.user && data.user.password) ? data.user.password : '');
          const result = await colUsers.insertOne(newUser);
          newUser.id = result.insertedId.toString();
          user = new User(newUser);
        } else {
          user = new User(iuser);
        }
        if (user.id !== '') {
          const empQuery = { _id: new ObjectId(user.id)};
          const iEmp = await colEmp.findOne<IEmployee>(empQuery);
          let employee: IEmployee = new Employee();
          if (!iEmp) {
            employee._id = new ObjectId(user.id);
            employee.id = user.id;
            employee.team = data.team;
            employee.site = data.site;
            employee.name.firstname = data.name.firstname;
            employee.name.middlename = data.name.middlename;
            employee.name.lastname = data.name.lastname;
            employee.name.suffix = data.name.suffix;
            await colEmp.insertOne(employee);
          } else {
            if (iEmp !== null) {
              employee = iEmp;
            }
          }
          const oEmp = new Employee(employee);
          oEmp.user = new User(user);
          res.status(201).json(oEmp);
        }
      } else {
        throw new Error('No User or Employee Collection access');
      }
    } else {
      throw new Error(`No employee identifier`);
    }
  } catch (err) {
    const error = err as Error;
    if (logConnection.log) {
      logConnection.log.log(`Error: GetEmployee: ${error.message}`);
    }
    res.status(400).json({'message': error.message});
  }
});

/**
 * This routine will be used 
 */

export default router;