import dotenv from 'dotenv';
import { collections, connectToDB } from './config/mongoconnect';
import { Collection, ObjectId } from 'mongodb';
import { ITeam, Team } from 'scheduler-node-models/scheduler/teams';
import { ExcelRowIngest } from 'scheduler-node-models/scheduler/ingest'
import * as fs from 'fs';
import * as path from 'path';
import { Site } from 'scheduler-node-models/scheduler/sites';
import { Employee, IEmployee } from 'scheduler-node-models/scheduler/employees';
import { IUser, User } from 'scheduler-node-models/users';
import { ManualExcelReport } from './reports/mexcel';

dotenv.config();

const main = async() => {
  await connectToDB();

  const teamID = '64dad6b14952737d1eb2193f';
  const siteID = 'dgsc';
  const companyID = 'caci';
  const month = new Date(Date.UTC(2026, 0, 1));
  const userID = '63a39b8255247905bd993e1f';

  const userCol = collections.users;

  try {
    if (userCol) {
      let user = new User();
      
      const userQuery = { _id: new ObjectId(userID)};
      if (collections.users) {
        const iUser = await collections.users.findOne<IUser>(userQuery);
        if (iUser) {
          user = new User(iUser);
        }
      }
      const report = new ManualExcelReport();
      const workbook = await report.create(user, month, teamID, siteID, companyID);
      const formatter = Intl.DateTimeFormat('en-US', {
        month: 'short',
        year: 'numeric'
      });

      let rptname = '/Users/antonerne/Downloads/'
        + `${companyID.toUpperCase()}-${formatter.format(month)}.xlsx`;
      let contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      await workbook.xlsx.writeFile(rptname)
    } else {
      throw new Error('User collection not present');
    }
  } catch (error) {
    console.log(error);
  }
  process.exit(0);
}


/**
 * This function will pull all the user information for the employee.
 * @param empid The string value for the user's identifier.
 * @returns A user object for the user identifier.
 */
async function getUser(empid: string): Promise<User> {
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

async function getEmployees(team: string, site: string): Promise<Employee[]> {
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

main();