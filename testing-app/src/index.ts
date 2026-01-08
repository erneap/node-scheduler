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

dotenv.config();

const main = async() => {
  await connectToDB();

  const teamCol: Collection | undefined = collections.teams;
  const empCol: Collection | undefined = collections.employees;
  const teamID = '64dad6b14952737d1eb2193f';

  try {
    if (teamCol && empCol) {
      const query = { _id: new ObjectId(teamID)};
      const iTeam = await teamCol.findOne<ITeam>(query);
      if (iTeam && iTeam !== null) {
        const team = new Team(iTeam);
        
        const site = new Site(team.sites.find(s => s.id.toLowerCase() === 'dgsc'));
        console.log(site.id);
        const employees = await getEmployees(teamID, 'dgsc');
        console.log(employees.length);
        site.employees = employees;
        const files: File[] = [];

        const filelist = [ 'XINT-CACI.xlsx', 'GEOINT-All-CACI.xlsx'
        ]

        const basePath = '/Users/antonerne/Downloads';
        const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filelist.forEach(fileName => {
          const filePath = path.join(basePath, fileName);
          const fileBuffer = fs.readFileSync(filePath);

          const file = new File([fileBuffer], fileName, 
            { type: mimeType, 
              lastModified: fs.statSync(filePath).mtimeMs });
          files.push(file);
        });

        console.log('Create ingest object');
        const ingest = new ExcelRowIngest(new Date(), files, team, site, 'CACI');
        ingest.team = team;
        console.log('Starting processing');
        const result = await ingest.Process();

        result.forEach(row => {
          console.log(row.toString());
        });
      }
    } else {
      throw new Error('Collections not available');
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