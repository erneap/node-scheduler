import { collections, mdbConnection } from "scheduler-node-models/config";
import { IUser, User } from 'scheduler-node-models/users';
import { PoolConnection } from 'mariadb';

export class SqlUsers {
  constructor() {}

  async runConvert(): Promise<number> {
    const exists = await this.exists();
    if (exists) {
      await this.dropTable();
    }
    await this.createTable();
    const records = await this.convert();
    return records;
  }

  async exists(): Promise<boolean> {
    let conn;
    try {
      if (mdbConnection.pool) {
        // get a connection from the db.pool
        conn = await mdbConnection.pool.getConnection();
        const sql = "SHOW TABLES LIKE 'users'";
        const results = await conn.query(sql);
        if (results.length > 0) {
          return true;
        } else {
          return false;
        }
      }
    } catch (err) {
      console.log(err);
    } finally {
      if (conn) conn.release();
    }
    return false;
  }

  async dropTable(): Promise<void> {
    let conn;
    try {
      if (mdbConnection.pool) {
        // get a connection from the db.pool
        conn = await mdbConnection.pool.getConnection();
        let sql =  "DROP TABLE IF EXISTS userpermissions;";
        await conn.query(sql);
        sql = "DROP TABLE IF EXISTS usersecurityquestions;";
        await conn.query(sql);
        sql = "DROP TABLE IF EXISTS useremails;"
        await conn.query(sql);
        sql = "DROP TABLE IF EXISTS users;";
        await conn.query(sql);
      }
    } catch (err) {
      console.log(err);
    } finally {
      if (conn) conn.release();
    }
  }

  async createTable(): Promise<void> {
    let conn;
    try {
      if (mdbConnection.pool) {
        // get a connection from the db.pool
        conn = await mdbConnection.pool.getConnection();
        let sql = "CREATE TABLE users ("
          + "id varchar(25) NOT NULL,"
          + "emailAddress varchar(100) NOT NULL,"
          + "password varchar(200) NOT NULL,"
          + "passwordExpires DATETIME NOT NULL,"
          + "badAttempts int,"
          + "firstName varchar(25) NOT NULL,"
          + "middleName varchar(25),"
          + "lastName varchar(25) NOT NULL,"
          + "resettoken varchar(25),"
          + "resettokenexpires DATETIME,"
          + "PRIMARY KEY (id));";
          await conn.query(sql);
          sql =  "CREATE TABLE userpermissions ("
          + "id bigint NOT NULL AUTO_INCREMENT,"
          + "userid varchar(25) NOT NULL,"
          + "application varchar(25) NOT NULL,"
          + "job varchar(25) NOT NULL,"
          + "PRIMARY KEY (id, userid),"
          + "CONSTRAINT FOREIGN KEY (userid) REFERENCES users(id) "
          + "ON DELETE CASCADE ON UPDATE CASCADE);";
          await conn.query(sql);
          sql = "CREATE TABLE usersecurityquestions ("
          + "id int NOT NULL,"
          + "userid varchar(25) NOT NULL,"
          + "question varchar(100),"
          + "answer varchar(100),"
          + "PRIMARY KEY (id, userid),"
          + "CONSTRAINT FOREIGN KEY (userid) REFERENCES users(id) "
          + "ON DELETE CASCADE ON UPDATE CASCADE);";
          await conn.query(sql);
          sql = "CREATE TABLE useremails ("
          + "id bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,"
          + "userid varchar(25) NOT NULL,"
          + "emailAddress varchar(100) NOT NULL,"
          + "CONSTRAINT FOREIGN KEY (userid) REFERENCES users(id) "
          + "ON DELETE CASCADE ON UPDATE CASCADE);";
        await conn.query(sql);
      }
    } catch (err) {
      console.log(err);
    } finally {
      if (conn) conn.release();
    }
  }

  async convert(): Promise<number> {
    let conn: PoolConnection | undefined;
    let answer = 0;
    try {
      const users: User[] = []
      if (collections.users) {
        const cursor = collections.users.find<IUser>({});
        let results = await cursor.toArray();
        results.forEach(u => {
          users.push(new User(u));
        });
        users.sort((a,b) => a.compareTo(b));
      } else {
        throw new Error('No users collection');
      }
      if (mdbConnection.pool) {
        // get a connection from the db.pool
        conn = await mdbConnection.pool.getConnection();
        const userPromises = users.map(async (user) => {
          // create user record
          let sql = "INSERT INTO users VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);"
          const userVals = [ user.id, user.emailAddress, user.password, 
            user.passwordExpires, user.badAttempts, user.firstName, user.middleName,
            user.lastName, user.resettoken, user.resettokenexp ];
          await conn?.query(sql, userVals);
          // create users permission records
          if (user.workgroups.length > 0) {
            user.workgroups.forEach(async(wg) => {
              const parts = wg.split('-');
              sql = "INSERT INTO userpermissions (userid, application, job) VALUES "
                + "( ?, ?, ?);";
              const permVals = [user.id, parts[0], parts[1]];
              await conn?.query(sql, permVals);
            });
          } else if (user.permissions.length > 0) {
            user.permissions.forEach(async(perm) => {
              sql = "INSERT INTO userpermissions (userid, application, job) VALUES "
                + "( ?, ?, ?);";
              const permVals = [user.id, perm.application, perm.job];
              await conn?.query(sql, permVals);
            });
          }
          // create users additional email records
          if (user.addAdditionalEmail.length > 0) {
            user.additionalEmails.forEach(async(em) => {
              sql = "INSERT INTO useremails VALUES (?, ?);";
              const emailVals = [user.id, em];
              await conn?.query(sql, emailVals);
            });
          }
          // create users security questions records
          if (user.questions.length > 0) {
            user.questions.forEach(async(quest) => {
              sql = "INSERT INTO usersecurityquestions VALUES (?, ?, ?, ?);";
              const questVals = [quest.id, user.id, quest.question, quest.answer];
              await conn?.query(sql, questVals);
            });
          }
        });
        await Promise.allSettled(userPromises);
        const query = "SELECT id FROM users;"
        const result = await conn.query(query);
        answer = result.length;
      }
    } catch (err) {
      console.log(err);
    } finally {
      if (conn) conn?.release();
    }
    return answer;
  }
}