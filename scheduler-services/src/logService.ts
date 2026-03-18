import { PoolConnection } from "mariadb/*";
import { Log, LogEntry } from "scheduler-models/general";
import { mdbConnection } from "./sqldb";

export class LogService {
  /**
   * This method will be used to get a single log entry from the database.
   * @param id The date object for the log entry's identifier.
   * @returns A single log entry object with the data from the database.
   */
  async get(id: Date): Promise<LogEntry> {
    let answer = new LogEntry();
    let conn: PoolConnection | undefined;
    try {
      if (mdbConnection.pool) {
        conn = await mdbConnection.pool.getConnection();
        const sql = "SELECT * FROM logentries WHERE messageid = ?;";
        const logVals = [ id ];
        const results = await conn.query(sql, logVals);
        if (results.length > 0) {
          const row = results[0];
          answer = new LogEntry({
            date: new Date(row.messageid),
            entry: row.message
          });
        }
      } else {
        throw new Error('No connection pool provided')
      }
    } catch(err) {
      throw err;
    } finally {
      if (conn) conn.release();
    }
    return answer;
  }

  /**
   * This method is used to get all logs between two dates.
   * @param start The date object for the start of the period.
   * @param end The date object for the end of the period.
   * @returns A list of logs for dates provided.
   */
  async getLogs(start: Date, end: Date): Promise<Log[]> {
    const answer: Log[] = [];
    let conn: PoolConnection | undefined;
    try {
      if (mdbConnection.pool) {
        conn = await mdbConnection.pool.getConnection();
        const sql = "SELECT * FROM logentries WHERE messageid >= ? AND messageid <= ? "
          + "ORDER BY application, messageid;";
        const logVals = [ start, end ];
        const results = await conn.query(sql, logVals);
        const resultPromises = results.map((row: any) => {
          const application = row.application;
          let found = false;
          answer.forEach((log, l) => {
            if (log.name.toLowerCase() === application.toLowerCase()) {
              found = true;
              log.entries.push(new LogEntry({
                date: new Date(row.messageid),
                entry: row.message
              }));
              answer[l] = log;
            }
          });
          if (!found) {
            const log = new Log({
              name: application,
              entries: []
            });
            log.entries.push(new LogEntry({
              date: new Date(row.messageid),
              entry: row.message
            }));
            answer.push(log);
          }
        });
        await Promise.allSettled(resultPromises);
      } else {
        throw new Error('No connection pool provided')
      }
    } catch(err) {
      throw err;
    } finally {
      if (conn) conn.release();
    }
    return answer;
  }

  /**
   * This method is used to pull on the log entries in the database.
   * @returns A list of logs that contain all the log entries in the database.
   */
  async getAllLogs(): Promise<Log[]> {
    const answer: Log[] = [];
    let conn: PoolConnection | undefined;
    try {
      if (mdbConnection.pool) {
        conn = await mdbConnection.pool.getConnection();
        const sql = "SELECT * FROM logentries ORDER BY application, messageid;";
        const results = await conn.query(sql);
        const resultPromises = results.map((row: any) => {
          const application = row.application;
          let found = false;
          answer.forEach((log, l) => {
            if (log.name.toLowerCase() === application.toLowerCase()) {
              found = true;
              log.entries.push(new LogEntry({
                date: new Date(row.messageid),
                entry: row.message
              }));
              answer[l] = log;
            }
          });
          if (!found) {
            const log = new Log({
              name: application,
              entries: []
            });
            log.entries.push(new LogEntry({
              date: new Date(row.messageid),
              entry: row.message
            }));
            answer.push(log);
          }
        });
        await Promise.allSettled(resultPromises);
      } else {
        throw new Error('No connection pool provided')
      }
    } catch(err) {
      throw err;
    } finally {
      if (conn) conn.release();
    }
    return answer;
  }
  /**
   * This method will get all the log entries for an application
   * @param application The string value for the application
   * @returns A list of log entry objects which contains all the entries in the database
   * for that application.
   */
  async getForAppication(application: string): Promise<LogEntry[]> {
    const answer: LogEntry[] = [];
    let conn: PoolConnection | undefined;
    try {
      if (mdbConnection.pool) {
        conn = await mdbConnection.pool.getConnection();
        const sql = "SELECT * FROM logentries WHERE application = ? ORDER BY messageid;";
        const logVals = [ application ];
        const results = await conn.query(sql, logVals);
        results.forEach((row: any) => {
          const entry = new LogEntry({
            date: new Date(results.messageid),
            entry: row.message
          });
          answer.push(entry);
        });
      } else {
        throw new Error('No connection pool provided')
      }
    } catch(err) {
      throw err;
    } finally {
      if (conn) conn.release();
    }
    return answer;
  }

