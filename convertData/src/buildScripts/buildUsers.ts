import { collections, mdbConnection } from "scheduler-node-models/config";
import { IUser, Permission, SecurityQuestion, User } from 'scheduler-node-models/users';
import { PoolConnection } from 'mariadb';

export class BuildUsers {
  private users: User[];

  constructor() {
    this.users = [];
  }

  async build(): Promise<User[]> {
    let conn: PoolConnection | undefined
    const start = new Date();
    try {
      if (mdbConnection.pool) {
        conn = await mdbConnection.pool.getConnection();
        // get users from database table
        let sql = "SELECT * FROM users order by lastName;";
        let results = await conn?.query(sql);
        let resultsPromises = results.map((row: any) => {
          this.users.push(new User({
            id: row.id,
            emailAddress: row.emailAddress,
            password: row.password,
            passwordExpires: row.passwordExpires,
            badAttempts: row.badAttempts,
            firstName: row.firstName,
            middleName: row.middleName,
            lastName: row.lastName,
            resettoken: row.resettoken,
            resettokenexp: row.resettokenexpires
          }));
        });
        await Promise.allSettled(resultsPromises);
        this.users.sort((a,b) => a.compareTo(b));
        // get the user security questions
        sql = "SELECT * FROM usersecurityquestions ORDER BY userid, id;";
        results = await conn?.query(sql);
        resultsPromises = results.map((row: any) => {
          const userid = row.userid;
          this.users.forEach((user, u) => {
            if (user.id === userid) {
              user.questions.push(new SecurityQuestion({
                id: row.id,
                question: row.question,
                answer: row.answer
              }));
              this.users[u] = user;
            }
          })
        });
        await Promise.allSettled(resultsPromises);
        // get user permissions
        sql = "select * from userpermissions ORDER BY userid, application, job;";
        results = await conn?.query(sql);
        resultsPromises = results.map((row: any) => {
          const userid = row.userid;
          this.users.forEach((user, u) => {
            if (user.id === userid) {
              user.permissions.push(new Permission({
                application: row.application,
                job: row.job
              }));
              this.users[u] = user;
            }
          })
        });
        await Promise.allSettled(resultsPromises);
        // get user additional emails
        sql = "select * from useremails ORDER BY userid;";
        results = await conn?.query(sql);
        resultsPromises = results.map((row: any) => {
          const userid = row.userid;
          this.users.forEach((user, u) => {
            if (user.id === userid) {
              user.additionalEmails.push(row.emailAddress);
              this.users[u] = user;
            }
          })
        });
        await Promise.allSettled(resultsPromises);

      }

    } catch (err) {
      console.log(err);
    } finally {
      if (conn) conn.release();
    }
    const end = new Date();
    console.log(`${end.getTime() - start.getTime()}ms`);
    return this.users;
  }
}