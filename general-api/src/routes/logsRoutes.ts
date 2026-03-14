import { Request, Response, Router } from "express";
import { auth } from '../middleware/authorization.middleware';
import * as fs from 'fs';
import * as path from 'path';
import { ILogEntry, Log, LogEntry, Logger, LogList } from "scheduler-node-models/general";
import { mdbConnection } from "../services/sqldb";

const router = Router();
const logger = new Logger(
  `${process.env.LOG_DIR}/general/process_${(new Date().toDateString())}.log`);

/**
 * This web api method will provide a list of available logs as the sub-directories
 * of the basic log directory from the environment.
 */
router.get('/logs', auth, async(req: Request, res: Response) => {
  let conn;
  try {
    const list = new LogList();
    if (mdbConnection.pool) {
      // get a connection from the db.pool
      conn = await mdbConnection.pool.getConnection();

      // execute a query for notices for the user
      const query = `SELECT * FROM logentries ORDER BY application, messageid;`;
      const rows = await conn.query<any[]>(query);

      // compile the notice rows into the list of notices
      let log = new Log();
      rows.forEach(row => {
        if (log.name !== row.application) {
          if (log.entries.length > 0) {
            log.entries.sort((b,a) => a.compareTo(b));
            list.logs.push(log);
          }
          log = new Log();
          log.name = row.application;
        }
        log.entries.push(new LogEntry({
          date: row.messageid,
          entry: row.message
        }));
      });
      if (log.entries.length > 0) {
        log.entries.sort((b,a) => a.compareTo(b));
        list.logs.push(log);
      }
      list.logs.sort((a,b) => a.compareTo(b));
    } else {
      throw new Error('No database connection');
    }

    // respond with the list of notices
    res.status(200).json(list);
  } catch (err) {
    const error = err as Error;
    logger.log(`Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  } finally {
    if (conn) conn.release();
  }
});

/**
 * This method is used to pull log entries from a particular log, between two
 * dates and times.  Since the date is optional, if omitted date is set to 
 * current date/time.
 * @param logDir The string value for the log name.
 * @param date (optional) A date value for the max log entry time.
 * @returns A list of log entries for the log during the period of time.
 */
const getEntriesFromLogs = (logDir: string, date?: Date): ILogEntry[] => {
  const list: LogEntry[] = [];
  let days30 = new Date((new Date()).getTime() - (30 * 24 * 3600000));
  if (date) {
    date = new Date(date);
    days30 = new Date(date.getTime() - (30 * 24 * 3600000));
  } else {
    date = new Date();
  }
  try {
    const directoryPath = path.join(`${process.env.LOG_DIR}`, logDir);
    const fileEnts = fs.readdirSync(directoryPath, { withFileTypes: true });
    const files = fileEnts.filter(entry => entry.isFile())
      .map(entry => path.join(directoryPath, entry.name));
    files.forEach(filePath => {
      let contents: string = fs.readFileSync(filePath, 'utf-8');
      const rows = contents.split('\n');
      rows.forEach(row => {
        const data = row.split('\t');
        if (data.length > 1) {
          const entryDate = new Date(Number(data[0]));
          if (entryDate.getTime() > days30.getTime() 
            && entryDate.getTime() <= date.getTime()) {
            list.push(new LogEntry({
              date: new Date(Number(data[0])),
              entry: data[1]
            }));
          }
        }
      })
    });
  } catch (err) {
    throw err;
  }
  return list;
};

/**
 * This web api method will provide a list of log entries for a 30-day period for a
 * single log, from a maximum date back 30 days.
 */
router.get('/log/:log/:date', auth, async(req: Request, res: Response) => {
  let conn;
  try {
    const logname = req.params.log as string;
    let maxDate = new Date(0);
    if (req.params.date) {
      maxDate = new Date(req.params.date as string);
    }
    const log = new Log();
    log.name = logname;
    if (mdbConnection.pool) {
      // get a connection from the db.pool
      conn = await mdbConnection.pool.getConnection();

      // execute a query for notices for the user
      const query = `SELECT * FROM logentries WHERE application = ? AND messageid > ? '
        + ORDER BY messageid;`;
      const values = [ logname, maxDate ];
      const rows = await conn.query<any[]>(query, values);

      // compile the notice rows into the list of notices
      rows.forEach(row => {
        log.entries.push(new LogEntry({
          date: row.messageid,
          entry: row.message
        }));
      });
      if (log.entries.length > 0) {
        log.entries.sort((b,a) => a.compareTo(b));
      }
    } else {
      throw new Error('No database connection');
    }

    // respond with the list of notices
    res.status(200).json(log);
  } catch (err) {
    const error = err as Error;
    logger.log(`Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  } finally {
    if (conn) conn.release();
  }
});

/**
 * This web api method will provide a list of log entries for a 30-day period for a
 * single log, from a maximum date back 30 days.
 */
router.get('/log/:log', auth, async(req: Request, res: Response) => {
  let conn;
  try {
    const logname = req.params.log as string;
    let maxDate = new Date(0);
    const log = new Log();
    log.name = logname;
    if (mdbConnection.pool) {
      // get a connection from the db.pool
      conn = await mdbConnection.pool.getConnection();

      // execute a query for notices for the user
      const query = `SELECT * FROM logentries WHERE application = ? AND messageid > ? '
        + ORDER BY messageid;`;
      const values = [ logname, maxDate ];
      const rows = await conn.query<any[]>(query, values);

      // compile the notice rows into the list of notices
      rows.forEach(row => {
        log.entries.push(new LogEntry({
          date: row.messageid,
          entry: row.message
        }));
      });
      if (log.entries.length > 0) {
        log.entries.sort((b,a) => a.compareTo(b));
      }
    } else {
      throw new Error('No database connection');
    }

    // respond with the list of notices
    res.status(200).json(log);
  } catch (err) {
    const error = err as Error;
    logger.log(`Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  } finally {
    if (conn) conn.release();
  }
});

export default router;