  /**
   * This method will be used to pull all the log entries for an application between two 
   * dates.
   * @param application The string value for the application.
   * @param start The date object for the start of the viewing period.
   * @param end The date object for the end of the viewing period.
   * @returns A list of log entry objects which contains all the entries in the database
   * for that application that fall between the two dates.
   */
  async getForApplicationDates(application: string, start: Date, end: Date): 
    Promise<LogEntry[]> {
    const answer: LogEntry[] = [];
    let conn: PoolConnection | undefined;
    try {
      if (mdbConnection.pool) {
        conn = await mdbConnection.pool.getConnection();
        const sql = "SELECT * FROM logentries WHERE application = ? AND messageid >= ? "
          + "AND messageid = ? ORDER BY messageid;";
        const logVals = [ application, start, end ];
        const results = await conn.query(sql, logVals);
        results.forEach((row: any) => {
          const entry = new LogEntry({
            date: new Date(results.messageid),
            entry: row.message
          });
          answer.push(entry);
        });
      } else {
        throw new Error('No connection pool provided')
      }
    } catch(err) {
      throw err;
    } finally {
      if (conn) conn.release();
    }
    return answer;
  }

  /**
   * This method is used to remove a single log entry from the database, based on its 
   * identifier (message id).
   * @param id The date object for the log entry's identifier.
   */
  async remove(id: Date): Promise<void> {
    let conn: PoolConnection | undefined;
    try {
      if (mdbConnection.pool) {
        conn = await mdbConnection.pool.getConnection();
        const sql = "DELETE FROM logentries WHERE messageid = ?;";
        const logVals = [ id ];
        await conn.query(sql, logVals);
      } else {
        throw new Error('No connection pool provided')
      }
    } catch(err) {
      throw err;
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * This method is used to remove or delete log entries for a particular application and
   * between two dates.
   * @param application The string value for the application log.
   * @param start The first date/time for period to be removed
   * @param end The last date/time for the period to be removed.
   */
  async removeForApplicationDates(application: string, start: Date, end: Date): Promise<void> {
    let conn: PoolConnection | undefined;
    try {
      if (mdbConnection.pool) {
        conn = await mdbConnection.pool.getConnection();
        const sql = "DELETE FROM logentries WHERE application=? AND messageid >= ? "
          + "AND messageid <= ?;";
        const logVals = [ application, start, end ];
        await conn.query(sql, logVals);
      } else {
        throw new Error('No connection pool provided')
      }
    } catch(err) {
      throw err;
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * This method is used to get the list of applications that the log entries are 
   * associated with.
   * @returns A list of strings for the log names.
   */
  async getApplications(): Promise<string[]> {
    const answer: string[] = [];
    let conn: PoolConnection | undefined;
    try {
      if (mdbConnection.pool) {
        conn = await mdbConnection.pool.getConnection();
        const sql = "SELECT DISTINCT(application) as application FROM logentries ORDER "
          + "BY application;";
        const results = await conn.query(sql);
        results.forEach((row: any) => {
          answer.push(row.application);
        });
        return answer;
      } else {
        throw new Error('No connection pool provided')
      }
    } catch(err) {
      throw err;
    } finally {
      if (conn) conn.release();
    }
    return answer;
  }
}