import express, { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { AddUserRequest, IUser, UpdateUserRequest, User } 
  from 'scheduler-models/users';
import { IEmployee } from 'scheduler-models/scheduler/employees'
import { auth } from '../middleware/authorization.middleware';
import { compareSync, genSaltSync, hashSync } from 'bcrypt-ts';
import { EmployeeService, UserService, collections, postLogEntry } from 'scheduler-services';

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
    const uid = req.params.id as string;
    const uService = new UserService();
    const iUser = await uService.get(uid)
    res.status(200).json(new User(iUser));
  } catch (err) {
    const error = err as Error;
    postLogEntry('Users', `Get: UserById: ${error.message}`);
    res.status(400).json({message: `User: Get: UserById: ${error.message}`});
  }
});

/**
 * This route will provide a list of users in the system.  It does this by pulling all the
 * pulling all the users from the user collection object.  If the collection doesn't 
 * exist, an error message will be provided.
 */
router.get('/users', auth, async (req: Request, res: Response) => {
  try {
    const uService = new UserService();
    const list = await uService.getAll();
    return res.status(200).json(list);
  } catch (err) {
    const error = err as Error;
    postLogEntry('Users', `Get: AllUsers: ${error.message}`);
    res.status(400).json({message: `User: Get: AllUsers: ${error.message}`});
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
    const adduser = req.body as AddUserRequest;
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

    const uService = new UserService();
    const user = await uService.insert(newUser);
    await postLogEntry('authentication', `User created: ${user.lastName}`);
    return res.status(201).json(user);
  } catch (err) {
    const error = err as Error;
    await postLogEntry('authentication', `user: Post: Add User Error: ${error.message}`);
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
    const uService = new UserService();
    const now = new Date();
    const update = req.body as UpdateUserRequest;
    const user = await uService.get(update.id);
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
            if (quest.id === update.subid && update.subfield) {
              switch (update.subfield.toLowerCase()) {
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
      case "mustchange":
        // first check to see if the provided old password is correct
        let oldpwd = '';
        if (update.subfield) {
          oldpwd = update.subfield;
        }
        let password = '';
        if (user.password) {
          password = user.password;
        }
        if (compareSync(oldpwd, password)) {
          // if correct, update the password.
          const salt = genSaltSync(12)
          const hash = hashSync(update.value, salt);
          user.password = hash;
          user.passwordExpires = new Date();
          user.badAttempts = 0;
        } else {
          throw new Error('Old password mismatch');
        }
        break;
      default:
        throw new Error(`Unknown update field: ${update.field}`);
    }
    await uService.replace(user);
    res.status(200).json(user);
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
    const uService = new UserService();
    const empService = new EmployeeService();
    const id = req.params.id as string;
    if (id) {
      let empFound = false;
      try {
        const emp = await empService.get(id);
        if (emp) {
          empFound = true;
        }
      } catch (err) {}
      if (empFound) {
        throw new Error('Deletion refused, Employee present');
      }
      const dID = (req as any).user;
      const delUser = await uService.get(dID);
      const user = await uService.get(id);
      await uService.remove(id);
      postLogEntry('authentication', `User deleted: ${user.getFirstLast()}, `
        + `By: ${delUser.getFirstLast()}`)
      return res.status(200).json({'message': 'User deleted'});
    } else {
      throw new Error('No user identifier');
    }
  } catch (err) {
    const error = err as Error;
    await postLogEntry('authentication', `user: Delete: Error: ${error.message}`)
    return res.status(400).json({message: error.message });
  }
});

export default router;