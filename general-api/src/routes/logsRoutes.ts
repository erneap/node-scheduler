import { Request, Response, Router } from "express";
import { ILogEntry, Log, LogEntry, Logger, LogList } from "scheduler-node-models/general";
import { auth } from '../middleware/authorization.middleware';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();
const logger = new Logger(
  `${process.env.LOG_DIR}/general/process_${(new Date().toDateString())}.log`);

/**
 * This web api method will provide a list of available logs as the sub-directories
 * of the basic log directory from the environment.
 */
router.get('/logs', auth, async(req: Request, res: Response) => {
  try {
    const list = new LogList();
    const logDir = (process.env.LOG_DIR) ? process.env.LOG_DIR : '';
    if (logDir !== '') {
      const dirents = fs.readdirSync(logDir, { withFileTypes: true })
      const directories = dirents.filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
      directories.forEach(dir => {
        const log = new Log();
        log.name = dir;
        const entries = getEntriesFromLogs(log.name);
        if (entries.length > 0) {
          entries.forEach(entry => {
            log.entries.push(new LogEntry(entry));
          });
          log.entries.sort((a,b) => b.compareTo(a));
        }
        list.logs.push(log)
      });
      list.logs.sort((a,b) => a.compareTo(b));
      return res.status(200).json(list);
    }
  } catch (err) {
    const error = err as Error;
    logger.log(`Error: ${error.message}`);
    res.status(400).json({'message': error.message});
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
  try {
    const logname = req.params.log as string;
    let maxDate = new Date();
    if (req.params.date) {
      maxDate = new Date(req.params.date as string);
    }
    const log = new Log();
    const logDir = (process.env.LOG_DIR) ? process.env.LOG_DIR : '';
    if (logDir !== '' && logname && logname !== '') {
      log.name = logname;
      const entries = getEntriesFromLogs(log.name, maxDate);
      if (entries.length > 0) {
        entries.forEach(entry => {
          log.entries.push(new LogEntry(entry));
        });
        log.entries.sort((a,b) => b.compareTo(a));
      }
      return res.status(200).json(log);
    }
  } catch (err) {
    const error = err as Error;
    logger.log(`Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  }
});

/**
 * This web api method will provide a list of log entries for a 30-day period for a
 * single log, from a maximum date back 30 days.
 */
router.get('/log/:log', auth, async(req: Request, res: Response) => {
  try {
    const logname = req.params.log as string;
    let maxDate = new Date();
    const log = new Log();
    const logDir = (process.env.LOG_DIR) ? process.env.LOG_DIR : '';
    if (logDir !== '' && logname && logname !== '') {
      log.name = logname;
      const entries = getEntriesFromLogs(log.name, maxDate);
      if (entries.length > 0) {
        entries.forEach(entry => {
          log.entries.push(new LogEntry(entry));
        });
        log.entries.sort((a,b) => b.compareTo(a));
      }
      return res.status(200).json(log);
    }
  } catch (err) {
    const error = err as Error;
    logger.log(`Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  }
});

export default router;