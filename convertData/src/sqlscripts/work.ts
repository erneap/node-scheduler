import { collections, mdbConnection } from "scheduler-services";
import { IWorkRecord, WorkRecord } from 'scheduler-models/scheduler/employees';
import { PoolConnection } from 'mariadb';

export class SqlWork {
  constructor() {}

  async runConvert(): Promise<void> {
    await this.dropTable();
    await this.createTable();
    const records = await this.convert();
    console.log(`Employee Work Records: ${records}`);
  }

  async dropTable(): Promise<void> {
    let conn;
    try {
      if (mdbConnection.pool) {
        // get a connection from the db.pool
        conn = await mdbConnection.pool.getConnection();
        let sql =  "DROP TABLE IF EXISTS employeeWork;";
        await conn.query(sql);
      }
    } catch (err) {
      console.log(err);
    } finally {
      if (conn) conn.release();
    }
  }

  async createTable(): Promise<void> {
    let conn: PoolConnection | undefined;
    let answer = 0;
    try {
      if (mdbConnection.pool) {
        conn = await mdbConnection.pool?.getConnection();
        const sql = "CREATE TABLE employeeWork ("
          + "id bigint AUTO_INCREMENT PRIMARY KEY, "
          + "employeeID varchar(25) NOT NULL, "
          + "dateworked DATE NOT NULL, "
          + "chargenumber varchar(20) NOT NULL, "
          + "extension varchar(20) NOT NULL, "
          + "paycode smallint DEFAULT 1, "
          + "modtime tinyint DEFAULT 0, "
          + "hours float NOT NULL);";
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
      const workRecords: WorkRecord[] = [];
      if (collections.work) {
        const query = {};
        const workCursor = collections.work.find<IWorkRecord>(query);
        const workResults = await workCursor.toArray();
        workResults.forEach(wr => {
          workRecords.push(new WorkRecord(wr));
        });
      }
      if (mdbConnection.pool) {
        conn = await mdbConnection.pool?.getConnection();
        const workRecordPromises = workRecords.map(async(wr) => {
          if (wr.work) {
            const workPromises = wr.work.map(async(wk) => {
              const sql = "INSERT INTO employeeWork (employeeID, dateworked, chargenumber, "
                + "extension, paycode, modtime, hours) VALUES (?, ?, ?, ?, ?, ?, ?);";
              const wkVals = [wr.empID, wk.dateworked, wk.chargenumber, wk.extension,
                wk.paycode, wk.modtime, wk.hours ];
              await conn?.query(sql, wkVals);
            });
            await Promise.allSettled(workPromises);
          }
        });
        await Promise.allSettled(workRecordPromises);
        const sql = "SELECT * FROM employeeWork;";
        const results = await conn.query(sql);
        answer = results.length;
      }
    } catch (err) {
      console.log(err);
    } finally {
      if (conn) conn.release();
    }
    return answer;
  }
}