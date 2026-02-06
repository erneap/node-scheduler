import { Request, Response, Router } from "express";
import { Collection } from "mongodb";
import { collections } from "scheduler-node-models/config";
import { AuthenticationRequest, IUser, User } from 'scheduler-node-models/users';
import * as jwt from 'jsonwebtoken';
import { Logger } from "scheduler-node-models/general";
import { auth } from '../middleware/authorization.middleware';

const router = Router();
const logger = new Logger(
  `${process.env.LOG_DIR}/authenticate/process_${(new Date().toDateString())}.log`);
const accessLog = new Logger(
  `${process.env.LOG_DIR}/authenticate/access_${(new Date()).toDateString()}.log`);

/**
 * This route will provide the method to log into the site using the user's registered
 * email address and password.  It will return a json web token value for a good log in, 
 * or an error message for a bad one.  If the authentication is successful, the access
 * log will reflect the try as successful, conversely, if unsucessful the access log
 * will reflect this and a possible reason.  Other authentication logging will be completed
 * for errors in the process.
 */
router.post('/authenticate', async(req: Request, res: Response) => {
  const colUser: Collection | undefined = collections.users;
  const aRequest = req.body as AuthenticationRequest;
  const now = new Date();
  if (colUser && aRequest) {
    const query = { 'emailAddress': aRequest.emailAddress };
    const iUser = await colUser.findOne<IUser>(query);
    if (iUser && iUser !== null) {
      const user = new User(iUser);
      try {
        user.checkPassword(aRequest.password);
        colUser.replaceOne(query, user);
      } catch (e) {
        colUser.replaceOne(query, user);
        const error = e as Error
        accessLog.log(`${now.toISOString()} - ${user.lastName}: ${error.message}`);
        res.status(401).json({'message': error.message});
        return
      }
      // passed user id and password test, so now create a jsonwebtoken and refresh token
      // with the expirations of 1 hour and 1 day respectively
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
      accessLog.log(`${now.toISOString()} - ${user.lastName}: Success`);
      return res.status(200).json(user);
    } else {
      accessLog.log(`${now.toISOString()} - ${aRequest.emailAddress} - Not Found`);
      res.status(404).json({'message': 'User not found'});
    }
  } else {
    logger.log(`${now.toISOString()} - No request object or collection`);
    res.status(404).json({'message': 'No request object or collection'});
  }
});

/**
 * This route is used to record a user logging out of an application.  The access log is
 * used to record the logging out, plus the removal of access and refresh token
 */
router.delete('/authenticate/:userid', auth, async(req: Request, res: Response) => {
  let userid = req.params.userid as string;
  const now = new Date();
  const colUser: Collection | undefined = collections.users;
  if (colUser) {
    if (!userid) {
      let aToken = req.headers['authorization'];
      if (!aToken) {
        return res.status(401).send('Access Denied.  No Token Provided.');
      }
      let accessToken = aToken as string;
      const key = (process.env.JWT_SECRET) ? process.env.JWT_SECRET as string : 'secret';
      const decoded = jwt.verify(accessToken, key);
      userid = (decoded as jwt.JwtPayload)._id;
    }
    let query = {};
    if (userid) {
      if (userid.indexOf('@') > 0) {
        // assume the user id is an email address
        query = { emailAddress: userid };
      } else {
        query = { id: userid };
      }
      const iUser = await colUser.findOne<IUser>(query);
      res.removeHeader('authorization');
      res.removeHeader('refreshToken');
      if (iUser) {
        accessLog.log(`${now.toISOString()} - ${iUser.lastName}: logged out.`);
        res.status(200).json({"message": 'logged out'});
      } else {
        accessLog.log(`${now.toISOString()} - ${userid}: Not found`);
        res.status(404).json({'message': 'User not found'})
      }
    } else {
      accessLog.log(`${now.toISOString()} - ${userid}: Not found`);
      res.status(404).json({'message': 'User not found'})
    }
  } else {
    res.status(404).json({'message': 'No user collection'})
  }
});

/**
 * This route will be used to process a new access token because the old one has expired
 * but the refresh token is still valid.
 */
router.put('/refresh', auth, async(req: Request, res: Response) => {
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

  try {
    const decoded = jwt.verify(refreshToken, secret) as jwt.JwtPayload;
    const accessToken = jwt.sign({ _id: decoded.id.toString() }, key,
              { expiresIn: expires as any});
    return res
      .cookie('Authorization', accessToken, {
          httpOnly: true,
          sameSite: 'strict'
        })
      .send(decoded._id);
  } catch (error) {
    return res.status(400).send('Invalid refresh token.');
  }
});

export default Router;