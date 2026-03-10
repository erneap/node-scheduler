import { compare, compareSync } from 'bcrypt-ts';
import express, { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { collections } from 'scheduler-node-models/config';
import { AuthenticationRequest, IUser, User } from 'scheduler-node-models/users';
import * as jwt from 'jsonwebtoken';

const router = express.Router();

/**
 * This route will provide the method to log into the site using the user's registered
 * email address and password.  It will return a json web token value for a good log in, 
 * or an error message for a bad one.  If the authentication is successful, the access
 * log will reflect the try as successful, conversely, if unsucessful the access log
 * will reflect this and a possible reason.  Other authentication logging will be completed
 * for errors in the process.
 */
router.post('/authenticate', async (req: Request, res: Response) => {
  try {
    const data = req.body as AuthenticationRequest;
    const colUsers = collections.users;
    if (colUsers) {
      if (data.emailAddress !== '' && data.password !== '') {
        const query = { emailAddress: data.emailAddress };
        const iUser = await colUsers.findOne<IUser>(query);
        if (iUser) {
          let msg = '';
          const user = new User(iUser);
          if (user.password && await compareSync(data.password, user.password)) {
            if (user.badAttempts > 2) {
              return res.status(400).json({message: 'Account locked'});
            }
            user.badAttempts = 0;
            if (user.id) {
              const key = process.env.JWT_SECRET;
              const expires = process.env.JWT_EXPIRES;
              if (key && expires) {
                const accessToken = jwt.sign({ _id: user.id.toString() }, key,
                  { expiresIn: expires as any});
                res.setHeader('authorization', accessToken);
              }
              const rKey = process.env.JWT_REFRESH_SECRET;
              const rExpires = process.env.JWT_REFRESH_EXPIRES;
              if (rKey && rExpires) {
                const refreshToken = jwt.sign({ _id: user.id.toString() }, rKey, {
                  expiresIn: rExpires as any,
                });
                res.setHeader('refreshToken', refreshToken);
              }
            }
            res.status(200).json(user);
          } else {
            user.badAttempts++;
            msg = 'Authentication error';
          }
          await colUsers.replaceOne(query, user);
          if (msg !== '') {
            throw new Error(msg);
          }
        } else {
          throw new Error('User not found');
        }
      } else {
        throw new Error('Required data missing');
      }
    } else {
      throw new Error('No users collection')
    }
  } catch (err) {
    const error = err as Error;
    console.log(error);
    res.status(400).json(
      {message: `Authentication: Post: Authenticate: ${error.message}`}
    );
  }
})

export default router;