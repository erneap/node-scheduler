import { PoolConnection } from "mariadb/*";
import { ITeam, Team } from "scheduler-models/scheduler/teams";
import { collections } from "./mongoconnect";
import { ObjectId } from "mongodb";
import { Employee, IEmployee, Work } from "scheduler-models/scheduler/employees";
import { IUser, User } from "scheduler-models/users";
import { mdbConnection } from "./sqldb";

export class TeamService {

  /**
   * This method will be used to pull the team information to include all sites
   * and their respective employees.
   * STEPS:
   * 1) Pull the team from the database.
   * 2) Pull the employees from the database that are associated with this team.
   *  THen add them to their associated sites. Create an array of employee 
   *  identifiers from this pull.
   * 3) Pull the associated user objects from the database and add them to their 
   *  respective employee objects.
   * 4) Pull the associated employee work records for the employees and add them
   *  to their respective employee objects.
   * @param teamid The string value for the team identifier.
   * @returns The team object for the identifier given.
   */
  async GetTeam(teamid: string): Promise<Team | undefined> {
    let team: Team | undefined = undefined;
    let conn: PoolConnection | undefined;
    try {
      if (collections.teams) {
        if (teamid !== '') {
          const query = { _id: new ObjectId(teamid)};
          const iTeam = await collections.teams.findOne<ITeam>(query);
          if (iTeam) {
            team = new Team(iTeam);

            // pull employees for the sites
            if (collections.employees) {
              const empQuery = { team: new ObjectId(teamid) };
              const empCursor = collections.employees.find<IEmployee>(empQuery);
              const empArray = await empCursor.toArray();
              const empList: string[] = [];
              const empPromises = empArray.map(async(emp) => {
                let found = false;
                team.sites.forEach((site, s) => {
                  if (!found && site.id.toLowerCase() === emp.site.toLowerCase()) {
                    const employee = new Employee(emp);
                    site.employees.push(employee);
                    empList.push(employee.id);
                    team.sites[s] = site;
                    found = true;
                  }
                });
              });
              await Promise.allSettled(empPromises);

              // pull users for the employees
              if (collections.users) {
                const userList:ObjectId[] = [];
                empList.forEach(empID => {
                  userList.push(new ObjectId(empID));
                });
                const userQuery = { _id: { '$in': userList }};
                const userCursor = collections.users.find<IUser>(userQuery);
                const userArray = await userCursor.toArray();
                const userPromises = userArray.map(async(iUser) => {
                  const user = new User(iUser);
                  let found = false;
                  team.sites.forEach((site, s) => {
                    if (!found) {
                      site.employees.forEach((emp, e) => {
                        if (!found && emp.id === user.id) {
                          emp.user = user;
                          site.employees[e] = emp;
                          team.sites[s] = site;
                          found = true;
                        }
                      });
                    }
                  });
                  await Promise.allSettled(userPromises);
                });
              }

              // pull work records for the employees
              if (mdbConnection.pool) {
                conn = await mdbConnection.pool.getConnection();
                const now = new Date();
                const start = new Date(Date.UTC(now.getFullYear() - 1, 0, 1));
                const end = new Date(Date.UTC(now.getFullYear() + 1, 0, 1));
                const sql = "SELECT * FROM employeeWork WHERE employeeID in ( "
                  + "? ) AND dateworked >= ? AND dateworked < ? ORDER BY "
                  + "employeeID, dateworked, chargenumber, extension, paycode;";
                const workVals = [ empList, start, end ];
                const result = await conn.query(sql, workVals);
                const workPromises = result.map((wk: any) => {
                  let found = false;
                  team.sites.forEach((site, s) => {
                    if (!found) {
                      site.employees.forEach((emp, e) => {
                        if (!found && emp.id === wk.employeeID) {
                          if (!emp.work) {
                            emp.work = [];
                          }
                          if (emp.work) {
                            emp.work.push(new Work({
                              dateworked: new Date(wk.dateworked),
                              chargenumber: wk.chargenumber,
                              extension: wk.extension,
                              paycode: Number(wk.paycode),
                              modtime: (wk.modtime) ? (wk.modtime.toLowerCase() === 'true') : undefined,
                              hours: Number(wk.hours)
                            }));
                            found = true;
                            site.employees[e] = emp;
                            team.sites[s] = site;
                          }
                        }
                      });
                    }
                  });
                });
                await Promise.allSettled(workPromises);
              }
            }
          } else {
            throw new Error('Team not found')
          }
        } else {
          throw new Error('Team identifier not provided');
        }
      } else {
        throw new Error('No team collection provided');
      }
    } catch (err) {

    } finally {
      if (conn) conn.release();
    }

    return team;
  }
}