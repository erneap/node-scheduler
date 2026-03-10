import express, { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { collections } from 'scheduler-node-models/config';
import { IUser, User } from 'scheduler-node-models/users';
import { auth } from '../middleware/authorization.middleware';

const router = express.Router();

/**
 * This route is used to retrieve a single user from the database collection.  It is 
 * based on a user id parameter passed in the request.  Expected errors are no user
 * collection, lack of expected user parameter or no user for the id provided.  All these
 * errors will annotated in the log, plus messages will be passed to the application 
 * interface.
 */
router.get('/user/:id', auth, async(req: Request, res: Response) => {
  try {
    const colUsers = collections.users;
    if (colUsers) {
      const id = req.params.id as string;
      if (id && id !== '') {
        const query = { _id: new ObjectId(id)};
        const iUser = await colUsers.findOne<IUser>(query);
        if (iUser) {
          const user = new User(iUser);
          res.status(200).json(user);
        } else {
          throw new Error('User not found');
        }
      } else {
        throw new Error('No user id provided');
      }
    } else {
      throw new Error('No users collection')
    }
  } catch (err) {
    const error = err as Error;
    console.log(error);
    res.status(400).json({message: `User: Get: User: ${error.message}`});
  }
});

/**
 * This route will provide a list of users in the system.  It does this by pulling all the
 * pulling all the users from the user collection object.  If the collection doesn't 
 * exist, an error message will be provided.
 */
router.get('/users', auth, async (req: Request, res: Response) => {
  try {
    const colUsers = collections.users;
    if (colUsers) {
      const cursor = colUsers.find<IUser>({});
      let results = await cursor.toArray();
      const list: User[] = [];
      results.forEach(u => {
        list.push(new User(u));
      });
      list.sort((a,b) => a.compareTo(b));
      return res.status(200).json(list);
    } else {
      throw new Error('No users collection')
    }
  } catch (err) {
    const error = err as Error;
    console.log(error);
    res.status(400).json({message: `User: Get: Users: ${error.message}`});
  }
});

export default router;