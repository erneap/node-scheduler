import { Request, Response, Router } from "express";
import { Log, LogList } from "scheduler-node-models/general";
import * as fs from 'fs';

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
      directories.forEach(dir => {
        const log = new Log();
        log.name = dir;
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

export default router;