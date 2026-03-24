import { PoolConnection } from "mariadb/*";
import { ObjectId } from "mongodb";
import { InitialResponse } from 'scheduler-models/scheduler/web';
import { collections } from "./mongoconnect";
import { Employee, IEmployee, Work } from "scheduler-models/scheduler/employees";
import { IUser, SecurityQuestion, User } from "scheduler-models/users";
import { ITeam, Team } from "scheduler-models/scheduler/teams";
import { mdbConnection } from "./sqldb";
import { Site } from "scheduler-models/scheduler/sites";

/**
 * This class definition is used for building an employee's initial data, which
 * consists of the employee with user attached, the employee's team with sites
 * and employees, and the employee's site.
 */
export class BuildInitial {
  private employeeID: string;
  private initialData: InitialResponse;

  constructor(empID?: string) {
    this.employeeID = (empID) ? empID : '';
    this.initialData = { };
  }

  /**
   * This method is used to start the build. 
   * STEPS:
   * 1) Get the employee for the given employee ID.
   * 2) Determine a period for pulling associated work records for all employees
   *  pulled from the database.
   * 3) Pull the team from the database.  This will include all the sites for 
   *  the team.
   * 4) Pull all the employees for the team, then add them to their respective
   *  sites.  Compile a list of employees from this list.
   * 5) Use the compile list of employees to pull employee work records from the
   *  sql database.  Then step through them to add them to their associate site/
   *  employee records.
   * 6) Go through the team sites for the employee's site and add it to the 
   *  response object.
   * 7) Go through the employees for the employee's site and add it to the 
   *  response object.
   * 6) Pull all the available security questions from the sql database and 
   *  add them to the end of the response object.
   * @returns 
   */
  async build(): Promise<InitialResponse> {
    let conn: PoolConnection | undefined;
    try {
      if (this.employeeID === '') {
        throw new Error("Employee not assigned");
      }
      const userMap = new Map<string, User>();
      if (collections.users) {
        const userCursor = collections.users.find<IUser>({});
        const userArray = await userCursor.toArray();
        userArray.forEach(iUser => {
          const user = new User(iUser);
          userMap.set(user.id, user);
        });
      }

      // determine work period for initial pull (this year and last).
      const now = new Date();
      const start = new Date(Date.UTC(now.getFullYear()-1, 0, 1));
      const end = new Date(Date.UTC(now.getFullYear()+1, 0, 1));

      // pull the employee's team from mongodb
      if (this.initialData.employee) {
        if (collections.teams) {
          const query = { _id: new ObjectId(this.initialData.employee.team)};
          const iTeam = await collections.teams.findOne<ITeam>(query);
          if (iTeam) {
            this.initialData.team = new Team(iTeam);
            // compile list of employees active during period
            const employeeIDList: string[] = []
            const empTeamQuery = { team: new ObjectId(this.initialData.employee.team)};
            if (collections.employees) {
              const empCursor = collections.employees.find<IEmployee>(empTeamQuery);
              const empArray = await empCursor.toArray();
              const empPromises = empArray.map(async(iEmp) => {
                const emp = new Employee(iEmp);
                if (emp.isActiveBetween(start, end)) {
                  // get the employee's user object from map
                  const user = userMap.get(emp.id);
                  emp.user = new User(user);
                  // find the site the employee is assigned to and add the employee to
                  // that site.
                  this.initialData.team?.sites.forEach((site, s) => {
                    if (site.id.toLowerCase() === emp.site.toLowerCase()) {
                      if (!site.employees) {
                        site.employees = [];
                      }
                      if (site.employees) {
                        site.employees.push(new Employee(emp));
                      }
                      if (this.initialData.team) {
                        this.initialData.team.sites[s] = site;
                      }
                    }
                  });
                  // then add employee id to list
                  employeeIDList.push(emp.id);
                }
              });
              await Promise.allSettled(empPromises);
            }

            // now that employee id list is compiled, query mariadb for related work 
            // between the dates, then add it to the employee's records within the initial
            // data
            if (employeeIDList.length > 0) {
              if (mdbConnection.pool) {
                conn = await mdbConnection.pool.getConnection();
                const sql = 'SELECT * FROM employeeWork WHERE employeeID IN (?) and '
                  + "dateworked >= ? and dateworked < ? ORDER BY employeeID, dateworked, "
                  + "chargenumber, extension, paycode;";
                const listVals = [ employeeIDList, start, end];
                const results = await conn.query(sql, listVals);
                const workPromises = results.map(async(row: any) => {
                  if (this.initialData.team) {
                    let found = false;
                    this.initialData.team.sites.forEach((site, s) => {
                      if (!found) {
                        if (site.employees) {
                          site.employees.forEach((emp, e) => {
                            if (!found) {
                              if (emp.id && emp.id === row.employeeID) {
                                found = true;
                                if (!emp.work) {
                                  emp.work = [];
                                }
                                if (emp.work) {
                                  emp.work.push(new Work({
                                    dateworked: new Date(row.dateworked),
                                    chargenumber: row.chargenumber,
                                    extension: row.extension,
                                    paycode: Number(row.paycode),
                                    modtime: (row.modtime === '1' || row.modtime === 1),
                                    hours: Number(row.hours)
                                  }));
                                }
                                if (site.employees) {
                                  site.employees[e] = emp;
                                }
                              }
                            }
                          });
                          if (found && this.initialData.team) {
                            this.initialData.team.sites[s] = site;
                          }
                        }
                      }
                    })
                  }
                });
                await Promise.allSettled(workPromises);
              }
            }

          } else {
            throw new Error('Employee Team not found');
          }
        } else {
          throw new Error('Team collection unavailable');
        }
      } else {
        throw new Error('No initial employee to pull team');
      }

      // Get the employee's site from the team object
      if (this.initialData.team) {
        let found = false;
        this.initialData.team.sites.forEach(site => {
          if (!found && this.initialData.employee) {
            const tUser = new User(this.initialData.employee.user);
            if (site.id.toLowerCase() === this.initialData.employee?.site.toLowerCase()) {
              this.initialData.site = new Site(site);
              if (site.employees) {
                site.employees.forEach(emp => {
                  if (!found && this.initialData.employee 
                    && emp.id === this.employeeID) {
                    this.initialData.employee = new Employee(emp);
                    this.initialData.employee.user = tUser;
                    found = true;
                  }
                });
              }
            }
          }
        });
      }

      // pull the security questions from mariadb.
      if (!this.initialData.questions) {
        this.initialData.questions = [];
        const sql = "SELECT * FROM questions ORDER BY id;";
        const results = await conn?.query(sql);
        results.forEach((row: any) => {
          if (this.initialData.questions) {
            this.initialData.questions.push(new SecurityQuestion({
              id: Number(row.id),
              question: row.question
            }));
          }
        });
      }
    } catch (err) {
      console.log(err);
    } finally {
      if (conn) conn.release();
    }
    return this.initialData;
  }
}