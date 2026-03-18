import { Request, Response, Router } from "express";
import { auth } from '../middleware/authorization.middleware';
import * as fs from 'fs';
import * as path from 'path';
import { ILogEntry, Log, LogEntry, Logger, LogList } from "scheduler-models/general";
import { LogService, mdbConnection, postLogEntry } from "scheduler-services";

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
    const logService = new LogService();
    const answer = await logService.getAllLogs();
    answer.forEach(log => {
      list.logs.push(new Log(log));
    });
    res.status(200).json(list);
  } catch (err) {
    const error = err as Error;
    await postLogEntry('general', `report: Get: Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  }
});

/**
 * This web api method will provide a list of log entries for a 30-day period for a
 * single log, from a maximum date back 30 days.
 */
router.get('/log/:log/:date', auth, async(req: Request, res: Response) => {
  try {
    const logname = req.params.log as string;
    let maxDate = new Date(0);
    if (req.params.date) {
      maxDate = new Date(req.params.date as string);
    }
    const now = new Date();
    const logService = new LogService();
    const entries = await logService.getForApplicationDates(logname, maxDate, now);
    const log = new Log();
    log.name = logname;
    entries.forEach(entry => {
      log.entries.push(new LogEntry(entry));
    });
    log.entries.sort((a,b) => a.compareTo(b));
    
    // respond with the list of notices
    res.status(200).json(log);
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
    const logService = new LogService();
    const entries = await logService.getForAppication(logname);
    const log = new Log();
    log.name = logname;
    entries.forEach(entry => {
      log.entries.push(new LogEntry(entry));
    });
    log.entries.sort((a,b) => a.compareTo(b));

    // respond with the list of notices
    res.status(200).json(log);
  } catch (err) {
    const error = err as Error;
    logger.log(`Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  }
});

export default router;