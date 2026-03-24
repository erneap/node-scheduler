import { collections, mdbConnection } from "scheduler-services";
import { IUser, User } from 'scheduler-models/users';
import { PoolConnection } from 'mariadb';

export class SqlUsers {
  constructor() {}

  async runConvert(): Promise<void> {
    await this.dropTable();
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
        sql = "DROP TABLE IF EXISTS team_company_modperiods;"
        await conn.query(sql);
        sql = "DROP TABLE IF EXISTS team_company_holiday_actuals;"
        await conn.query(sql);
        sql = "DROP TABLE IF EXISTS team_company_holidays;"
        await conn.query(sql);
        sql = "DROP TABLE IF EXISTS team_companies;"
        await conn.query(sql);
        sql = "DROP TABLE IF EXISTS team_contacts_specialties;";
        await conn.query(sql);
        sql =  "DROP TABLE IF EXISTS team_workcodes;";
        await conn.query(sql);
        sql = "DROP TABLE IF EXISTS teams;";
        await conn.query(sql);
      }
    } catch (err) {
      console.log(err);
    } finally {
      if (conn) conn.release();
    }
  }
}