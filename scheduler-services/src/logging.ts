import { LogEntry, Logger } from 'scheduler-models/general';
import { mdbConnection } from './sqldb';

export const logConnection: {
  log?: Logger,
  employeeLog?: Logger,
  siteLog?: Logger,
  teamLog?: Logger
} = {}

export async function createLogs(application: string) {
  logConnection.log = new Logger(
  `${process.env.LOG_DIR}/${application}/process_${(new Date().toDateString())}.log`);
  logConnection.employeeLog = new Logger(
  `${process.env.LOG_DIR}/${application}/employee_${(new Date().toDateString())}.log`);
  logConnection.siteLog = new Logger(
  `${process.env.LOG_DIR}/${application}/site_${(new Date().toDateString())}.log`);
  logConnection.teamLog = new Logger(
  `${process.env.LOG_DIR}/${application}/team_${(new Date().toDateString())}.log`);
}

export async function postLogEntry(application: string, message: string): Promise<LogEntry> {
  let conn;
  let logEntry = new LogEntry();
  try {
    if (mdbConnection.pool) {
      // get a connection from the db.pool
      conn = await mdbConnection.pool.getConnection();
      const entryDate = new Date();

      // execute a query for notices for the user
      const insert = `INSERT INTO logentries VALUES ( ?, ?, ?)`;
      const values = [ entryDate, application, message ];
      const query = `SELECT * FROM logentries ORDER BY application, messageid;`;
      await conn.query<any[]>(insert, values);

      logEntry = new LogEntry({
        date: entryDate,
        entry: message
      });
    } else {
      throw new Error('No database connection');
    }
  } catch (err) {
    throw err;
  } finally {
    if (conn) conn.release();
  }
  return logEntry;
}