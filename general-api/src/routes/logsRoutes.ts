import { Request, Response, Router } from "express";
import { ILogEntry, Log, LogEntry, Logger, LogList } from "scheduler-node-models/general";
import * as fs from 'fs';
import * as path from 'path';

const router = Router();
const logger = new Logger(
  `${process.env.LOG_DIR}/general/process_${(new Date().toDateString())}.log`);

/**
 * This web api method will provide a list of available logs as the sub-directories
 * of the basic log directory from the environment.
 */
router.get('/logs', async(req: Request, res: Response) => {
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
      return res.status(201).json(list);
    }
  } catch (err) {
    const error = err as Error;
    logger.log(`Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  }
});

const getEntriesFromLogs = (logDir: string): ILogEntry[] => {
  const list: LogEntry[] = [];
  const days30 = new Date((new Date()).getTime() - (30 * 24 * 3600000));
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
          if (entryDate.getTime() > days30.getTime()) {
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

export default router;