import { Request, Response, Router } from "express";
import { ILogEntry, Log, LogEntry, LogList } from "scheduler-node-models/general";
import * as fs from 'fs';
import * as path from 'path';

const router = Router();

/**
 * This web api method will provide a list of available logs as the sub-directories
 * of the basic log directory from the environment.
 */
router.get('/logs', async(req: Request, res: Response) => {
  try {
    const list = new LogList();
    const logDir = (process.env.LOG_DIR) ? process.env.LOG_DIR : '';
    if (logDir !== '') {
      const dirents = await fs.promises.readdir(logDir, { withFileTypes: true })
      const directories = dirents.filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
      directories.forEach(async(dir) => {
        const log = new Log();
        log.name = dir;
        const entries = await getEntriesFromLogs(log.name);
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
    res.status(400).json({'message': error.message});
  }
});

const getEntriesFromLogs = async (logDir: string): Promise<ILogEntry[]> => {
  const list: LogEntry[] = [];
  try {
    const directoryPath = path.join(`${process.env.LOG_DIR}`, logDir);
    const fileEnts = await fs.promises.readdir(directoryPath, { withFileTypes: true });
    const files = fileEnts.filter(entry => entry.isFile())
      .map(entry => path.join(directoryPath, entry.name));
    files.forEach(async(filePath) => {
      let contents: string = '';
      await fs.readFile(filePath, (err, data) => {
        if (err) {
          throw err;
        }
        contents = data.toString();
      });
      const rows = contents.split('\n');
      rows.forEach(row => {
        const data = row.split('\t');
        if (data.length > 1) {
          list.push(new LogEntry({
            date: new Date(Number(data[0])),
            entry: data[1]
          }));
        } else if (data.length === 1) {
          list.push(new LogEntry({
            date: new Date(0),
            entry: data[0]
          }));
        }
      })
    });
  } catch (err) {
    throw err;
  }
  return list;
};

export default router;