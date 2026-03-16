import { Employee, IEmployee, IWork, Work } from "scheduler-models/scheduler/employees";
import { collections } from "./mongoconnect";
import { ObjectId } from "mongodb";
import { IUser, User } from "scheduler-models/users";
import { mdbConnection } from "./sqldb";
import { PoolConnection } from "mariadb/*";

/**
 * This class definition will be used to get, insert, replace and/or delete employees from
 * the mongo database, employees collection.
 */
export class EmployeeService {
  /**
   * This method will be used to retrieve or get a user from the database.
   * @param userid The string value for the user's identifier.
   * @returns A user object for the user identifier given.
   */
  async get(userid: string): Promise<Employee> {
    let employee = new Employee();
    if (userid === '') {
      throw new Error('No user id given');
    }
    if (collections.employees) {
      const query = { _id: new ObjectId(userid)};
      const iEmp = await collections.employees.findOne<IEmployee>(query);
      if (iEmp) {
        employee = new Employee(iEmp);
        // an employee includes a user object from the users collection
        if (collections.users) {
          const iUser = await collections.users.findOne<IUser>(query);
          if (iUser) {
            employee.user = new User(iUser);
          }
        }

        // it also include work records from the sql database, standard is for last year's
        // and this year's records
        if (mdbConnection.pool) {
          let conn: PoolConnection | undefined;
          try {
            employee.work = [];
            conn = await mdbConnection.pool.getConnection();
            const now = new Date();
            const begin = new Date(Date.UTC(now.getUTCFullYear() - 1, 0, 1));
            const end = new Date(Date.UTC(now.getUTCFullYear() + 1, 0, 1));
            const sql = 'SELECT * FROM employeeWork WHERE employeeID=? AND dateworked >= '
              + '? AND dateworked < ? ORDER BY dateworked, chargenumber, extension, '
              + 'paycode;';
            const values = [ userid, begin, end ];
            const results = await conn.query(sql, values);
            const workPromises = results.map((row: any) => {
              if (employee.work) {
                employee.work.push(new Work({
                  dateworked: new Date(row.dateworked),
                  chargenumber: row.chargenumber,
                  extension: row.extension,
                  paycode: Number(row.paycode),
                  modtime: (row.modtime === '1' || row.modtime === 1),
                  hours: Number(row.hours)
                }));
              }
            });
            await Promise.allSettled(workPromises);
          } catch (error) {
            throw error;
          } finally {
            if (conn) conn.release();
          }
        }
      } else {
        throw new Error('User not found');
      }
    } else {
      throw new Error('No user collection');
    }
    return employee;
  }

  /**
   * This method will be used to insert a new employee into the employee's collection, 
   * but it also will create a new user, if the employee's user record is not already 
   * in the database
   * @param newuser The employee interface with all the required new employee data, including 
   * password.
   * @returns The employee object associated with the employee in the collection.
   */
  async insert(newuser: IEmployee): Promise<Employee> {
    let employee = new Employee(newuser);
    let user = new User(employee.user)
    if (collections.employees && collections.users) {
      // first look for the user by email and name (first and last)
      let found = false;
      let usrFound = false;
      const empcursor = collections.employees.find<IEmployee>({});
      const empArray = await empcursor.toArray();
      empArray.forEach(usr => {
        if (usr.name.lastname.toLowerCase() === newuser.name.lastname.toLowerCase()
          && usr.name.firstname.toLowerCase() === newuser.name.firstname.toLowerCase()
          && usr.name.middlename.toLowerCase() === newuser.name.middlename.toLowerCase()) {
          employee = new Employee(usr);
          found = true;
        }
      });
      // find associated user for the name
      const usercursor = collections.users.find<IUser>({});
      const userArray = await usercursor.toArray();
      userArray.forEach(usr => {
        if (usr.lastName.toLowerCase() === newuser.name.lastname.toLowerCase()
          && usr.firstName.toLowerCase() === newuser.name.firstname.toLowerCase()
          && usr.middleName.toLowerCase() === newuser.name.middlename.toLowerCase()) {
          user = new User(usr);
          usrFound = true;
        }
      });
      // if not present, check to see if a user with this name is present.
      if (!found) {
        if (usrFound) {
          employee.user = undefined;
          employee.work = undefined;
          employee.id = user.id;
          employee._id = new ObjectId(employee.id);
          await collections.employees.insertOne(employee);
        } else {
          // first insert new user object
          user = new User(employee.user);
          const result = await collections.users.insertOne(user);
          user.id = result.insertedId.toString();

          // then insert the employee object
          employee.user = undefined;
          employee.work = undefined;
          employee._id = result.insertedId;
          employee.id = result.insertedId.toString();
          await collections.employees.insertOne(employee);
        }
      }
      employee.user = user;
    } else {
      throw new Error('No employee/user collection');
    }
    return employee;
  }

