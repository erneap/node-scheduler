import { Request, Response, Router } from "express";
import { Logger } from "scheduler-node-models/general";
import { auth } from "../middleware/authorization.middleware";
import { Collection, ObjectId } from "mongodb";
import { collections } from "../config/mongoconnect";
import { AddUserRequest, IUser, UpdateUserRequest, User } from "scheduler-node-models/users";
import { IEmployee } from 'scheduler-node-models/scheduler/employees';

const router = Router();
const logger = new Logger(
  `${process.env.LOG_DIR}/authenticate/process_${(new Date().toDateString())}.log`);

/**
 * This route is used to retrieve a single user from the database collection.  It is 
 * based on a user id parameter passed in the request.  Expected errors are no user
 * collection, lack of expected user parameter or no user for the id provided.  All these
 * errors will annotated in the log, plus messages will be passed to the application 
 * interface.
 */
router.get('/user/:id', auth, async(req: Request, res: Response) => {
  const id = req?.params?.id;
  const colUser = collections.users;
  const now = new Date();
  if (colUser) {
    try {
      const query = { _id: new ObjectId(id) };
      const iUser = await colUser.findOne<IUser>(query);

      if (iUser && iUser !== null) {
        res.status(200).json(new User(iUser));
      }
    } catch (e) {
      const error = e as Error;
      logger.log(`${now.toISOString()} - ${id}: ${error.message}`)
      return res.status(404).send(`Unable to find User: ${id}`);
    }
  } else {
    logger.log(`${now.toISOString()} - User collection not found`);
    return res.status(404).json({'message': 'User Collection not found'});
  }
});

/**
 * This route will create a new user in the database collection, but first it will check
 * for the user already being present by email address.  If not present in the database, 
 * the user is created, but if any are present and error will 
 * be returned to the requestor.
 */
router.post('/user', auth, async(req: Request, res: Response) => {
  const colUsers: Collection | undefined = collections.users;
  const now = new Date();
  if (colUsers) {
    const adduser = req.body as AddUserRequest;
    // check for user's email address already in use.
    let query = { emailAddress: adduser.emailAddress };
    let iUser = await colUsers.findOne<IUser>(query);
    if (iUser) {
      logger.log(`${now.toISOString()} - User already present in database `
        + `(${adduser.emailAddress})`);
      return res.status(400).json({'message': 'User already present in database'});
    }

    // if not already in the database, add this new user
    const newUser = new User();
    newUser.emailAddress = adduser.emailAddress;
    newUser.firstName = adduser.firstName;
    if (adduser.middleName) {
      newUser.middleName = adduser.middleName;
    }
    newUser.lastName = adduser.lastName;
    if (adduser.permissions && adduser.permissions.length > 0) {
      adduser.permissions.forEach(perm => {
        newUser.workgroups.push(perm);
      });
    }
    newUser.setPassword(adduser.password);

    const result = await colUsers.insertOne(newUser);

    // new user's identifier will be the one set by the database
    newUser.id = result.insertedId.toString();
    logger.log(`${now.toISOString()} - New user created: ${newUser.emailAddress}`);
    return res.status(201).json(newUser);
  } else {
    logger.log(`${now.toISOString()} - No user collections`);
    return res.status(404).json({'message': 'Unable to find collection'});
  }
});

/**
 * This route is used to make changes to the user, through a user update request.  If the
 * user isn't present, an error message is recorded in the log and an error response is
 * provided.  All other changes are recorded in the log.
 */
router.put('/user', auth, async(req: Request, res: Response) => {
  const colUsers: Collection | undefined = collections.users;
  const now = new Date();
  if (colUsers) {
    const update = req.body as UpdateUserRequest;
    const query = { '_id': new ObjectId(update.id) };
    const iUser = await colUsers.findOne<IUser>(query);
    if (iUser) {
      const user = new User(iUser);
      switch (update.field.toLowerCase()) {
        case "email":
        case "emailaddress":
          user.emailAddress = update.value;
          let found = false;
          user.additionalEmails.forEach(email => {
            if (email.toLowerCase() === update.value.toLowerCase()) {
              found = true;
            }
          });
          if (!found) {
            user.additionalEmails.push(update.value);
          }
          break;
        case "password":
          user.setPassword(update.value);
          break;
        case "unlock":
          user.badAttempts = 0;
          break;
        case "first":
        case "firstname":
          user.firstName = update.value;
          break;
        case "middle":
        case "middlename":
          user.middleName = update.value;
          break;
        case "last":
        case "lastname":
          user.lastName = update.value;
          break;
        case "addperm":
          user.workgroups.push(update.value);
          break;
        case "removeperm":
          let index = -1;
          user.workgroups.forEach((wg, w) => {
            if (wg.toLowerCase() === update.value.toLowerCase()) {
              index = w;
            }
          });
          if (index >= 0) {
            user.workgroups.splice(index, 1);
          }
          break;
        case "addemail":
          let efound = false;
          user.additionalEmails.forEach(email => {
            if (email.toLowerCase() === update.value.toLowerCase()) {
              efound = true;
            }
          });
          if (!efound) {
            user.additionalEmails.push(update.value);
          }
          break;
        case "removeemail":
          let eIndex = -1;
          user.additionalEmails.forEach((em, e) => {
            if (em.toLowerCase() === update.value.toLowerCase()) {
              eIndex = e;
            }
          });
          if (eIndex >= 0) {
            user.additionalEmails.splice(eIndex, 1);
          }
          break;
        case "securityquestion":
          if (update.subid) {
            user.updateSecurityQuestion(update.subid, update.field, update.value);
          }
          break;
      }
      colUsers.replaceOne(query, user);
      res.status(200).json(user);
    } else {
      logger.log(`${now.toISOString()} - User not found for update `
        + `(${update.id})`);
      return res.status(400).json({'message': 'User not found'});
    }
  } else {
    logger.log(`${now.toISOString()} - No user collections`);
    return res.status(404).json({'message': 'Unable to find collection'});
  }
});

/**
 * This route will delete a user from the database collection of user, but only if the
 * user isn't attached to an employee.  Error reports would be for missing the user or
 * employee collection, employee record present, and/or user not found.
 */
router.delete('/user/:id', auth, async(req: Request, res: Response) => {
  const colUsers: Collection | undefined = collections.users;
  const colEmps: Collection | undefined = collections.employees;
  const now = new Date();
  if (colUsers && colEmps) {
    const id = req.params.id;
    if (id) {
      // first query the users collection to ensure the user was present
      const query = { _id: new ObjectId(id) };
      const iUser = await colUsers.findOne<IUser>(query);
      if (iUser) {
        // if the user is present, check for the user in the employee collection
        const iEmp = await colEmps.findOne<IEmployee>(query);
        // if present, stop the deletion and send error message.
        if (iEmp) {
          return res.status(401).json({'message': 'Deletion refused, employee present'})
        } else {
          // if not present, delete the user.
          const results = await colUsers.deleteOne(query);
          if (results.deletedCount > 0) {
            logger.log(`${now.toISOString()} - User deleted: ${iUser.lastName}`)
            return res.status(200).json({'message': 'User deleted'});
          } else {
            return res.status(400).json({'message': 'No user deleted'});
          }
        }
      } else {
        return res.status(404).json({'message': `User not found (${id})`});
      }
    } else {
      return res.status(404).json({'message': 'User id not provided'});
    }
  } else {
    logger.log(`${now.toISOString()} - No user/employee collections`);
    return res.status(404).json({'message': 'Unable to find collection'});
  }
});

export default router;