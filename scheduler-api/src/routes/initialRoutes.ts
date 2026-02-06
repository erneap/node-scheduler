import { Request, Response, Router } from "express";
import { Logger } from "scheduler-node-models/general";
import { InitialResponse } from 'scheduler-node-models/scheduler/web';
import { ObjectId } from "mongodb";
import { logConnection, collections } from "scheduler-node-models/config";
import { Employee, IEmployee, IWorkRecord, Work, WorkRecord } from "scheduler-node-models/scheduler/employees";
import { Site } from "scheduler-node-models/scheduler/sites";
import { ITeam, Team } from "scheduler-node-models/scheduler/teams";
import { IUser, User } from "scheduler-node-models/users";
import { auth } from '../middleware/authorization.middleware';

const router = Router();

/**
 * This method is used to pull the initial data to the requesting employee/user.  It
 * consists of the requesting employee's data, their team and site w/the site's 
 * employees and work associated with these employees.
 */
router.get('/initial/:id', auth, async(req: Request, res: Response) => {
  try {
    let initial: InitialResponse = {
      employee: new Employee(),
      site: new Site(),
      team: new Team(),
      exception: ''
    };
    const userid = req.params.id as string;

    // to pull initial data, we start with a user id, then pull the employee's record
    // from the database, then pull the employee's team and search the team sites to 
    // get the employee's site.  After this we will get the employees for the site and
    // then get work for each employee in the site's list, one at a time.
    if (userid) {
      const now = new Date();
      const begin = new Date(Date.UTC(now.getFullYear() - 1, 1, 1));
      const employee = await getEmployee(userid);
      const iData: InitialResponse = await getAllDatabaseInfo(employee.team, 
        employee.site, begin, now);
      initial.employee = employee;
      initial.site = iData.site;
      initial.team = iData.team;
    }
    res.status(200).json(initial);
  } catch (err) {
    const error = err as Error;
    if (logConnection.log) {
      logConnection.log.log(`Error: ${error.message}`);
    }
    res.status(400).json({'message': error.message});
  }
});
    
/**
 * This method will control all pulling of the database information in a more or less
 * synchronized way, based on team, site, company, and a start and end dates.  It will
 * throw an error if the team and site identifier is not provided.
 * @param teamid The string value (or undefined) for the team identifer. 
 * @param siteid The string value (or undefined) for the site identifier.
 * @param start The date object for the start of the report period.
 * @param end The date object for the end of the report period.
 */
export async function getAllDatabaseInfo(teamid: string, siteid: string, 
  start: Date, end: Date): Promise<InitialResponse> {
  let answer: InitialResponse = {
    employee: new Employee(),
    site: new Site(),
    team: new Team(),
    exception: ''
  }
  try {
    if (teamid && teamid !== '' && siteid && siteid !== '') {
      const team = await getTeam(teamid, siteid);
      const site = new Site(team.sites.find(s => s.id.toLowerCase() === siteid.toLowerCase()))
      const employees = await getEmployees(teamid, siteid, start, end);
      site.employees = employees;
      const employeeWorkPromises = 
        site.employees.map(async (emp, e) => {
          const work = await getEmployeeWork(emp.id, start.getFullYear(), 
            end.getFullYear());
          emp.work = work;
          if (site.employees) {
            site.employees[e] = emp;
          }
        });
      await Promise.allSettled(employeeWorkPromises);
      answer.team = team;
      answer.site = site;
    } else {
      throw new Error('TeamID or SiteID empty');
    }
  } catch (error) {
    console.log(error)
  }
  return answer;
}

/**
 * this function will pull all the employee information for the initial data
 * @param empid The string value for the employee's identifier.
 * @returns An employee object, with attached user object for the employee requested.
 */