  /**
   * This method is used to update/replace a user in the user's collection.  It replaces
   * based on the user's identifier.
   * @param replace The user interface with all the required user information.
   */
  async replace(replace: IEmployee): Promise<void> {
    let employee = new Employee(replace);
    if (collections.employees) {
      const query = { _id: new ObjectId(replace.id)};
      employee.user = undefined;
      employee.work = undefined;
      const result = await collections.employees.replaceOne(query, employee);
      if (result.modifiedCount === 0 && result.upsertedCount === 0) {
        throw new Error('Employee not replaced');
      }
    } else {
      throw new Error('No employee collection');
    }
  }

  /**
   * This method will remove a user from the user collection.
   * @param userid The string value for the user to remove.
   */
  async remove(userid: string): Promise<void> {
    if (collections.employees) {
      if (userid !== '') {
        const query = { _id: new ObjectId(userid)};
        const result = await collections.employees.deleteOne(query);
        if (result.deletedCount <= 0) {
          throw new Error('No employee deleted');
        }
      } else {
        throw new Error('No employee identifier given');
      }
    } else {
      throw new Error('No employee collection');
    }
  }

  /**
   * This method is used to pull an employee's work records for a period of 
   * time.
   * @param empID The string value for the employee identifier.
   * @param start The date value for the first day of the query.
   * @param end The date value for the last day of the query.
   * @returns A list of work records for the employee.
   */
  async getWork(empID: string, start: Date, end: Date): Promise<Work[]> {
    const answer: Work[] = [];
    if (mdbConnection.pool) {
      let conn: PoolConnection | undefined;
      try {
        conn = await mdbConnection.pool.getConnection();
        const sql = 'SELECT * FROM employeeWork WHERE employeeID=? AND '
          + 'dateworked >= ? AND dateworked <= ? ORDER BY dateworked, '
          + 'chargenumber, extension, paycode;';
        const wkVals = [ empID, start, end ];
        const results = await conn.query(sql, wkVals);
        results.forEach((row: any) => {
          answer.push(new Work({
            dateworked: new Date(row.dateworked),
            chargenumber: row.chargenumber,
            extension: row.extension,
            paycode: row.paycode,
            modtime: (row.modtime === '1' || row.modtime === 1),
            hours: Number(row.hours)
          }));
        });
        answer.sort((a,b) => a.compareTo(b));
      } catch (err) {
        throw err;
      } finally {
        if (conn) conn.release();
      }
    } else {
      throw new Error('No sql connection pool')
    }
    return answer;
  }

  /**
   * This method will be used to add a group of work records to the database.
   * @param empID The string value for the employee identifier.
   * @param worklist An array of work records to be added to the database.
   */
  async insertWork(empID: string, worklist: IWork[]): Promise<void> {
    let conn: PoolConnection | undefined;
    try {
      if (mdbConnection.pool) {
        conn = await mdbConnection.pool.getConnection();
        const workPromises = worklist.map(async(work) => {
          const sql = "INSERT INTO employeeWork (employeeID, dateworked, "
            + "chargenumber, extension, paycode, modtime, hours) VALUES ( ?, ?, "
            + "?, ?, ?, ?, ?);";
          const workVals = [ empID, work.dateworked, work.chargenumber, 
            work.extension, work.paycode, work.modtime, work.hours ];
          await conn.query(sql, workVals);
        });
        await Promise.allSettled(workPromises);
      }
    } catch (err) {
      throw err;
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * This method is used to delete a group of employee work records for the 
   * employee between (and including) a start and end dates.
   * @param empID The string value for the employee identifier
   * @param start The Date object for the start of the period for deletion.
   * @param end The Date object for the end of the period for deletion.
   */
  async deleteWork(empID: string, start: Date, end: Date): Promise<void> {
    let conn: PoolConnection | undefined;
    try {
      if (mdbConnection.pool) {
        conn = await mdbConnection.pool.getConnection();
        const sql = "DELETE FROM employeeWork WHERE employeeID = ? AND "
          + "dateworked >= ? AND dateworked <= ?;";
        const delVals = [ empID, start, end ];
        await conn.query(sql, delVals);
      }
    } catch (err) {
      throw err;
    } finally {
      if (conn) conn.release();
    }
  }
}