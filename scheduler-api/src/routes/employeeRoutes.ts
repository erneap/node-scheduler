import { Request, Response, Router } from "express";
import { auth } from '../middleware/authorization.middleware';
import { Employee, IEmployee } from "scheduler-models/scheduler/employees";
import { IUser, User } from "scheduler-models/users";
import { ObjectId } from "mongodb";
import { UpdateRequest } from "scheduler-models/general";
import { SecurityQuestion } from "scheduler-models/users/question";
import { genSaltSync, hashSync } from "bcrypt-ts";
import { BuildInitial, collections, EmployeeService, logConnection, postLogEntry, UserService } from "scheduler-services";

const router = Router();

/**
 * This method will will provide an employee based on the identifier provided.
 */
router.get('/employee/:id', auth, async(req: Request, res: Response) => {
  try {
    const empID = req.params.id as string;
    if (empID) {
      const build = new BuildInitial(empID);
      const initial = await build.build();
      if (initial.employee) {
        res.status(200).json(initial.employee);
      } else {
        throw new Error('Employee not found');
      }
    } else {
      throw new Error('Employee ID not provided')
    }
  } catch (err) {
    const error = err as Error;
    await postLogEntry('employee', `employee: Get: Error: ${error.message}`);
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
router.post('/employee', auth, async(req: Request, res: Response) => {
  try {
    const data = req.body as IEmployee;
    if (data) {
      const empService = new EmployeeService();
      const employee = await empService.insert(data);
      const user = new User(employee.user);
      user.workgroups.push('scheduler-employee');
  
      const salt = genSaltSync(12)
      const hash = hashSync((data.user && data.user.password) 
        ? data.user.password : '', salt);
      user.password = hash;
      user.passwordExpires = new Date();
      user.badAttempts = 0;

      const userService = new UserService();
      userService.replace(user);
      res.status(200).json(employee);
    } else {
      throw new Error(`No employee identifier`);
    }
  } catch (err) {
    const error = err as Error;
    await postLogEntry('employee', `employee: Post: Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  }
});

/**
 * This routine will be used to update the basic employee information to include
 * name info, company info, change the email address, add and subtract other email
 * address, security questions, permission groups, and set password.
 */
router.put('/employee', auth, async(req: Request, res: Response) => {
  try {
    const data = req.body as UpdateRequest
    if (data) {
      switch (data.field.toLowerCase()) {
        case "first":
        case "firstname":
        case "middle":
        case "middlename":
        case "last":
        case "lastname":
          await modifyEmployee(data.id, data.field, data.value);
          await modifyUser(data.id, data.field, data.value);
          break;
        case "email":
        case "emailaddress":
        case "addemail":
        case "removeemail":
        case "updateemail":
        case "password":
        case "unlock":
        case "addworkgroup":
        case "addperm":
        case "addpermission":
        case "removeworkgroup":
        case "remove":
        case "removeperm":
        case "removepermission":
        case "securityquestion":
        case "securityanswer":
          await modifyUser(data.id, data.field, data.value, data.optional);
          break;
        case "suffix":
        case "company":
        case "employeeid":
        case "companyid":
        case "alternateid":
        case "alternate":
        case "jobtitle":
        case "title":
        case "rank":
        case "grade":
        case "costcenter":
        case "division":
          await modifyEmployee(data.id, data.field, data.value);
          break;
      }
      // pull the employee from the database 
      const empService = new EmployeeService();
      const employee = await empService.get(data.id);
      // return the employee object to the client.
      res.status(200).json(employee);
    } else {
      throw new Error("No request data")
    }
  } catch (err) {
    const error = err as Error;
    await postLogEntry('employee', `employee: Put: Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  }
});

/**
 * This function will be used to update a field within a particular user object.
 * @param id The string value of the user/employee identifier, used by the collection.
 * @param field The field within the user object to be updated
 * @param value The string value to place in the user field.
 * @param opt A string value to be used as a second value.  It is used by the updateemail
 * and security question/answer.  The secruity question or answer will be converted to an
 * integer to identify which security question/answer to update.
 * @returns The resultant user object that has been updated.
 */
async function modifyUser(id: string, field: string, value: string, 
  opt?: string): Promise<void> {
  const userService = new UserService();
  const user = await userService.get(id);
  switch (field.toLowerCase()) {
    case "first":
    case "firstname":
      user.firstName = value;
      break;
    case "middle":
    case "middlename":
      user.middleName = value;
      break;
    case "last":
    case "lastname":
      user.lastName = value;
      break;
    case "email":
    case "emailaddress":
      user.emailAddress = value;
      break;
    case "addemail":
      user.addAdditionalEmail(value);
      break;
    case "removeemail":
      user.deleteAdditionalEmail(value);
      break;
    case "updateemail":
      if (opt) {
        user.deleteAdditionalEmail(opt);
      } 
      user.addAdditionalEmail(value);
      break;
    case "password":
      const salt = genSaltSync(12)
      const hash = hashSync(value, salt);
      user.password = hash;
      user.passwordExpires = new Date();
      user.badAttempts = 0;
      break;
    case "unlock":
      user.badAttempts = 0;
      break;
    case "addworkgroup":
    case "addperm":
    case "addpermission":
      user.workgroups.push(value);
      break;
    case "removeworkgroup":
    case "remove":
    case "removeperm":
    case "removepermission":
      let index = -1;
      user.workgroups.forEach((wg, i) => {
        if (value.toLowerCase() === wg.toLowerCase()) {
          index = i;
        }
      });
      if (index >= 0) {
        user.workgroups.splice(index, 1);
      }
      break;
    case "securityquestion":
      while (user.questions.length < 3) {
        user.questions.push(new SecurityQuestion());
      }
      user.questions.sort((a,b) => a.compareTo(b));
      if (opt) {
        const qID = Number(opt);
        const question = user.questions[qID];
        question.question = value;
        user.questions[qID] = question;
      }
      break;
    case "securityanswer":
      while (user.questions.length < 3) {
        user.questions.push(new SecurityQuestion());
      }
      user.questions.sort((a,b) => a.compareTo(b));
      if (opt) {
        const qID = Number(opt);
        const question = user.questions[qID];
        const salt = genSaltSync(12)
        const hash = hashSync(value, salt);
        question.answer = hash;
        user.questions[qID] = question;
      }
      break;
  }
  await userService.replace(user);
}

/**
 * This function will be used by the update employee router method to update a particular
 * field in the employee, or throw an error.
 * @param id The string value of the user/employee identifier, used by the collection.
 * @param field The field within the employee object to be updated
 * @param value The string value to place in the employee field.
 * @returns The resultant employee object with the new field data.
 */
async function modifyEmployee(id: string, field: string, value: string): 
  Promise<void> {
  const empService = new EmployeeService();
  const employee = await empService.get(id);
  // update the employee by the field given.
  switch (field.toLowerCase()) {
    case "first":
    case "firstname":
      employee.name.firstname = value;
      break;
    case "middle":
    case "middlename":
      employee.name.middlename = value;
      break;
    case "last":
    case "lastname":
      employee.name.lastname = value;
      break;
    case "suffix":
      employee.name.suffix = value;
      break;
    case "company":
      employee.companyinfo.company = value;
      break;
    case "employeeid":
    case "companyid":
      employee.companyinfo.employeeid = value;
      break;
    case "alternateid":
    case "alternate":
      employee.companyinfo.alternateid = value;
      break;
    case "jobtitle":
    case "title":
      employee.companyinfo.jobtitle = value;
      break;
    case "rank":
    case "grade":
      employee.companyinfo.rank = value;
      break;
    case "costcenter":
      employee.companyinfo.costcenter = value;
      break;
    case "division":
      employee.companyinfo.division = value;
      break;
  }
  await empService.replace(employee);
}

/**
 * This method will be used to delete an employee and associated user record from the
 * database.  The input is from the request parameters giving the employee id to delete
 * and an identifier for the employee/supervisor deleting the employee.
 * Steps:
 * 1) Pull the identifier and the by identifier from the parameter statement
 * 2) Pull the employee performing the delete, record his/her name.
 * 3) Pull the employee being deleted.  record his/her name.
 * 4) Attempt to delete the employee, if successful, log the deletion into the log
 * 5) Attempt to delete the employee's user record, if successful, log the deletion into 
 * the log.
 * 6) return a message saying the deletion was completed. 
 * If any error is throws, send the error message.
 */
router.delete('/employee/:id/:by', auth, async(req: Request, res: Response) => {
  try {
    const empService = new EmployeeService();
    const userService = new UserService();
    const empID = req.params.id as string;
    const byID = req.params.by as string;
    let byName = '';
    let name = '';
    if (byID) {
      const byUser = await userService.get(byID);
      byName = byUser.getFirstLast();
    }
    if (empID) {
      const employee = await empService.get(empID);
      name = employee.name.getFirstLast();
      await empService.remove(empID);
      await postLogEntry('employee', `Employee Deleted: ${name}, by: ${byName}`);
    }
    res.status(200).json({'message': 'employee deleted'});
  } catch (err) {
    const error = err as Error;
    await postLogEntry('employee', `employee: Delete: Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  }
});

export default router;