export async function getEmployee(empid: string): Promise<Employee> {
  const employeeQuery = { _id: new ObjectId(empid) };
  if (collections.employees) {
    // 1) get the employee
    const iEmployee = await collections.employees.findOne<IEmployee>(employeeQuery);
    if (iEmployee && iEmployee !== null) {
      const employee = new Employee(iEmployee);
      const user = await getUser(empid);
      employee.user = user;
      return employee;
    } else {
      throw new Error('No employee found');
    }
  } else {
    throw new Error('No employees collection');
  }
}

/**
 * This function will pull all the user information for the employee.
 * @param empid The string value for the user's identifier.
 * @returns A user object for the user identifier.
 */
export async function getUser(empid: string): Promise<User> {
  const userQuery = { _id: new ObjectId(empid)};
  if (collections.users) {
    const iUser = await collections.users.findOne<IUser>(userQuery);
    if (iUser && iUser !== null) {
      const user = new User(iUser);
      return user;
    } else {
      throw new Error('User not found');
    }
  } else {
    throw new Error('User collection missing');
  }
}

/**
 * This method will provide team and site information while filling in the team's
 * workcodes and an associated company's holidays.
 * @param teamid The string value for the team identifier.
 * @param siteid The string value for the site assocated with the team
 * @returns Nothing, but only returns after all values are placed in their respective
 * class members.
 */
export async function getTeam(teamid: string, siteid: string): Promise<Team> {
  try {
    const teamQuery = { _id: new ObjectId(teamid) };
    const iteam = await collections.teams!.findOne<ITeam>(teamQuery);
    if (iteam) {
      const team = new Team(iteam);
      return team;
    } else {
      throw new Error('no team for id')
    }
  } catch (error) {
    throw error;
  }
}

async function getEmployees(team: string, site: string, start: Date, end: Date): Promise<Employee[]> {
  const employees: Employee[] = [];
  if (collections.employees) {
    const empQuery = { team: new ObjectId(team), site: site };
    const empCursor = await collections.employees.find<IEmployee>(empQuery);
    const result = await empCursor.toArray();
    result.forEach(async(iEmp) => {
      employees.push(new Employee(iEmp));
    });
    employees.sort((a,b) => a.compareTo(b));
  }
  return employees;
}

/**
 * This function will pull the requested employee's work records from the database to
 * provide a single array.
 * @param empid The string value for the employee for the work records to be pulled
 * @param start The numeric value for the starting year for the pull query
 * @param end The number value for the ending year for the pull query
 * @returns An array of work objects to signify the work accompllished by charge number
 * within the start and end years.
 */
async function getEmployeeWork(empid: string, start: number, end: number): Promise<Work[]> {
  const work: Work[] = [];
  if (collections.work) {
    const empID = new ObjectId(empid);
    const workQuery = { 
      employeeID: empID,
      year: { $gte: start, $lte: end }
    };
    const workCursor = collections.work.find<IWorkRecord>(workQuery);
    const workResult = await workCursor.toArray();
    try {
      workResult.forEach(wr => {
        const wRecord = new WorkRecord(wr);
        wRecord.work.forEach(wk => {
          work.push(new Work(wk));
        });
      });
    } catch (error) {
      throw error;
    }
    work.sort((a,b) => a.compareTo(b));
  }
  return work;
}

export async function updateEmployee(emp: IEmployee): Promise<void> {
  const employee = new Employee(emp);
  const query = { _id: new ObjectId(employee.id)};
  employee.user = undefined;
  if (collections.employees) {
    const results = await collections.employees.replaceOne(query, employee);
    if (results.modifiedCount <= 0) {
      throw new Error('Employee not updated');
    }
  } else {
    throw new Error('Employee collection missing');
  }
}

export async function updateUser(usr: User): Promise<void> {
  const user = new User(usr);
  const query = { _id: new ObjectId(user.id )};
  if (collections.users) {
    const results = await collections.users.replaceOne(query, user);
    if (results.modifiedCount <= 0) {
      throw new Error('User not updated');
    }
  } else {
    throw new Error('Users collection missing');
  }
}

export default router;