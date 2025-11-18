import { Request, Response, Router } from "express";
import { Collection } from "mongodb";
import { collections } from "../config/mongoconnect";
import { IUser, User } from 'scheduler-node-models/users';
import { Logger } from "scheduler-node-models/general";
import { auth } from '../middleware/authorization.middleware';

const router = Router();
const logger = new Logger(
  `${process.env.LOG_DIR}/authenticate/process_${(new Date().toDateString())}.log`);

/**
 * This route will provide a list of users in the system.  It does this by pulling all the
 * pulling all the users from the user collection object.  If the collection doesn't 
 * exist, an error message will be provided.
 */
router.get('/users', auth, async(req: Request, res: Response) => {
  const colUsers: Collection | undefined = collections.users;
  if (colUsers) {
    const cursor = colUsers.find<IUser>({});
    let results = await cursor.toArray();
    const list: User[] = [];
    results.forEach(u => {
      list.push(new User(u));
    });
    list.sort((a,b) => a.compareTo(b));
    return res.status(200).json(list)
  } else {
    const now = new Date();
    logger.log(`${now.toISOString()} - No user collections`);
    return res.status(404).json({'message': 'Unable to find collection'});
  }
});

export default router;