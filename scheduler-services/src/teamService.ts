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
  async getTeam(teamid: string): Promise<Team | undefined> {
    let team: Team | undefined = undefined;
    let conn: PoolConnection | undefined;
    try {
      const userMap = new Map<string, User>();
      if (collections.users) {
        const userCursor = collections.users.find<IUser>({});
        const userArray = await userCursor.toArray();
        userArray.forEach(iUser => {
          const user = new User(iUser);
          userMap.set(user.id, user);
        });
      }
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
                    const user = userMap.get(employee.id);
                    if (user) {
                      employee.user = user;
                    }
                    site.employees.push(employee);
                    empList.push(employee.id);
                    team.sites[s] = site;
                    found = true;
                  }
                });
              });
              await Promise.allSettled(empPromises);

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
                              modtime: (wk.modtime === '1' || wk.modtime === 1),
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
      console.log(err.stackTrace)
      throw err;
    } finally {
      if (conn) conn.release();
    }

    return team;
  }

  /**
   * This method is used to create a new team in the database.  A new team usually 
   * consists of just a name for the team, so it is processed as the object without any
   * other preparation.
   * @param team The team interface containing the new team values.
   * @returns A team object for the new team.
   */
  async insertTeam(iTeam: ITeam): Promise<Team> {
    try {
      if (collections.teams) {
        let team = new Team(iTeam);
        if (!iTeam._id || iTeam._id.toString() === '' || iTeam._id.toString() === '0') {
          const result = await collections.teams.insertOne(team);
          team.id = result.insertedId.toString();
        } else {
          if (team.sites.length > 0) {
            // sites are included so remove employees from each site before update
            team.sites.forEach((site, s) => {
              site.employees = undefined;
              team.sites[s] = site;
            });
          }
          const query = { _id: new ObjectId(team.id)};
          const result = await collections.teams.replaceOne(query, team);
        }
        team = await this.getTeam(team.id);
        return team;
      } else {
        throw new Error('No team collection provided');
      }
    } catch (err) {
      throw err;
    }
  }

  /**
   * This method is used to update/replace a team in the database.
   * @param iTeam The team interface with the updated data.
   * @returns A team object with the new data included.
   */
  async replaceTeam(iTeam: ITeam): Promise<Team> {
    try {
      let team = new Team(iTeam);
      // since sites can include employees and this isn't a part of the team object, 
      // we must remove them from the object before replacement, 
      if (collections.teams) {
        const query = { _id: new ObjectId(team.id) };
        team.sites.forEach((site, s) => {
          site.employees = undefined;
          team.sites[s] = site;
        });
        await collections.teams.replaceOne(query, team);
        team = await this.getTeam(team.id);
        return team;
      } else {
        throw new Error('No team collections provided');
      }
    } catch (err) {
      throw err;
    }
  }

  /**
   * The method is used to remove a team from the database.  Almost all data in the 
   * databases are associated with a team or an employee, and to prevent orphan records 
   * for employees and associated data, all employee records for this team will be 
   * removed at the same time.  This will be done via a list of employees.
   * @param teamid The string value for the team identifier.
   */
  async deleteTeam(teamid: string): Promise<void> {
    let conn: PoolConnection | undefined;
    try {
      if (collections.teams) {
        // first get a list of employees associated with this team.
        const empList: string[] = [];
        if (collections.employees) {
          const empQuery = { team: new ObjectId(teamid)};
          const empCursor = collections.employees.find<IEmployee>(empQuery);
          const empArray = await empCursor.toArray();
          empArray.forEach(emp => {
            empList.push(emp._id.toString());
          });
          await collections.employees.deleteMany(empQuery);
        }
        if (mdbConnection.pool) {
          conn = await mdbConnection.pool.getConnection();
          // delete all work for team employees
          let sql = 'DELETE FROM employeeWork WHERE employeeID in ( ? );';
          const empVals = [ empList ];
          await conn.query(sql, empVals );

          // delete all notices for employees in list, both sender and receiver
          sql = "DELETE FROM notices WHERE sender in ( ? ) OR receiver in ( ? )";
          const empVals2 = [empList, empList];

          await conn.query(sql, empVals2);
        }
        const query = { _id: new ObjectId(teamid)};
        await collections.teams.deleteOne(query);
      } else {
        throw new Error('No team collections provided')
      }
    } catch (err) {
      throw err;
    } finally {
      if (conn) conn.release;
    }
  }

  /**
   * This method will provide a complete list of teams in the database.
   * @returns An array of all team objects in the database.
   */
  async getAllTeams(): Promise<Team[]> {
    const answer: Team[] = [];
    try {
      if (collections.teams) {
        const teamCursor = collections.teams.find<ITeam>({});
        const teamArray = await teamCursor.toArray();
        teamArray.forEach(tm => {
          answer.push(new Team(tm));
        });
        answer.sort((a,b) => (a.name < b.name) ? -1 : 1);
        return answer;
      } else {
        throw new Error('No team collection provided');
      }
    } catch (err) {
      throw err;
    }
    return answer;
  }
}