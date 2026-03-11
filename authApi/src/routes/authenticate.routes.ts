import { compare, compareSync } from 'bcrypt-ts';
import express, { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { collections, postLogEntry } from 'scheduler-node-models/config';
import { AuthenticationRequest, IUser, User } from 'scheduler-node-models/users';
import * as jwt from 'jsonwebtoken';
import { auth } from '../middleware/authorization.middleware';

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
              postLogEntry('Authentication', `Account Locked: ${user.getFirstLast()}`)
              return res.status(400).json({message: 'Account locked'});
            } else if (user.badAttempts >= 0) {
              user.badAttempts = 0;
            }
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
            postLogEntry('Authentication', `User logged in: ${user.getFirstLast()}`)
            res.status(200).json(user);
          } else {
            user.badAttempts++;
            msg = 'User ID/Password mismatch';
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
    postLogEntry('Authentication', `Post: Authenticate: ${error.message}`);
    res.status(400).json(
      {message: `Authentication: Post: Authenticate: ${error.message}`}
    );
  }
});

/**
 * This route is used to record a user logging out of an application.  The access log is
 * used to record the logging out, plus the removal of access and refresh token
 */
router.delete('/authenticate/:id', auth, async (req: Request, res: Response ) => {
  try {
    const id = req.params.id as string;
    const colUsers = collections.users;
    if (colUsers) {
      if (id && id !== '') {
        const query = { _id: new ObjectId(id) };
        const iUser = await colUsers.findOne<IUser>(query);
        if (iUser) {
          res.removeHeader('authorization');
          res.removeHeader('refreshToken');
          const user = new User(iUser);
          postLogEntry('Authentication', `User logged out: ${user.getFirstLast()}`);
          res.status(200).json({message: 'logged out'})
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
    postLogEntry('Authentication', `Delete: Authenticate: ${error.message}`);
    res.status(400).json(
      {message: `Authentication: Delete: Authenticate: ${error.message}`}
    );
  }
});

/**
 * This route will be used to process a new access token because the old one has expired
 * but the refresh token is still valid.
 */
router.put('/refresh', auth, async (req: Request, res: Response ) => {
  try {
    const rToken = req.headers['refreshtoken'];
    if (!rToken) {
      return res.status(401).send('Access Denied. No refresh token provided.')
    }
    const refreshToken = rToken as string;
    const key = (process.env.JWT_SECRET) ? process.env.JWT_SECRET : 'SECRET';
    const secret = (process.env.JWT_REFRESH_SECRET) 
      ? process.env.JWT_REFRESH_SECRET : 'SECRET';
    const expires = (process.env.JWT_EXPIRES)
      ? process.env.JWT_REFRESH_EXPIRES : '1d';

    const decoded = jwt.verify(refreshToken, secret) as jwt.JwtPayload;
    const accessToken = jwt.sign({ _id: decoded._id.toString() }, key,
              { expiresIn: expires as any});
    return res.setHeader('authorization', accessToken).json({message: 'refresh token'});
  } catch (err) {
    const error = err as Error;
    postLogEntry('Authentication', `Put: Refresh: ${error.message}`);
    res.status(400).json(
      {message: `Authentication: Put: Refresh: ${error.message}`}
    );
  }
});

export default router;