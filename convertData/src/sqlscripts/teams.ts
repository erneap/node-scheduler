import { collections, mdbConnection } from "scheduler-node-models/config";
import { PoolConnection } from 'mariadb';
import { ITeam, Team } from 'scheduler-node-models/scheduler/teams';

export class SqlTeams {
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
        const sql = "SHOW TABLES LIKE 'team%'";
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
        let sql = "DROP TABLE IF EXISTS team_company_modperiods;"
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

  async createTable(): Promise<void> {
    let conn;
    try {
      if (mdbConnection.pool) {
        // get a connection from the db.pool
        conn = await mdbConnection.pool.getConnection();
        let sql = "CREATE TABLE teams ("
          + "id varchar(25) NOT NULL PRIMARY KEY,"
          + "name varchar(100) NOT NULL);"
          await conn.query(sql);
        sql =  "CREATE TABLE team_workcodes ("
          + "teamid varchar(25) NOT NULL,"
          + "id varchar(5) NOT NULL,"
          + "title varchar(25) NOT NULL,"
          + "start float NOT NULL,"
          + "shiftcode varchar(5) NOT NULL,"
          + "isLeave tinyint NOT NULL,"
          + "textcolor varchar(7) NOT NULL,"
          + "backcolor varchar(7) NOT NULL,"
          + "altcode varchar(5),"
          + "search varchar(25),"
          + "PRIMARY KEY (teamid, id),"
          + "CONSTRAINT FOREIGN KEY (teamid) REFERENCES teams(id) "
          + "ON DELETE CASCADE ON UPDATE CASCADE);";
        await conn.query(sql);
        sql = "CREATE TABLE team_contacts_specialties ("
          + "teamid varchar(25) NOT NULL,"
          + "id smallint NOT NULL,"
          + "datatype varchar(25) NOT NULL,"
          + "name varchar(100) NOT NULL,"
          + "sort int NOT NULL,"
          + "PRIMARY KEY (teamid, id, datatype),"
          + "CONSTRAINT FOREIGN KEY (teamid) REFERENCES teams(id) "
          + "ON DELETE CASCADE ON UPDATE CASCADE);";
        await conn.query(sql);
        sql = "CREATE TABLE team_companies ("
          + "teamid varchar(25) NOT NULL,"
          + "id varchar(25) NOT NULL,"
          + "name varchar(100) NOT NULL,"
          + "ingest varchar(25) NOT NULL,"
          + "ingestPeriod int,"
          + "startDay smallint,"
          + "PRIMARY KEY (teamid, id),"
          + "CONSTRAINT FOREIGN KEY (teamid) REFERENCES teams(id) "
          + "ON DELETE CASCADE ON UPDATE CASCADE);";
        await conn.query(sql);
        sql = "CREATE TABLE team_company_holidays ("
          + "teamid varchar(25) NOT NULL,"
          + "companyid varchar(25) NOT NULL,"
          + "id varchar(5) NOT NULL,"
          + "sort int NOT NULL,"
          + "name varchar(100) NOT NULL,"
          + "PRIMARY KEY (teamid, companyid, id, sort),"
          + "CONSTRAINT FOREIGN KEY (teamid, companyid) REFERENCES team_companies(teamid, id) "
          + "ON DELETE CASCADE ON UPDATE CASCADE);";
        await conn.query(sql);
        sql = "CREATE TABLE team_company_holiday_actuals ("
          + "teamid varchar(25) NOT NULL,"
          + "companyid varchar(25) NOT NULL,"
          + "id varchar(5) NOT NULL,"
          + "sort int NOT NULL,"
          + "actual Date NOT NULL,"
          + "PRIMARY KEY (teamid, companyid, id, sort, actual));";
        await conn.query(sql);
        sql = "CREATE TABLE team_company_modperiods ("
          + "teamid varchar(25) NOT NULL,"
          + "companyid varchar(25) NOT NULL,"
          + "year smallint NOT NULL,"
          + "start Date NOT NULL,"
          + "end Date NOT NULL,"
          + "PRIMARY KEY (teamid, companyid, year),"
          + "CONSTRAINT FOREIGN KEY (teamid, companyid) REFERENCES team_companies(teamid, id) "
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
      const teams: Team[] = []
      if (collections.teams) {
        const cursor = collections.teams.find<ITeam>({});
        let results = await cursor.toArray();
        results.forEach(u => {
          teams.push(new Team(u));
        });
      } else {
        throw new Error('No users collection');
      }
      if (mdbConnection.pool) {
        // get a connection from the db.pool
        conn = await mdbConnection.pool.getConnection();
        const userPromises = teams.map(async (team) => {
          // create team record
          let sql = "INSERT INTO teams VALUES ( ?, ?);"
          const userVals = [ team.id, team.name ];
          await conn?.query(sql, userVals);
          // create team workcode records 
          if (team.workcodes.length > 0) {
            team.workcodes.forEach(async(wc) => {
              const sql = "INSERT INTO team_workcodes VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);";
              const wcVals = [team.id, wc.id, wc.title, wc.start, wc.shiftCode, wc.isLeave,
                wc.textcolor, wc.backcolor, wc.altcode, wc.search];
              await conn?.query(sql, wcVals);
            });
          }
          // create team contact types records
          if (team.contacttypes.length > 0) {
            team.contacttypes.forEach(async(ct) => {
              const sql = "INSERT INTO team_contacts_specialties VALUES (?, ?, ?, ?, ?);";
              const ctVals = [team.id, ct.id, 'contact', ct.name, ct.sort];
              await conn?.query(sql, ctVals);
            });
          } 
          // create team specialty types records
          if (team.specialties.length > 0) {
            team.specialties.forEach(async(ct) => {
              const sql = "INSERT INTO team_contacts_specialties VALUES (?, ?, ?, ?, ?);";
              const ctVals = [team.id, ct.id, 'specialty', ct.name, ct.sort];
              await conn?.query(sql, ctVals);
            });
          }
          // create team company records, with company subrecords holidays and mod periods
          if (team.companies.length > 0) {
            team.companies.forEach(async(co) => {
              const sql = "INSERT INTO team_companies VALUES (?, ?, ?, ?, ?, ?);";
              const coVals = [team.id, co.id, co.name, co.ingest, co.ingestPeriod, 
                co.startDay];
              await conn?.query(sql, coVals);
              if (co.holidays.length > 0) {
                co.holidays.forEach(async(hol) => {
                  if (hol.actualdates.length > 0) {
                    const actuals = hol.actualdates.map(async(ad) => {
                      const sql = "INSERT INTO team_company_holiday_actuals VALUES "
                        + "(?, ?, ?, ?, ?);";
                      const adVals = [team.id, co.id, hol.id, hol.sort, ad];
                      await conn?.query(sql, adVals);
                    });
                    await Promise.allSettled(actuals);
                  }
                  const sql = "INSERT INTO team_company_holidays VALUES (?, ?, ?, ?, ?);";
                  const holVals = [team.id, co.id, hol.id, hol.sort, hol.name];
                  await conn?.query(sql, holVals);
                });
              }
              if (co.modperiods.length > 0) {
                co.modperiods.forEach(async(mp) => {
                  const sql = "INSERT INTO team_company_modperiods VALUES "
                    + "(?, ?, ?, ?, ?);";
                  const mpVals = [team.id, co.id, mp.year, mp.start, mp.end];
                  await conn?.query(sql, mpVals);
                });
              }
            });
          }
        });
        await Promise.allSettled(userPromises);
        const query = "SELECT id FROM teams;"
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