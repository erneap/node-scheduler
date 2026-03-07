import { Request, Response, Router } from "express";
import { Logger } from "scheduler-node-models/general";
import { auth } from "../middleware/authorization.middleware";
import { Collection, ObjectId } from "mongodb";
import { collections, postLogEntry } from "scheduler-node-models/config";
import { AddUserRequest, IUser, UpdateUserRequest, User } from "scheduler-node-models/users";
import { IEmployee } from 'scheduler-node-models/scheduler/employees';
import { genSaltSync, hashSync } from "bcrypt-ts";

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
  const id = req?.params?.id as string;
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
      await postLogEntry('authentication', `user: Get: Error: ${id} - ${error.message}`);
      return res.status(404).send(`Unable to find User: ${id}`);
    }
  } else {
    await postLogEntry('authentication', 'user: Get: Error: No User collection');
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
  try {
    const colUsers: Collection | undefined = collections.users;
    const now = new Date();
    if (colUsers) {
      const adduser = req.body as AddUserRequest;
      // check for user's email address already in use.
      let query = { emailAddress: adduser.emailAddress };
      let iUser = await colUsers.findOne<IUser>(query);
      if (iUser) {
        throw new Error('User already present in database');
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
      const salt = genSaltSync(12)
      const hash = hashSync(adduser.password, salt);
      newUser.password = hash;
      newUser.passwordExpires = new Date();
      newUser.badAttempts = 0;

      const result = await colUsers.insertOne(newUser);

      // new user's identifier will be the one set by the database
      newUser.id = result.insertedId.toString();
      await postLogEntry('authentication', `User created: ${newUser.lastName}`);
      return res.status(201).json(newUser);
    } else {
      throw new Error('Unable to find collection');
    }
  } catch (err) {
    const error = err as Error;
    await postLogEntry('authentication', `user: Post: Error: ${error.message}`)
    return res.status(400).json({message: error.message });
  }
});

/**
 * This route is used to make changes to the user, through a user update request.  If the
 * user isn't present, an error message is recorded in the log and an error response is
 * provided.  All other changes are recorded in the log.
 */
router.put('/user', auth, async(req: Request, res: Response) => {
  try {
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
            const salt = genSaltSync(12)
            const hash = hashSync(update.value, salt);
            user.password = hash;
            user.passwordExpires = new Date();
            user.badAttempts = 0;
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
              user.questions.forEach((quest, i) => {
                if (quest.id === update.subid) {
                  switch (update.field.toLowerCase()) {
                    case "question":
                      quest.question = update.value;
                      break;
                    case "answer":
                      const salt = genSaltSync(12);
                      const result = hashSync(update.value.toLowerCase(), salt);
                      quest.answer = result;
                  }
                  user.questions[i] = quest;
                }
              });
            }
            break;
        }
        colUsers.replaceOne(query, user);
        res.status(200).json(user);
      } else {
        throw new Error('User not found');
      }
    } else {
      throw new Error('Unable to find collection');
    }
  } catch (err) {
    const error = err as Error;
    await postLogEntry('authentication', `user: Put: Error: ${error.message}`)
    return res.status(400).json({message: error.message });
  }
});

/**
 * This route will delete a user from the database collection of user, but only if the
 * user isn't attached to an employee.  Error reports would be for missing the user or
 * employee collection, employee record present, and/or user not found.
 */
router.delete('/user/:id', auth, async(req: Request, res: Response) => {
  try {
    const colUsers: Collection | undefined = collections.users;
    const colEmps: Collection | undefined = collections.employees;
    const now = new Date();
    if (colUsers && colEmps) {
      const id = req.params.id as string;
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
              throw new Error('No user deleted');
            }
          }
        } else {
          throw new Error(`User not found (${id})`);
        }
      } else {
        throw new Error('User id not provided');
      }
    } else {
      throw new Error('Unable to find collection');
    }
  } catch (err) {
    const error = err as Error;
    await postLogEntry('authentication', `user: Delete: Error: ${error.message}`)
    return res.status(400).json({message: error.message });
  }
});

export default router;